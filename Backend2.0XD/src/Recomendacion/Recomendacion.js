const RespuestaNivel3 = require('../TercerNivel/RespuestaNivel3');
const {Carrera} = require('../TercerNivel/Carrera');
const express = require('express');
const mongoose = require('mongoose');
const Universidad = require('./Universidad');
const UniversidadCarrera = require('./UniversidadCarrera');

const obtenerTopCarreras = async (usuarioId) => {
    try {
        console.log("Iniciando obtenerTopCarreras para usuarioId:", usuarioId);

        if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
            throw new Error("ID de usuario no válido");
        }

        const objectIdUsuario = new mongoose.Types.ObjectId(usuarioId);

        const topCarreras = await RespuestaNivel3.aggregate([
            { $match: { USUARIO_ID: objectIdUsuario } },
            { $group: { _id: "$CARRERA_ID", totalPuntaje: { $sum: "$PUNTAJE" } } },
            { $sort: { totalPuntaje: -1 } },
            { $limit: 5 }
        ]);

        console.log("Resultado de la agregación en código:", topCarreras);

        // Obtener detalles adicionales de cada carrera
        for (let carrera of topCarreras) {
            const detallesCarrera = await Carrera.findOne({ ID: carrera._id });
            carrera.detalles = detallesCarrera || { mensaje: "Detalles no disponibles" };
        }

        return topCarreras;

    } catch (error) {
        console.error("Error en obtenerTopCarreras:", error.message);
        throw new Error("Error al obtener el top de carreras");
    }
};


const obtenerUniversidadesPorCarrera = async (carreraId) => {
    try {
        console.log("Iniciando obtenerUniversidadesPorCarrera para carreraId:", carreraId);

        // Buscar relaciones entre universidad y carrera usando el campo ID directamente
        const universidadesRelacionadas = await UniversidadCarrera.find({ CARRERAID: carreraId });
        console.log("Universidades relacionadas encontradas:", universidadesRelacionadas);

        if (!universidadesRelacionadas || universidadesRelacionadas.length === 0) {
            return { mensaje: "No se encontraron universidades para esta carrera." };
        }

        const universidadesDetalles = await Promise.all(
            universidadesRelacionadas.map(async (entry) => {
                try {
                    console.log("Buscando detalles para universidad con ID:", entry.UNIVERSIDADID);

                    const universidad = await Universidad.findOne({ ID: entry.UNIVERSIDADID });

                    if (universidad) {
                        console.log("Detalles de la universidad encontrados:", universidad);
                        return { ...entry.toObject(), universidadDetalles: universidad };
                    } else {
                        console.log("No se encontraron detalles para universidad con ID:", entry.UNIVERSIDADID);
                        return { ...entry.toObject(), universidadDetalles: { mensaje: "Detalles no disponibles" } };
                    }
                } catch (innerError) {
                    console.error("Error al obtener detalles de la universidad con ID:", entry.UNIVERSIDADID, innerError.message);
                    return { ...entry.toObject(), universidadDetalles: { mensaje: "Error al obtener detalles de la universidad" } };
                }
            })
        );

        console.log("Resultado final de universidades con detalles:", universidadesDetalles);
        return universidadesDetalles;

    } catch (error) {
        console.error("Error al obtener universidades para la carrera:", error.message);
        throw new Error("Error al obtener universidades para la carrera");
    }
};



module.exports = {
    obtenerTopCarreras,
    obtenerUniversidadesPorCarrera
};