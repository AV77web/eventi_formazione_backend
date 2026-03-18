//=====================================================
// File: swagger.js
// Swagger/OpenAPI setup
//=====================================================

const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

function setupSwagger(app) {
  const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
      title: "Eventi Formazione API",
      version: "1.0.0",
    },
  };

  const options = {
    swaggerDefinition,
    // Evita di scansionare directory (es. node_modules) che possono causare EISDIR su Fly
    apis: [
      path.join(__dirname, "index.js"),
      path.join(__dirname, "config.js"),
      path.join(__dirname, "controller", "*.js"),
      path.join(__dirname, "middleware", "*.js"),
    ],
  };

  const swaggerSpec = swaggerJSDoc(options);

  app.get("/api-docs/swagger.json", (req, res) => res.json(swaggerSpec));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = { setupSwagger };

