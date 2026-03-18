//=====================================================
// File: index.js
// Avvio server (Node classico)
//===================================================

// Carica le variabili d'ambiente da .env in sviluppo (locale)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { createApp } = require("./app");

const port = process.env.PORT || 3000;
const app = createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
