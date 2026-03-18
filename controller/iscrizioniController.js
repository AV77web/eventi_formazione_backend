//=================================================
// File: iscrizioniController.js
// Gestione iscrizioni agli eventi
//=================================================

const express = require("express");
const router = express.Router();

const iscrizioniController = (sql) => {
  // GET /iscrizioni/mie - iscrizioni dell'utente loggato
  router.get("/mie", async (req, res) => {
    const utenteId = req.user?.id;
    if (!utenteId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const rows = await sql`
        SELECT 
          i.iscrizioneid      AS "IscrizioneID",
          i.checkineffettuato AS "CheckinEffettuato",
          i.oracheckin        AS "OraCheckin",
          e.eventoid          AS "EventoID",
          e.titolo            AS "Titolo",
          e.data              AS "Data",
          e.descrizione       AS "Descrizione"
        FROM iscrizione i
        JOIN evento e ON i.eventoid = e.eventoid
        WHERE i.utenteid = ${utenteId}
        ORDER BY e.data ASC
      `;

      return res.json(rows);
    } catch (err) {
      console.error("[ISCRIZIONI] Errore GET /iscrizioni/mie:", err);
      return res.status(500).json({
        error: "Errore interno del server",
        details: err.message,
      });
    }
  });

  // POST /iscrizioni - iscrizione a un evento
  router.post("/", async (req, res) => {
    const utenteId = req.user?.id;
    const { eventoid } = req.body || {};

    if (!utenteId) {
      return res.status(401).json({ error: "Non autenticato" });
    }
    if (!eventoid) {
      return res.status(400).json({ error: "eventoid è obbligatorio" });
    }

    try {
      const eventi = await sql`
        SELECT eventoid, data
        FROM evento
        WHERE eventoid = ${eventoid}
      `;

      if (eventi.length === 0) {
        return res.status(404).json({ error: "Evento non trovato" });
      }

      const allowed = await sql`
        SELECT 1
        FROM evento
        WHERE eventoid = ${eventoid}
          AND data > CURRENT_DATE
      `;

      if (allowed.length === 0) {
        return res.status(400).json({
          error:
            "È possibile iscriversi solo fino al giorno prima della data dell'evento",
        });
      }

      try {
        const rows = await sql`
          INSERT INTO iscrizione (utenteid, eventoid, checkineffettuato)
          VALUES (${utenteId}, ${eventoid}, false)
          RETURNING 
            iscrizioneid      AS "IscrizioneID",
            utenteid          AS "UtenteID",
            eventoid          AS "EventoID",
            checkineffettuato AS "CheckinEffettuato",
            oracheckin        AS "OraCheckin"
        `;

        return res.status(201).json(rows[0]);
      } catch (err) {
        if (err.code === "23505") {
          return res.status(409).json({
            error: "Sei già iscritto a questo evento",
          });
        }
        throw err;
      }
    } catch (err) {
      console.error("[ISCRIZIONI] Errore POST /iscrizioni:", err);
      return res.status(500).json({
        error: "Errore interno del server",
        details: err.message,
      });
    }
  });

  // DELETE /iscrizioni/:id - disiscrizione
  router.delete("/:id", async (req, res) => {
    const utenteId = req.user?.id;
    const { id } = req.params;
    const iscrizioneId = parseInt(id, 10);

    if (!utenteId) {
      return res.status(401).json({ error: "Non autenticato" });
    }
    if (Number.isNaN(iscrizioneId)) {
      return res.status(400).json({ error: "ID iscrizione non valido" });
    }

    try {
      const rows = await sql`
        SELECT 
          i.iscrizioneid AS "IscrizioneID",
          i.utenteid     AS "UtenteID",
          e.eventoid     AS "EventoID",
          e.data         AS "DataEvento"
        FROM iscrizione i
        JOIN evento e ON i.eventoid = e.eventoid
        WHERE i.iscrizioneid = ${iscrizioneId}
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: "Iscrizione non trovata" });
      }

      const iscrizione = rows[0];
      if (iscrizione.UtenteID !== utenteId) {
        return res.status(403).json({
          error: "Puoi annullare solo le tue iscrizioni",
        });
      }

      const allowed = await sql`
        SELECT 1
        FROM evento e
        WHERE e.eventoid = ${iscrizione.EventoID}
          AND e.data > CURRENT_DATE
      `;

      if (allowed.length === 0) {
        return res.status(400).json({
          error:
            "È possibile annullare l'iscrizione solo fino al giorno prima della data dell'evento",
        });
      }

      await sql`
        DELETE FROM iscrizione
        WHERE iscrizioneid = ${iscrizioneId}
      `;

      return res.json({ success: true });
    } catch (err) {
      console.error("[ISCRIZIONI] Errore DELETE /iscrizioni/:id:", err);
      return res.status(500).json({
        error: "Errore interno del server",
        details: err.message,
      });
    }
  });

  return router;
};

module.exports = iscrizioniController;

