const mongoose = require('mongoose');

const primerNivelSchema = new mongoose.Schema({
  PREGUNTA: String,
  PALABRA_CLAVE_1: String,
  PALABRA_CLAVE_2: String
});

const PrimerNivel = mongoose.model('PrimerNivel', primerNivelSchema, 'nivel1_preguntas');

module.exports = PrimerNivel;
