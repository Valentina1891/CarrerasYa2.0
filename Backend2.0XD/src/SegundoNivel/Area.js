const mongoose = require('mongoose');

const AreaSchema = new mongoose.Schema({
  ID: Number,
  NOMBRE: String,
  PALABRAS_C: String, // Aquí almacenas las palabras clave de cada área
});

const Area = mongoose.model('Area', AreaSchema, 'areas');

const eliminarAreaUsuario = async (usuarioId) => {
  try {
    const objectIdUsuario = new mongoose.Types.ObjectId(usuarioId);
    await Area.deleteOne({ USUARIO_ID: objectIdUsuario });
    console.log('Área eliminada correctamente para el usuario:', usuarioId);
  } catch (error) {
    console.error('Error al eliminar el área:', error.message);
    throw new Error('Error al eliminar el área');
  }
};

module.exports = { Area, eliminarAreaUsuario };
