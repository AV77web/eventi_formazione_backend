//=================================================
// File: eventiController.js
// Gestione CRUD eventi di formazione
//=================================================

const express = require("express");
const router = express.Router();

const eventiController = (sql) => {
  // GET /eventi?soloFuturi=true|false
  router.get("/", async (req, res) => {
    const { soloFuturi } = req.query;

    try {
      const onlyFuture = soloFuturi === "true";
      const rows = await sql`
        SELECT 
          eventoid AS "EventoID",
          titolo   AS "Titolo",
          data     AS "Data",
          descrizione AS "Descrizione"
        FROM evento
        ${onlyFuture ? sql`WHERE data > CURRENT_DATE` : sql``}
        ORDER BY data ASC
      `;

      return res.json(rows);
    } catch (err) {
      console.error("[EVENTI] Errore GET /eventi:", err);
      return res.status(500).json({
        error: "Errore interno del server",
        details: err.message,
      });
    }
  });

  // GET /eventi/:id
  router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const eventoId = parseInt(id, 10);
    if (Number.isNaN(eventoId)) {
      return res.status(400).json({ error: "ID evento non valido" });
    }

    try {
      const rows = await sql`
        SELECT 
          eventoid AS "EventoID",
          titolo   AS "Titolo",
          data     AS "Data",
          descrizione AS "Descrizione"
        FROM evento
        WHERE eventoid = ${eventoId}
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: "Evento non trovato" });
      }

      return res.json(rows[0]);
    } catch (err) {
      console.error("[EVENTI] Errore GET /eventi/:id:", err);
      return res.status(500).json({
        error: "Errore interno del server",
        details: err.message,
      });
    }
  });

  // POST /eventi (solo organizzatori, protetto in app.js)
  router.post("/", async (req, res) => {
    // Solo gli organizzatori possono creare eventi
    if (!req.user || req.user.ruolo !== "Organizzatore") {
      return res
        .status(403)
        .json({ error: "Solo gli organizzatori possono creare eventi" });
    }

    const { titolo, data, descrizione } = req.body || {};

    if (!titolo || !data || !descrizione) {
      return res.status(400).json({
        error: "Titolo, data e descrizione sono obbligatori",
      });
    }

    try {
      const rows = await sql`
        INSERT INTO evento (titolo, data, descrizione)
        VALUES (${titolo}, ${data}, ${descrizione})
        RETURNING 
          eventoid    AS "EventoID",
          titolo      AS "Titolo",
          data        AS "Data",
          descrizione AS "Descrizione"
      `;

      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error("[EVENTI] Errore POST /eventi:", err);
      return res.status(500).json({
        error: "Errore interno del server",
        details: err.message,
      });
    }
  });

  // PUT /eventi/:id (solo organizzatori)
  router.put("/:id", async (req, res) => {
    // Solo gli organizzatori possono modificare eventi
    if (!req.user || req.user.ruolo !== "Organizzatore") {
      return res
        .status(403)
        .json({ error: "Solo gli organizzatori possono modificare eventi" });
    }

    const { id } = req.params;
    const eventoId = parseInt(id, 10);
    const { titolo, data, descrizione } = req.body || {};

    if (Number.isNaN(eventoId)) {
      return res.status(400).json({ error: "ID evento non valido" });
    }
    if (!titolo || !data || !descrizione) {
      return res.status(400).json({
        error: "Titolo, data e descrizione sono obbligatori",
      });
    }

    try {
      const rows = await sql`
        UPDATE evento
        SET titolo = ${titolo},
            data = ${data},
            descrizione = ${descrizione}
        WHERE eventoid = ${eventoId}
        RETURNING 
          eventoid    AS "EventoID",
          titolo      AS "Titolo",
          data        AS "Data",
          descrizione AS "Descrizione"
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: "Evento non trovato" });
      }

      return res.json(rows[0]);
    } catch (err) {
      console.error("[EVENTI] Errore PUT /eventi/:id:", err);
      return res.status(500).json({
        error: "Errore interno del server",
        details: err.message,
      });
    }
  });

  // DELETE /eventi/:id (solo organizzatori)
  router.delete("/:id", async (req, res) => {
    // Solo gli organizzatori possono eliminare eventi
    if (!req.user || req.user.ruolo !== "Organizzatore") {
      return res
        .status(403)
        .json({ error: "Solo gli organizzatori possono eliminare eventi" });
    }

    const { id } = req.params;
    const eventoId = parseInt(id, 10);
    if (Number.isNaN(eventoId)) {
      return res.status(400).json({ error: "ID evento non valido" });
    }

    try {
      const rows = await sql`
        DELETE FROM evento
        WHERE eventoid = ${eventoId}
        RETURNING eventoid
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: "Evento non trovato" });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("[EVENTI] Errore DELETE /eventi/:id:", err);
      return res.status(500).json({
        error: "Errore interno del server",
        details: err.message,
      });
    }
  });

  return router;
};

module.exports = eventiController;

