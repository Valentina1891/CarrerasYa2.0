// models/UniversidadCarrera.js
const mongoose = require('mongoose');

const UniversidadCarreraSchema = new mongoose.Schema({
  ID: { type: Number, required: true, unique: true },
  UNIVERSIDADID: { type: Number, required: true },
  CARRERAID: { type: Number, required: true },
  NOMBRE: { type: String, required: true } // Nombre de la carrera en esa universidad
});

module.exports = mongoose.model('UniversidadCarrera', UniversidadCarreraSchema,'universidad_carrera');
