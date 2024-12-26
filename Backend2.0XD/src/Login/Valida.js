const mongoose = require('mongoose');

// Definir el esquema de usuario
const usuarioSchema = new mongoose.Schema({
  NOMBRE: { type: String, required: true },
  CORREO: { type: String, required: true, unique: true },
  CONTRASENA: { type: String, required: true },
  area: { type: String },
  carrera: { type: String },
});

// Crear el modelo de Usuario
const Usuario = mongoose.model('Usuario', usuarioSchema, 'usuarios');

// Funcion para validar el usuario
const validarUsuario = async (nombreUsuario, contrasena) => {
  try {
    console.log("Datos recibidos para validar:", { CORREO: nombreUsuario, CONTRASENA: contrasena });

    // Buscar usuario por correo y contrasena
    const usuario = await Usuario.findOne({
      CORREO: nombreUsuario,
      CONTRASENA: contrasena,
    });

    console.log("Resultado de la consulta a MongoDB:", usuario);

    // Si se encuentra el usuario, devolver mensaje y userId
    if (usuario) {
      return { mensaje: 'Usuario registrado', userId: usuario._id };
    } else {
      return { mensaje: 'Usuario NO registrado' };
    }
  } catch (error) {
    console.error("Error al validar usuario:", error.message);
    throw new Error('Error interno en la validacion del usuario');
  }
};

module.exports = { validarUsuario, Usuario };
