const mongoose = require('mongoose');

const PreguntaPrimerNivelSchema = new mongoose.Schema({
  PREGUNTA: String,
  PALABRA_CLAVE_1: String,
  PALABRA_CLAVE_2: String,
});

const PreguntaPrimerNivel = mongoose.model('PreguntaPrimerNivel', PreguntaPrimerNivelSchema, 'nivel1_preguntas');

module.exports = PreguntaPrimerNivel;
