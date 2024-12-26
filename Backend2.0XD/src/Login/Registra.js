const mongoose = require('mongoose');


// Verifica si el modelo ya está compilado antes de crearlo
const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', new mongoose.Schema({
  NOMBRE: String,
  CORREO: String,
  CONTRASENA: String,
}), 'usuarios'); // 'usuarios' es el nombre de la colección

// Función para registrar un nuevo usuario
const registrarUsuario = async (nombre, correo, contrasena) => {
  try {
    // Verificar si el usuario ya existe en la base de datos
    const usuarioExistente = await Usuario.findOne({ CORREO: correo });
    if (usuarioExistente) {
      throw new Error('El usuario ya está registrado');
    }

    // Crear el nuevo usuario sin definir manualmente _id
    const nuevoUsuario = new Usuario({ NOMBRE: nombre, CORREO: correo, CONTRASENA: contrasena,carrera: null, area: null });
    await nuevoUsuario.save();

    console.log('Usuario registrado con _id:', nuevoUsuario._id); // Confirmación de que _id se generó

    return { mensaje: 'Usuario registrado correctamente' };
  } catch (error) {
    console.error('Error al registrar usuario:', error.message);
    throw error;
  }
};

module.exports = { registrarUsuario };
