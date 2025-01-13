const express = require('express');
const mongoose = require('mongoose');
const PreguntaNivel2 = require('./PreguntaNivel2');
const RespuestaNivel2 = require('./RespuestaNivel2');
const { agregarPalabrasClave, obtenerPalabrasUsuario } = require('../PalabrasUsario/PalabrasUsuario');
const { Usuario } = require('../Login/Valida'); // Modelo de Usuario
const {Area} = require('./Area');


const router = express.Router();



const sessionStatus = {};
const obtenerAreaConMayorCoincidencia = async (usuarioId) => {
  try {
    const palabrasUsuario = await obtenerPalabrasUsuario(usuarioId);
    const palabrasClaveUsuario = palabrasUsuario.map((palabra) => palabra.PALABRA.toLowerCase());

    const todasAreas = await Area.find({});
    let mejorArea = null;
    let maxCoincidencias = 0;

    todasAreas.forEach(area => {
      const palabrasArea = area.PALABRAS_C.split(',').map(p => p.trim().toLowerCase());
      const coincidencias = palabrasClaveUsuario.filter(p => palabrasArea.includes(p)).length;

      if (coincidencias > maxCoincidencias) {
        maxCoincidencias = coincidencias;
        mejorArea = area;
      }
    });

    return mejorArea ? mejorArea.NOMBRE : null;
  } catch (error) {
    console.error("Error al obtener el área con mayor coincidencia:", error);
    return null;
  }
};
// Función para finalizar el nivel 2 y actualizar el área del usuario
const finalizarNivel2 = async (usuarioId) => {
  try {
    // Paso 1: Obtener el área con mayor puntaje
    const resultado = await RespuestaNivel2.aggregate([
      { $match: { USUARIO_ID: new mongoose.Types.ObjectId(usuarioId) } }, // Filtrar por usuario
      { $group: { _id: "$AREA_ID", totalPuntaje: { $sum: "$PUNTAJE" } } }, // Agrupar y sumar puntajes por AREA_ID
      { $sort: { totalPuntaje: -1 } }, // Ordenar por totalPuntaje descendente
      { $limit: 1 } // Tomar solo el área con el mayor puntaje
    ]);

    const mejorAreaId = resultado[0]?._id;

    if (mejorAreaId) {
      // Paso 2: Obtener el nombre del área en la colección `areas`
      const area = await Area.findOne({ ID: mejorAreaId });

      if (area) {
        // Paso 3: Actualizar el perfil del usuario con el nombre del área
        await Usuario.findByIdAndUpdate(usuarioId, { area: area.NOMBRE });
        console.log(`Área de mayor coincidencia (${area.NOMBRE}) asignada al usuario ${usuarioId}`);
      } else {
        console.log("No se encontró el área correspondiente en la colección de `areas`.");
      }
    } else {
      console.log("No se encontró un área con coincidencias suficientes para el usuario.");
    }
  } catch (error) {
    console.error("Error al finalizar el nivel 2 y actualizar el área del usuario:", error);
  }
};


// Endpoint para iniciar el proceso de preguntas
router.get('/iniciarPreguntas', async (req, res) => {
  const { usuarioId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    return res.status(400).json({ mensaje: 'ID de usuario no válido' });
  }

  try {
    const areasActivas = await obtenerAreasActivas(usuarioId);
    const preguntasPendientes = {};
    console.log(areasActivas);
    // Inicializar preguntas pendientes por área
    for (const area of areasActivas) {
      const preguntas = await PreguntaNivel2.find({ AREA_ID: area });
      preguntasPendientes[area] = preguntas;
    }

    // Guardar el estado de sesión para el usuario
    sessionStatus[usuarioId] = { 
      preguntasPendientes, 
      respuestasNegativasPorArea: {}, 
      areasDescartadas: new Set() 
    };

    // Enviar la primera pregunta
    enviarPregunta(usuarioId, res);
  } catch (error) {
    console.error("Error al iniciar el proceso de preguntas:", error);
    res.status(500).json({ mensaje: 'Error al iniciar el proceso de preguntas' });
  }
});

// Función para enviar una pregunta
const enviarPregunta = (usuarioId, res) => {
  const estado = sessionStatus[usuarioId];

  for (const areaId in estado.preguntasPendientes) {
    const preguntas = estado.preguntasPendientes[areaId];

    if (preguntas.length > 0) {
      const pregunta = preguntas.shift(); // Eliminar la pregunta actual de la lista
      estado.preguntasPendientes[areaId] = preguntas;

      // Enviar la pregunta actual
      return res.status(200).json({ pregunta, areaId });
    }
  }

  // Si no hay más preguntas disponibles
  res.status(200).json({ mensaje: 'Preguntas completadas o áreas descartadas' });
};

// Endpoint para recibir la respuesta del usuario
router.post('/responderPregunta', async (req, res) => {
  const { usuarioId, areaId, preguntaId, respuesta } = req.body;

  if (!sessionStatus[usuarioId]) {
    return res.status(400).json({ mensaje: 'Sesión de usuario no encontrada' });
  }

  const estado = sessionStatus[usuarioId];

  try {
    if (respuesta === 'sí') {
      const puntaje = req.body.puntaje;
      console.log("Datos recibidos:", { usuarioId, areaId, preguntaId, respuesta, puntaje });

      // Guardar la respuesta en la base de datos
      await RespuestaNivel2.create({
        USUARIO_ID: new mongoose.Types.ObjectId(usuarioId),
        PREGUNTA_ID: new mongoose.Types.ObjectId(preguntaId),
        AREA_ID: areaId,
        PUNTAJE: puntaje,
        NIVEL: 2
      });

      // Verificar que el usuario existe antes de agregar palabras clave
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario) {
        console.error("Usuario no encontrado al intentar agregar palabras clave.");
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      // Agregar palabras clave al perfil del usuario
      const pregunta = await PreguntaNivel2.findById(preguntaId);
      const palabrasClave = [pregunta.PALABRA_CLAVE_1, pregunta.PALABRA_CLAVE_2].filter(Boolean);
      await agregarPalabrasClave(usuarioId, palabrasClave);
      console.log("Palabras clave agregadas correctamente a palabras_usuario");
    } else if (respuesta === 'no') {
      estado.respuestasNegativasPorArea[areaId] = (estado.respuestasNegativasPorArea[areaId] || 0) + 1;

      // Si hay 6 respuestas negativas, descartar el área
      if (estado.respuestasNegativasPorArea[areaId] >= 6) {
        estado.areasDescartadas.add(areaId);
        console.log(`Área ${areaId} descartada por exceso de respuestas negativas`);
      }
    }

    // Verificar si todas las preguntas han sido respondidas
    const todasPreguntasCompletadas = Object.values(estado.preguntasPendientes).every(area => area.length === 0);

    if (todasPreguntasCompletadas) {
      // Llamar a finalizarNivel2 y luego responder al frontend
      await finalizarNivel2(usuarioId);
      return res.status(200).json({ mensaje: 'Nivel 2 completado y área actualizada.' });
    } else {
      // Enviar la siguiente pregunta si aún quedan preguntas pendientes
      enviarPregunta(usuarioId, res);
    }
  } catch (error) {
    console.error("Error al procesar la respuesta:", error);
    res.status(500).json({ mensaje: 'Error al procesar la respuesta', error: error.message });
  }
});


// Función auxiliar para obtener áreas activas basadas en coincidencias de palabras clave
const obtenerAreasActivas = async (usuarioId) => {
  try {
    const palabrasUsuario = await obtenerPalabrasUsuario(usuarioId);
    const palabrasClaveUsuario = palabrasUsuario.map((palabra) => palabra.PALABRA.toLowerCase());

    const todasAreas = await Area.find({});
    const coincidenciasPorArea = todasAreas
      .filter(area => area.ID) // Filtrar solo áreas con ID válido
      .map(area => {
        const palabrasArea = area.PALABRAS_C.split(',').map(p => p.trim().toLowerCase());
        const coincidencias = palabrasClaveUsuario.filter(p => palabrasArea.includes(p)).length;
        return { areaId: area.ID, coincidencias };
      });

    coincidenciasPorArea.sort((a, b) => b.coincidencias - a.coincidencias);
    const top5Coincidencias = coincidenciasPorArea.slice(0, 2);
    const ultimoPuntajeTop5 = top5Coincidencias[top5Coincidencias.length - 1].coincidencias;
    const areasConIgualPuntaje = coincidenciasPorArea.filter(area => area.coincidencias === ultimoPuntajeTop5);
    const areasFinales = [...new Set([...top5Coincidencias, ...areasConIgualPuntaje])].map(area => area.areaId);

    return areasFinales.length ? areasFinales : []; // Devuelve un array vacío si no hay coincidencias
  } catch (error) {
    console.error("Error al obtener áreas activas:", error);
    return []; // En caso de error, devuelve un array vacío
  }
};

module.exports = router;
