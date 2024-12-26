const mongoose = require('mongoose');

const PreguntaNivel3Schema = new mongoose.Schema({
  ID: {
    type: Number,
    required: true
  },
  PREGUNTA: {
    type: String,
    required: true
  },
  CARRERA_ID: {
    type: Number,
    required: true
  },
  CARRERA2_ID: {
    type: Number,
    default: null
  }
});

module.exports = mongoose.model('PreguntaNivel3', PreguntaNivel3Schema, 'nivel3_preguntas');
