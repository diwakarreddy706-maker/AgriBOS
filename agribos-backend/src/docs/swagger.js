import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AgriBOS ERP API Specification',
      version: '1.0.0',
      description: 'Production-ready REST API for AgriBOS Agricultural Business Operating System backed by SQLite database.'
    },
    servers: [
      {
        url: 'http://localhost:8080/api/v1',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/server.js', './src/controllers/*.js']
};

export const swaggerSpec = swaggerJSDoc(options);
