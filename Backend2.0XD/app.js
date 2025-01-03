const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const router = require('./src/router')
const PORT = 3000;
const app = express();


// Conectar a la base de datos MongoDB
mongoose.connect("mongodb+srv://vvaldiviam:1891321228@cluster0.i08su.mongodb.net/vocacional?retryWrites=true&w=majority")
  .then(() => console.log("Conexión exitosa a MongoDB"))
  .catch(err => console.error("Error al conectar a MongoDB:", err.message));


// Middleware
app.use(cors());
app.use(express.json());

app.use(router);

// Exporta la aplicación (importante para Phusion Passenger)

console.log('servidor escuchando');
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
  module.exports = app;

  