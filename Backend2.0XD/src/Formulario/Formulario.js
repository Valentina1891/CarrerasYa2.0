
const mongoose = require('mongoose');

const FormularioSchema = new mongoose.Schema({
 Pregunta1: {
    type: String,
    enum: ['bien', 'más o menos', 'malo'], // Asegúrate de que 'Sí' y 'No' estén incluidos
    required: true
  },
  Pregunta2: {
    type: String,
    enum: ['Si', 'No','si','no'],
    required: true
  },
  Pregunta3: {
    type: String,
    enum: ['Si', 'No','si','no'],
    required: true
  },
  Pregunta4: String,
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
});

module.exports = mongoose.model('Formulario', FormularioSchema, 'Formulario');
