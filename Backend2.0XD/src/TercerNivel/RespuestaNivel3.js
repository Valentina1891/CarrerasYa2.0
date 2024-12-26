const mongoose = require('mongoose');

const RespuestaNivel3Schema = new mongoose.Schema({
  USUARIO_ID: { type: mongoose.Schema.Types.ObjectId, required: true },
  PREGUNTA_ID: { type: mongoose.Schema.Types.ObjectId, required: true },
  CARRERA_ID: { type: Number, required: true },
  PUNTAJE: { type: Number, required: true },
  NIVEL: { type: Number, default: 3 }
});

// Exporta el modelo
module.exports = mongoose.model('RespuestaNivel3', RespuestaNivel3Schema,'respuestanivel3');
