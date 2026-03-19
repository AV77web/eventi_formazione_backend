//=================================================
// File: checkinController.js
// Gestione check-in agli eventi (solo organizzatori)
//=================================================

const express = require("express");
const router = express.Router();

const checkinController = (sql) => {
  /**
   * GET /checkin/iscritti?eventoid=
   * Elenco iscritti a un evento (per gestione check-in in presenza)
   */
  router.get("/iscritti", async (req, res) => {
    const { eventoid } = req.query || {};

    if (!eventoid) {
      return res.status(400).json({ error: "eventoid è obbligatorio" });
    }

    const eid = parseInt(String(eventoid), 10);
    if (Number.isNaN(eid)) {
      return res.status(400).json({ error: "eventoid non valido" });
    }

    try {
      const eventCheck = await sql`
        SELECT eventoid FROM evento WHERE eventoid = ${eid}
      `;
      if (eventCheck.length === 0) {
        return res.status(404).json({ error: "Evento non trovato" });
      }

      const rows = await sql`
        SELECT
          i.iscrizioneid       AS "IscrizioneID",
          i.checkineffettuato  AS "CheckinEffettuato",
          i.oracheckin         AS "OraCheckin",
          i.utenteid           AS "UtenteID",
          u.nome               AS "Nome",
          u.cognome            AS "Cognome",
          u.email              AS "Email",
          e.eventoid           AS "EventoID",
          e.titolo             AS "Titolo",
          e.data               AS "Data"
        FROM iscrizione i
        JOIN utente u ON i.utenteid = u.utenteid
        JOIN evento e ON i.eventoid = e.eventoid
        WHERE i.eventoid = ${eid}
        ORDER BY u.cognome ASC NULLS LAST, u.nome ASC NULLS LAST
      `;

      return res.json(rows);
    } catch (err) {
      console.error("[CHECKIN] Errore GET /checkin/iscritti:", err);
      return res.status(500).json({
        error: "Errore interno del server",
        details: err.message,
      });
    }
  });

  // POST /checkin
  // Body: { iscrizioneid }
  router.post("/", async (req, res) => {
    const { iscrizioneid } = req.body || {};

    if (!iscrizioneid) {
      return res.status(400).json({ error: "iscrizioneid è obbligatorio" });
    }

    const id = parseInt(iscrizioneid, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "iscrizioneid non valido" });
    }

    try {
      const rows = await sql`
        SELECT 
          iscrizioneid AS "IscrizioneID",
          checkineffettuato AS "CheckinEffettuato"
        FROM iscrizione
        WHERE iscrizioneid = ${id}
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: "Iscrizione non trovata" });
      }

      const iscrizione = rows[0];
      if (iscrizione.CheckinEffettuato) {
        return res.status(400).json({ error: "Check-in già effettuato" });
      }

      const updated = await sql`
        UPDATE iscrizione
        SET checkineffettuato = true,
            oracheckin = NOW()::time
        WHERE iscrizioneid = ${id}
        RETURNING 
          iscrizioneid      AS "IscrizioneID",
          utenteid          AS "UtenteID",
          eventoid          AS "EventoID",
          checkineffettuato AS "CheckinEffettuato",
          oracheckin        AS "OraCheckin"
      `;

      return res.json(updated[0]);
    } catch (err) {
      console.error("[CHECKIN] Errore POST /checkin:", err);
      return res.status(500).json({
        error: "Errore interno del server",
        details: err.message,
      });
    }
  });

  return router;
};

module.exports = checkinController;

