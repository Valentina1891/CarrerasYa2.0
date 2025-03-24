const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PreguntaPrimerNivel = require('./PreguntaNivel1');
const { agregarPalabrasClave } = require('../PalabrasUsario/PalabrasUsuario');

// Obtener preguntas
router.get('/preguntas', async (req, res) => {
  try {
    const preguntas = await PreguntaPrimerNivel.find();

    if (preguntas.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron preguntas en este nivel.' });
    }

    res.status(200).json({ mensaje: 'Preguntas del Nivel 1 obtenidas correctamente', preguntas });
  } catch (error) {
    console.error('Error al obtener las preguntas del Nivel 1:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});

// Procesar respuestas
async function procesarRespuestas(respuestas) {
  try {
    const respuestasAfirmativas = respuestas.filter(r => r.afirmativa && r.idPregunta);
    const ids = respuestasAfirmativas.map(r => new mongoose.Types.ObjectId(r.idPregunta));
    const preguntas = await PreguntaPrimerNivel.find({ _id: { $in: ids } });

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

    console.log('📥 Datos recibidos:', req.body);

    if (!respuestas || !Array.isArray(respuestas)) {
      return res.status(400).json({ mensaje: 'Formato de respuestas no válido' });
    }

    const palabrasClave = await procesarRespuestas(respuestas);
    console.log('🧠 Palabras clave a guardar:', palabrasClave);
    console.log('🧾 Usuario ID:', usuarioId);

    await agregarPalabrasClave(usuarioId, palabrasClave);

    res.status(200).json({ mensaje: 'Palabras clave registradas correctamente', palabras: palabrasClave });
  } catch (error) {
    console.error('Error en /procesar-respuesta:', error.message);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});

module.exports = router;
