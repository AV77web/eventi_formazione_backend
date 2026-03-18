//=====================================================
// File: swagger.js
// Swagger/OpenAPI setup
//=====================================================

const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

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
    apis: ["./**/*.js"],
  };

  const swaggerSpec = swaggerJSDoc(options);

  app.get("/api-docs/swagger.json", (req, res) => res.json(swaggerSpec));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = { setupSwagger };

