const mongoose = require('mongoose');
const Usuario = require('../Login/Valida').Usuario;

// Definimos el esquema para las palabras clave del usuario
const palabraClaveUsuarioSchema = new mongoose.Schema({
  USUARIO_ID: mongoose.Schema.Types.ObjectId,  // Referencia al ID del usuario
  PALABRA: String,                      // Palabra clave asociada
});

// Creamos el modelo de PalabraClaveUsuario
const PalabraClaveUsuario = mongoose.model('PalabraClaveUsuario', palabraClaveUsuarioSchema, 'palabras_usuario');

// Función para buscar las palabras clave de un usuario por su ID
const obtenerPalabrasUsuario = async (usuarioId) => {
  try {
    const objectIdUsuario = new mongoose.Types.ObjectId(usuarioId); // Conversión correcta
    const palabras = await PalabraClaveUsuario.find({ USUARIO_ID: objectIdUsuario });
    return palabras;  // Retorna las palabras clave encontradas
  } catch (error) {
    console.error('Error al buscar las palabras clave del usuario:', error);
    throw new Error('Error al obtener las palabras clave del usuario');
  }
};


const agregarPalabrasClave = async (usuarioId, palabrasClaves) => {
  try {
    const usuario = await Usuario.findById(usuarioId);
    console.log('Usuario encontrado:', usuario); // Verificación

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Crear el ObjectId una vez y reutilizarlo
    const objectIdUsuario = new mongoose.Types.ObjectId(usuarioId);

    // Filtra las palabras clave que no estén ya en `palabras_usuario`
    const palabrasExistentes = await PalabraClaveUsuario.find({ USUARIO_ID: objectIdUsuario });
    const palabrasExistentesSet = new Set(palabrasExistentes.map(p => p.PALABRA));
    const nuevasPalabras = palabrasClaves.filter(p => !palabrasExistentesSet.has(p));

    // Agrega cada palabra nueva a la colección `palabras_usuario`
    for (const palabra of nuevasPalabras) {
      const nuevaPalabraClave = new PalabraClaveUsuario({ USUARIO_ID: objectIdUsuario, PALABRA: palabra });
      await nuevaPalabraClave.save();
    }
    console.log('Palabras clave agregadas correctamente a palabras_usuario');
  } catch (error) {
    console.error('Error al agregar palabras clave:', error.message);
    throw new Error('Error al actualizar las palabras clave');
  }
};
const eliminarPalabrasUsuario = async (usuarioId) => {
  try {
    const objectIdUsuario = new mongoose.Types.ObjectId(usuarioId);
    await PalabraClaveUsuario.deleteMany({ USUARIO_ID: objectIdUsuario });
    console.log('Palabras clave eliminadas correctamente para el usuario:', usuarioId);
  } catch (error) {
    console.error('Error al eliminar palabras clave:', error.message);
    throw new Error('Error al eliminar las palabras clave');
  }
};

module.exports = { obtenerPalabrasUsuario, agregarPalabrasClave, eliminarPalabrasUsuario };




