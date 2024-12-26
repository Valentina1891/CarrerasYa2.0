// models/Universidad.js
const mongoose = require('mongoose');

const UniversidadSchema = new mongoose.Schema({
  ID: { type: Number, required: true, unique: true },
  NOMBRE: { type: String, required: true },
  LINKWEB: { type: String }
});

module.exports = mongoose.model('Universidad', UniversidadSchema,'universidades');
