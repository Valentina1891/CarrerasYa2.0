const express = require('express');
const cors = require('cors'); // Importa cors
const { validarUsuario } = require('./Login/Valida');
const { registrarUsuario } = require('./Login/Registra'); // Importa la función de registro
const {obtenerPerfilCompleto} = require('./Perfil/Perfil')
const {obtenerPalabrasUsuario,agregarPalabrasClave} = require('./PalabrasUsario/PalabrasUsuario')
const PrimerNivel = require('./PrimerNivel/PrimerNivel');
const SegundoNivel = require('./SegundoNivel/SegundoNivel');
const segundoNivelRoutes = require('./SegundoNivel/SegundoNivel');
const tercerNivelRoutes = require('./TercerNivel/TercerNivel');
const {obtenerTopCarreras} = require('./Recomendacion/Recomendacion');
const {obtenerUniversidadesPorCarrera} = require('./Recomendacion/Recomendacion');
const {resetTestData} = require('./ResetData/ResetTestData');
const Formulario = require('./Formulario/Formulario');
const mongoose = require('mongoose'); // Falta esta línea en router.js

const router = express.Router();

router.get('/validar', async (req, res) => {
    const { usuario, contrasena } = req.query;
  
    try {
      const resultado = await validarUsuario(usuario, contrasena);
      res.status(200).json(resultado);  // Enviamos el resultado, incluyendo userId, al frontesnd
    } catch (error) {
      console.error("Error en la validación del usuario:", error.message);
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  });
  
  
  // Controlador POST para registrar usuariosS
  router.post('/registrar', async (req, res) => {
    const { nombre, correo, contrasena } = req.body; // Datos de registro enviados en el cuerpo de la solicitud
  
    try {
      const resultado = await registrarUsuario(nombre, correo, contrasena);
      res.status(201).json(resultado);
    } catch (error) {
      console.error("Error en el registro del usuario:", error.message);
      if (error.message === 'El usuario ya está registrado') {
        res.status(409).json({ mensaje: error.message }); // Código 409 para conflictos
      } else {
        res.status(500).json({ mensaje: 'Error en el servidor' });
      }
    }
  });
  
  
  
  router.get('/perfil/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`ID recibido: ${id}`);
  
    try {
      const objectId = new mongoose.Types.ObjectId(id);
      console.log('ObjectId convertido:', objectId);
  
      const perfil = await obtenerPerfilCompleto(objectId);
      console.log('Perfil encontrado:', perfil);
  
      if (!perfil) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }
  
      res.status(200).json(perfil);
    } catch (error) {
      console.error('Error al obtener el perfil del usuario:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  });
  
  
  router.post('/perfil/reiniciar-datos-test', async (req, res) => {
    const { usuarioId } = req.body;
    console.log("Reiniciando datos del test para usuario:", usuarioId);
  
    try {
        const resultado = await resetTestData(usuarioId);
        res.status(200).json(resultado);
    } catch (error) {
        console.error("Error en /reiniciar-datos-test:", error.message);
        res.status(500).json({ mensaje: 'Error al reiniciar datos del test' });
    }
  });
  
  
  
  // Nueva ruta para obtener todas las preguntas del Nivel 1
  router.get('/primernivel', async (req, res) => {
    try {
      const preguntas = await PrimerNivel.find(); // Consulta a la base de datos
  
      if (preguntas.length === 0) {
        return res.status(404).json({ mensaje: 'No se encontraron preguntas en este nivel.' });
      }
  
      res.status(200).json({ mensaje: 'Preguntas del Nivel 1 obtenidas correctamente', preguntas });
    } catch (error) {
      console.error('Error al obtener las preguntas del Nivel 1:', error);
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  });
  
  async function procesarRespuestas(respuestas) {
    try {
      const respuestasAfirmativas = respuestas.filter(r => r.afirmativa);
  
      // Convierte los IDs a ObjectId
      const ids = respuestasAfirmativas.map(r => new mongoose.Types.ObjectId(r.idPregunta));
  
      // Busca las preguntas en la colección
      const preguntas = await PrimerNivel.find({ _id: { $in: ids } });
  
      // Extrae palabras clave
      const palabrasClave = preguntas.flatMap(p => 
        [p.PALABRA_CLAVE_1, p.PALABRA_CLAVE_2].filter(Boolean)
      );
  
      return palabrasClave;
    } catch (error) {
      console.error('Error en procesarRespuestas:', error);
      throw new Error('Error al procesar respuestas');
    }
  }
  
  // Ruta para procesar la respuesta
  router.post('/procesar-respuesta', async (req, res) => {
    try {
      const { usuarioId, respuestas } = req.body;
  
      console.log('Datos recibidos:', req.body); // Verifica que el backend reciba los datos correctamente
  
      if (!respuestas || !Array.isArray(respuestas)) {
        return res.status(400).json({ mensaje: 'Formato de respuestas no válido' });
      }
  
      const respuestasAfirmativas = respuestas.filter(r => r.afirmativa);
      const ids = respuestasAfirmativas.map(r => new mongoose.Types.ObjectId(r.idPregunta));
      const preguntas = await PrimerNivel.find({ _id: { $in: ids } });
      const palabrasClave = preguntas.flatMap(p => [p.PALABRA_CLAVE_1, p.PALABRA_CLAVE_2].filter(Boolean));
  
      await agregarPalabrasClave(usuarioId, palabrasClave);
  
      res.status(200).json({ mensaje: 'Palabras clave registradas correctamente', palabras: palabrasClave });
    } catch (error) {
      console.error('Error en /procesar-respuesta:', error);
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  });
  
  
  router.use('/segundoNivel', segundoNivelRoutes);
  
  router.use('/tercerNivel', tercerNivelRoutes);
  
  // Ruta para obtener el top de carreras
  router.get('/top-carreras/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    console.log("Endpoint /top-carreras llamado con usuarioId:", usuarioId);
  
    try {
        const topCarreras = await obtenerTopCarreras(usuarioId);
        console.log("Resultado de obtenerTopCarreras:", topCarreras);
        res.json(topCarreras);
    } catch (error) {
        console.error("Error en el endpoint /top-carreras:", error.message);
        res.status(500).json({ error: 'Error al obtener el top de carreras' });
    }
  });
  ;
  
  
  router.get('/universidades-por-carrera/:carreraId', async (req, res) => {
    const { carreraId } = req.params;
    console.log("Llamando a obtenerUniversidadesPorCarrera con carreraId:", carreraId);
  
    try {
        const resultado = await obtenerUniversidadesPorCarrera(carreraId);
        res.json(resultado);
    } catch (error) {
        console.error("Error en el endpoint /universidades-por-carrera:", error.message);
        res.status(500).json({ error: 'Error al obtener universidades para la carrera' });
    }
  });
  
  router.post('/enviarFormulario', async (req, res) => {
    console.log("Datos recibidos:", req.body);  // Esto mostrará los datos recibidos en el terminal
    const { idUsuario, Pregunta1, Pregunta2, Pregunta3, Pregunta4 } = req.body;
  
    try {
      const nuevaRespuesta = new Formulario({
        idUsuario: new mongoose.Types.ObjectId(idUsuario),
        Pregunta1,
        Pregunta2,
        Pregunta3,
        Pregunta4
      });
  
      await nuevaRespuesta.save();
      res.status(201).json({ mensaje: 'Respuestas guardadas correctamente' });
    } catch (error) {
      console.error('Error al guardar el formulario:', error);
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  });

  module.exports = router;