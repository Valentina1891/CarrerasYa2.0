const mongoose = require('mongoose');

const CarreraSchema = new mongoose.Schema({
  ID: {
    type: Number,
    required: true
  },
  NOMBRE: {
    type: String,
    required: true
  },
  EMPLEABILIDAD: {
    type: String,
    required: true
  },
  SUELDOPROMEDIO: {
    type: Number,
    required: true
  },
  DESCRIPCION: {
    type: String,
    required: true
  },
  AREAID: {
    type: Number,
    required: true
  },
  PALABRAS_C: {
    type: String,
    required: true
  }
});

// Función para eliminar la carrera seleccionada para un usuario
const eliminarCarreraUsuario = async (usuarioId) => {
  try {
    const objectIdUsuario = new mongoose.Types.ObjectId(usuarioId);
    await Carrera.deleteOne({ USUARIO_ID: objectIdUsuario });
    console.log('Carrera eliminada correctamente para el usuario:', usuarioId);
  } catch (error) {
    console.error('Error al eliminar la carrera:', error.message);
    throw new Error('Error al eliminar la carrera');
  }
};

// Exportamos tanto el modelo como la función
const Carrera = mongoose.model('Carrera', CarreraSchema, 'carreras');
module.exports = { Carrera, eliminarCarreraUsuario };