import swaggerJsdoc from 'swagger-jsdoc';

const PORT = process.env['PORT'] || 3000;
const NODE_ENV = process.env['NODE_ENV'] || 'development';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rentauras X API',
      version: '1.0.0',
      description: 'Backend API for Rentauras X - Morocco\'s premier electric vehicle ride-sharing platform',
      contact: {
        name: 'Rentauras X Team',
        email: 'api@rentauras.ma',
        url: 'https://rentauras.ma'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: NODE_ENV === 'production' 
          ? 'https://api.rentauras.ma' 
          : `http://localhost:${PORT}`,
        description: NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'phone', 'full_name', 'role', 'status'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier'
            },
            phone: {
              type: 'string',
              pattern: '^\\+[1-9]\\d{1,14}$',
              description: 'User phone number in E.164 format',
              example: '+212612345678'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            full_name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'User full name',
              example: 'Ahmed Ben Ali'
            },
            role: {
              type: 'string',
              enum: ['passenger', 'driver', 'admin'],
              description: 'User role in the system'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended', 'pending_verification'],
              description: 'Current user status'
            },
            profile_picture: {
              type: 'string',
              format: 'uri',
              description: 'URL to user profile picture'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          required: ['error', 'message', 'statusCode'],
          properties: {
            error: {
              type: 'boolean',
              example: true,
              description: 'Indicates this is an error response'
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Resource not found'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              example: 404
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: {
              type: 'boolean',
              example: true,
              description: 'Indicates successful operation'
            },
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/index.ts'
  ]
};

export const specs = swaggerJsdoc(options);
export const swaggerUiOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c5aa0 }
  `,
  customSiteTitle: 'Rentauras X API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
  }
};
