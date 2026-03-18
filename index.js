//=====================================================
// File: index.js
// Avvio server (Node classico)
//===================================================

const express = require("express");
const cookieParser = require("cookie-parser");
const { neon } = require("@neondatabase/serverless");
const cors = require("cors");

const { FRONTEND_URL: DEFAULT_FRONTEND_URL } = require("./config");
const loginController = require("./controller/loginController");
const registrationController = require("./controller/registrationController");
const authController = require("./controller/authController");
const utentiController = require("./controller/utentiController");
const eventiController = require("./controller/eventiController");
const iscrizioniController = require("./controller/iscrizioniController");
const checkinController = require("./controller/checkinController");
const statisticheController = require("./controller/statisticheController");
const {
  verifyToken,
  verifyRole,
  requireOrganizer,
  requireDipendente,
} = require("./middleware/authMiddleware");
const { setupSwagger } = require("./swagger");
const port = process.env.PORT || 3000;

const app = express();

// FRONTEND_URL da Environment Variable ha priorità su config.js
const FRONTEND_URL = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;

console.log(`[CORS] Frontend URL configurato: ${FRONTEND_URL}`);

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const sql = neon(process.env.DATABASE_URL);

app.use(express.json());
app.use(cookieParser()); // Necessario per leggere req.cookies

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Swagger Docs - deve essere configurato dopo express.json() e prima delle routes
setupSwagger(app);

app.use("/login", loginController(sql));
app.use("/register", registrationController(sql));
app.use("/auth", authController(sql));
app.use("/utenti", verifyToken, requireOrganizer, utentiController(sql));

// Eventi - visibili a tutti gli utenti autenticati, modificabili solo dagli organizzatori
app.use("/eventi", verifyToken, eventiController(sql));

// Iscrizioni - operazioni lato dipendente
app.use("/iscrizioni", verifyToken, requireDipendente, iscrizioniController(sql));

// Check-in - solo organizzatori
app.use("/checkin", verifyToken, requireOrganizer, checkinController(sql));

// Statistiche eventi passati - solo organizzatori
app.use(
  "/statistiche",
  verifyToken,
  requireOrganizer,
  statisticheController(sql)
);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});

