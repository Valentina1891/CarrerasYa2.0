// src/models/RespuestaNivel2.js
const mongoose = require('mongoose');

const respuestaNivel2Schema = new mongoose.Schema({
  USUARIO_ID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Usuario' },
  PREGUNTA_ID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'PreguntaNivel2' },
  AREA_ID: { type: Number, required: true },
  PUNTAJE: { type: Number, required: true },
  NIVEL: { type: Number, required: true }
  // Otros campos si es necesario
});

// Exporta el modelo
module.exports = mongoose.model('RespuestaNivel2', respuestaNivel2Schema);
