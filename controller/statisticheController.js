//=================================================
// File: statisticheController.js
// Statistiche eventi passati (solo organizzatori)
//=================================================

const express = require("express");
const router = express.Router();

const statisticheController = (sql) => {
  // GET /statistiche/eventi-passati?dal=YYYY-MM-DD&al=YYYY-MM-DD
  router.get("/eventi-passati", async (req, res) => {
    const { dal, al } = req.query;

    try {
      const rows = await sql`
        SELECT
          e.eventoid                             AS "EventoID",
          e.titolo                               AS "Titolo",
          e.data                                 AS "Data",
          COUNT(i.iscrizioneid)                  AS "TotIscritti",
          COUNT(i.iscrizioneid) FILTER (WHERE i.checkineffettuato = true) AS "TotCheckin",
          CASE 
            WHEN COUNT(i.iscrizioneid) = 0 THEN 0
            ELSE ROUND(
              COUNT(i.iscrizioneid) FILTER (WHERE i.checkineffettuato = true)::numeric
              / COUNT(i.iscrizioneid)::numeric * 100,
              2
            )
          END                                    AS "PercentualePartecipazione"
        FROM evento e
        LEFT JOIN iscrizione i ON e.eventoid = i.eventoid
        WHERE e.data < CURRENT_DATE
          ${dal ? sql`AND e.data >= ${dal}` : sql``}
          ${al ? sql`AND e.data <= ${al}` : sql``}
        GROUP BY e.eventoid, e.titolo, e.data
        ORDER BY e.data DESC
      `;

      return res.json(rows);
    } catch (err) {
      console.error(
        "[STATISTICHE] Errore GET /statistiche/eventi-passati:",
        err
      );
      return res.status(500).json({
        error: "Errore interno del server",
        details: err.message,
      });
    }
  });

  return router;
};

module.exports = statisticheController;

