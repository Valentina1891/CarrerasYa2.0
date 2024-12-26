const mongoose = require('mongoose');

const preguntaNivel2Schema = new mongoose.Schema({
  _id : mongoose.Types.ObjectId,
  ID: Number,
  PREGUNTA: String,
  PALABRA_CLAVE_1: String,
  PALABRA_CLAVE_2: String,
  AREA_ID: Number,
});

module.exports = mongoose.model('PreguntaNivel2', preguntaNivel2Schema, 'nivel2_preguntas');
