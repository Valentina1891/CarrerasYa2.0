
const {Usuario} = require('../Login/Valida');
const {obtenerPalabrasUsuario} = require('../PalabrasUsario/PalabrasUsuario');

const obtenerPerfilCompleto = async (usuarioId) => {
    try {
      const usuario = await Usuario.findById(usuarioId);
  
      if (!usuario) {
        return null;  // Retornamos null si no se encuentra el usuario
      }
  
      const palabras = await obtenerPalabrasUsuario(usuarioId);
  
      // Construimos el perfil completo
      const perfil = {
        nombre: usuario.NOMBRE,
        correo: usuario.CORREO,
        carrera: usuario.carrera || 'No definida',
        area: usuario.area || 'No definida',
        palabrasClave: palabras.map((p) => p.PALABRA),
      };
  
      return perfil;  // Devolvemos el perfil completo
    } catch (error) {
      console.error('Error al obtener el perfil del usuario:', error.message);
      throw new Error('Error al obtener el perfil completo');
    }
  };
  
  module.exports = { obtenerPerfilCompleto };