const express = require('express');
const mongoose = require('mongoose');
const PreguntaNivel3 = require('./PreguntaNivel3');// Modelo de la colección nivel3_preguntas
const RespuestaNivel3 = require('./RespuestaNivel3');; // Modelo de la colección respuestas_nivel3
const { obtenerPalabrasUsuario } = require('../PalabrasUsario/PalabrasUsuario');
const {Usuario} = require('../Login/Valida') ;// Modelo de la colección usuarios
const {Carrera} = require('./Carrera'); // Modelo de la colección carreras


const router = express.Router();
const sessionStatus = {};

// Función para obtener el top 3 de carreras con mayor coincidencia
const obtenerTop3Carreras = async (usuarioId) => {
  try {
    const palabrasUsuario = await obtenerPalabrasUsuario(usuarioId);
    const palabrasClaveUsuario = palabrasUsuario.map((palabra) => palabra.PALABRA.toLowerCase());

    const todasCarreras = await Carrera.find({});
    const todasPreguntasNivel3 = await PreguntaNivel3.find({});
    const coincidenciasPorCarrera = {};

    todasPreguntasNivel3.forEach(pregunta => {
      const { CARRERA_ID, CARRERA2_ID } = pregunta;

      const carrera1 = todasCarreras.find(c => c.ID === CARRERA_ID);
      const carrera2 = CARRERA2_ID ? todasCarreras.find(c => c.ID === CARRERA2_ID) : null;

      const carrerasRelacionadas = [carrera1, carrera2].filter(Boolean);

      carrerasRelacionadas.forEach(carrera => {
        if (carrera) {
          const palabrasCarrera = carrera.PALABRAS_C.split(',').map(p => p.trim().toLowerCase());
          const coincidencias = palabrasClaveUsuario.filter(p => palabrasCarrera.includes(p)).length;

          if (!coincidenciasPorCarrera[carrera.ID]) {
            coincidenciasPorCarrera[carrera.ID] = { carreraId: carrera.ID, nombre: carrera.NOMBRE, coincidencias: 0 };
          }
          coincidenciasPorCarrera[carrera.ID].coincidencias += coincidencias;
        }
      });
    });

    const coincidenciasArray = Object.values(coincidenciasPorCarrera);
    coincidenciasArray.sort((a, b) => b.coincidencias - a.coincidencias);

    const top3 = coincidenciasArray.slice(0, 5);
    const ultimoPuntajeTop3 = top3[top3.length - 1].coincidencias;
    const carrerasFinales = coincidenciasArray.filter(carrera => carrera.coincidencias >= ultimoPuntajeTop3);

    return carrerasFinales;
  } catch (error) {
    console.error("Error al obtener el top 3 de carreras:", error);
    return [];
  }
};

// Endpoint para iniciar el proceso de preguntas del tercer nivel
router.get('/iniciarPreguntas', async (req, res) => {
  const { usuarioId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
    return res.status(400).json({ mensaje: 'ID de usuario no válido' });
  }

  try {
    const top3Carreras = await obtenerTop3Carreras(usuarioId);
    const preguntasPendientes = {};

    for (const carrera of top3Carreras) {
      const preguntas = await PreguntaNivel3.find({
        $or: [{ CARRERA_ID: carrera.carreraId }, { CARRERA2_ID: carrera.carreraId }]
      });
      preguntasPendientes[carrera.carreraId] = preguntas;
    }

    sessionStatus[usuarioId] = {
      preguntasPendientes,
      puntajesPorCarrera: {},
      carreras: top3Carreras
    };

    enviarPregunta(usuarioId, res);
  } catch (error) {
    console.error("Error al iniciar el proceso de preguntas:", error);
    res.status(500).json({ mensaje: 'Error al iniciar el proceso de preguntas' });
  }
});

// Función para enviar una pregunta
const enviarPregunta = (usuarioId, res) => {
  const estado = sessionStatus[usuarioId];

  for (const carreraId in estado.preguntasPendientes) {
    const preguntas = estado.preguntasPendientes[carreraId];

    if (preguntas && preguntas.length > 0) {
      const pregunta = preguntas.shift();
      estado.preguntasPendientes[carreraId] = preguntas;

      return res.status(200).json({ pregunta, carreraId });
    }
  }

  finalizarNivel3(usuarioId);
  res.status(200).json({ mensaje: 'Preguntas completadas' });
};

// Endpoint para responder una pregunta
router.post('/responderPregunta', async (req, res) => {
  try {
    const { usuarioId, carreraId, preguntaId, respuesta, puntaje } = req.body;

    if (!sessionStatus[usuarioId]) {
      return res.status(400).json({ mensaje: 'Sesión de usuario no encontrada' });
    }

    if (respuesta === "no") {
      // Si la respuesta es "no", solo pasa a la siguiente pregunta
      console.log("Usuario respondió 'no'. Pasando a la siguiente pregunta.");
      enviarPregunta(usuarioId, res);
      return;
    }

    // Guarda la respuesta solo si el puntaje está presente
    if (puntaje !== undefined) {
      const respuestaRegistro = new RespuestaNivel3({
        USUARIO_ID: new mongoose.Types.ObjectId(usuarioId),
        PREGUNTA_ID: new mongoose.Types.ObjectId(preguntaId),
        CARRERA_ID: carreraId,
        PUNTAJE: puntaje,
        NIVEL: 3
      });

      await respuestaRegistro.save();
      console.log("Respuesta guardada correctamente.");

      const estado = sessionStatus[usuarioId];
      if (!estado.puntajesPorCarrera[carreraId]) {
        estado.puntajesPorCarrera[carreraId] = 0;
      }
      estado.puntajesPorCarrera[carreraId] += puntaje;
    }

    enviarPregunta(usuarioId, res);
  } catch (error) {
    console.error("Error al procesar la respuesta:", error);
    res.status(500).json({ mensaje: 'Error al procesar la respuesta', error: error.message });
  }
});

// Función para finalizar el nivel 3 y actualizar la carrera del usuario
const finalizarNivel3 = async (usuarioId) => {
  try {
    // Paso 1: Obtener la carrera con mayor puntaje
    const resultado = await RespuestaNivel3.aggregate([
      { $match: { USUARIO_ID: new mongoose.Types.ObjectId(usuarioId) } }, // Filtrar por usuario
      { $group: { _id: "$CARRERA_ID", totalPuntaje: { $sum: "$PUNTAJE" } } }, // Agrupar y sumar puntajes por CARRERA_ID
      { $sort: { totalPuntaje: -1 } }, // Ordenar por totalPuntaje descendente
      { $limit: 1 } // Tomar solo la carrera con el mayor puntaje
    ]);

    console.log("Resultado de la agregación:", resultado);

    const mejorCarreraId = resultado[0]?._id;

    if (mejorCarreraId) {
      // Paso 2: Obtener el nombre de la carrera en la colección `carreras`
      const carrera = await Carrera.findOne({ ID: mejorCarreraId });
      console.log("Carrera encontrada:", carrera);

      if (carrera) {
        // Paso 3: Actualizar el perfil del usuario con el nombre de la carrera
        const updateResult = await Usuario.updateOne(
          { _id: usuarioId }, 
          { $set: { carrera: carrera.NOMBRE } }
        );

        if (updateResult.modifiedCount > 0) {
          console.log(`Carrera con mayor puntaje (${carrera.NOMBRE}) asignada al usuario ${usuarioId}`);
        } else {
          console.log(`Error al actualizar la carrera para el usuario ${usuarioId}`);
        }
      } else {
        console.log("No se encontró la carrera correspondiente en la colección de `carreras`.");
      }
    } else {
      console.log("No se encontró una carrera con coincidencias suficientes para el usuario.");
    }
  } catch (error) {
    console.error("Error al finalizar el nivel 3 y actualizar la carrera del usuario:", error);
  }
};



module.exports = router;
