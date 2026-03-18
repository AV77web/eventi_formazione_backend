const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: "Accesso negato: Autenticazione richiesta" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "segreto_super_sicuro_da_cambiare");
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Token non valido o scaduto" });
    }
};

const verifyToken = authMiddleware;

const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Non autenticato" });
        }
        if (!allowedRoles.includes(req.user.ruolo)) {
            return res.status(403).json({ error: "Non hai i permessi per questa operazione" });
        }
        next();
    };
};

const requireOrganizer = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: "Non autenticato" });
    }
    if (req.user.ruolo !== "Organizzatore") {
        return res.status(403).json({ error: "Solo gli organizzatori possono effettuare questa operazione" });
    }
    return next();
};

const requireDipendente = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: "Non autenticato" });
    }
    if (!["Dipendente", "Organizzatore"].includes(req.user.ruolo)) {
        return res.status(403).json({ error: "Ruolo utente non abilitato per questa operazione" });
    }
    return next();
};

module.exports = authMiddleware;
module.exports.verifyToken = verifyToken;
module.exports.verifyRole = verifyRole;
module.exports.requireOrganizer = requireOrganizer;
module.exports.requireDipendente = requireDipendente;

