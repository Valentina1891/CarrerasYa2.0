const mongoose = require('mongoose');
const Usuario = require('../Login/Valida').Usuario;

// Esquema para palabras clave
const palabraClaveUsuarioSchema = new mongoose.Schema({
  USUARIO_ID: mongoose.Schema.Types.ObjectId,
  PALABRA: String,
});

// Modelo
const PalabraClaveUsuario = mongoose.model(
  'PalabraClaveUsuario',
  palabraClaveUsuarioSchema,
  'palabras_usuario'
);

// Obtener palabras clave de un usuario
const obtenerPalabrasUsuario = async (usuarioId) => {
  try {
    const objectIdUsuario = new mongoose.Types.ObjectId(usuarioId);
    const palabras = await PalabraClaveUsuario.find({ USUARIO_ID: objectIdUsuario });
    console.log(`🔍 Obteniendo palabras clave del usuario: ${usuarioId}`);
    console.log('📌 Palabras encontradas:', palabras.map(p => p.PALABRA));
    return palabras;
  } catch (error) {
    console.error('❌ Error al buscar las palabras clave del usuario:', error);
    throw new Error('Error al obtener las palabras clave del usuario');
  }
};

// Agregar palabras clave nuevas
const agregarPalabrasClave = async (usuarioId, palabrasClaves) => {
  try {
    const usuario = await Usuario.findById(usuarioId);
    console.log('👤 Usuario encontrado:', usuario?.correo || usuario?._id || 'Desconocido');

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const objectIdUsuario = new mongoose.Types.ObjectId(usuarioId);

    // Obtener palabras ya guardadas y normalizarlas
    const palabrasExistentes = await PalabraClaveUsuario.find({ USUARIO_ID: objectIdUsuario });
    const palabrasExistentesSet = new Set(
      palabrasExistentes.map(p => p.PALABRA.trim().toLowerCase())
    );

    // Normalizar nuevas palabras clave
    const nuevasPalabras = palabrasClaves
      .map(p => p.trim().toLowerCase())
      .filter(p => {
        const yaExiste = palabrasExistentesSet.has(p);
        if (yaExiste) {
          console.log(`🔁 Palabra ya existe y no será agregada: ${p}`);
        }
        return !yaExiste;
      });

    console.log('🆕 Palabras a agregar realmente nuevas:', nuevasPalabras);

    for (const palabra of nuevasPalabras) {
      const nuevaPalabraClave = new PalabraClaveUsuario({ USUARIO_ID: objectIdUsuario, PALABRA: palabra });
      await nuevaPalabraClave.save();
      console.log(`✅ Palabra clave agregada: ${palabra}`);
    }

    console.log('📥 Palabras clave agregadas correctamente a palabras_usuario');
  } catch (error) {
    console.error('❌ Error al agregar palabras clave:', error.message);
    throw new Error('Error al actualizar las palabras clave');
  }
};



// Eliminar todas las palabras clave de un usuario
const eliminarPalabrasUsuario = async (usuarioId) => {
  try {
    const objectIdUsuario = new mongoose.Types.ObjectId(usuarioId);
    await PalabraClaveUsuario.deleteMany({ USUARIO_ID: objectIdUsuario });
    console.log('🗑️ Palabras clave eliminadas correctamente para el usuario:', usuarioId);
  } catch (error) {
    console.error('❌ Error al eliminar palabras clave:', error.message);
    throw new Error('Error al eliminar las palabras clave');
  }
};

module.exports = { obtenerPalabrasUsuario, agregarPalabrasClave, eliminarPalabrasUsuario };
