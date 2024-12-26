const express = require('express');
const mongoose = require('mongoose');
const PalabraClaveUsuario = require('../PalabrasUsario/PalabrasUsuario');
const RespuestaNivel2 = require('../SegundoNivel/RespuestaNivel2');
const RespuestaNivel3 = require('..//TercerNivel/RespuestaNivel3');
const {Usuario} = require('../Login/Valida');
const {eliminarPalabrasUsuario} = require('../PalabrasUsario/PalabrasUsuario')
const {eliminarAreaUsuario} = require('../SegundoNivel/Area');
const {eliminarCarreraUsuario} = require('../TercerNivel/Carrera');

async function resetTestData(usuarioId) {
  try {
    const objectIdUsuario = new mongoose.Types.ObjectId(usuarioId);

    // Eliminar palabras clave del usuario
    await eliminarPalabrasUsuario(usuarioId);
    console.log(`Palabras clave eliminadas para el usuario: ${usuarioId}`);

    // Eliminar respuestas de Nivel 2
    await RespuestaNivel2.deleteMany({ USUARIO_ID: objectIdUsuario });
    console.log(`Respuestas de Nivel 2 eliminadas para el usuario: ${usuarioId}`);

    // Eliminar respuestas de Nivel 3
    await RespuestaNivel3.deleteMany({ USUARIO_ID: objectIdUsuario });
    console.log(`Respuestas de Nivel 3 eliminadas para el usuario: ${usuarioId}`);

    // Eliminar área seleccionada en el perfil del usuario
    await eliminarAreaUsuario(usuarioId);
    console.log(`Área eliminada para el usuario: ${usuarioId}`);

    // Eliminar carrera seleccionada en el perfil del usuario
    await eliminarCarreraUsuario(usuarioId);
    console.log(`Carrera eliminada para el usuario: ${usuarioId}`);

    // Actualizar el perfil del usuario con `findByIdAndUpdate`
    await Usuario.findByIdAndUpdate(objectIdUsuario, {
      $set: { area: 'No definido', carrera: 'No defenido' }
    });
    console.log(`Área y carrera eliminadas en el perfil del usuario: ${usuarioId}`);

    return { mensaje: 'Datos del test reiniciados correctamente' };
  } catch (error) {
    console.error("Error general al reiniciar datos del test:", error.message);
    throw new Error('Error al reiniciar datos del test');
  }
}

module.exports = { resetTestData };