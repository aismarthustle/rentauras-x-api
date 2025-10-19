import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

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
        url: process.env.NODE_ENV === 'production' 
          ? 'https://rentauras-x-api.vercel.app' 
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
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
        Vehicle: {
          type: 'object',
          required: ['id', 'driver_id', 'make', 'model', 'year', 'license_plate', 'category', 'status'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique vehicle identifier'
            },
            driver_id: {
              type: 'string',
              format: 'uuid',
              description: 'Driver who owns this vehicle'
            },
            make: {
              type: 'string',
              description: 'Vehicle manufacturer',
              example: 'Tesla'
            },
            model: {
              type: 'string',
              description: 'Vehicle model',
              example: 'Model 3'
            },
            year: {
              type: 'integer',
              minimum: 2015,
              maximum: 2030,
              description: 'Vehicle manufacturing year'
            },
            license_plate: {
              type: 'string',
              description: 'Vehicle license plate number',
              example: 'ABC-123-45'
            },
            category: {
              type: 'string',
              enum: ['classic_ev', 'comfort_ev', 'express_ev'],
              description: 'Vehicle category for pricing'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'maintenance', 'pending_approval'],
              description: 'Current vehicle status'
            },
            battery_level: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              description: 'Current battery percentage'
            },
            location: {
              $ref: '#/components/schemas/Location'
            }
          }
        },
        Ride: {
          type: 'object',
          required: ['id', 'passenger_id', 'pickup_location', 'destination_location', 'status'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique ride identifier'
            },
            passenger_id: {
              type: 'string',
              format: 'uuid',
              description: 'Passenger who requested the ride'
            },
            driver_id: {
              type: 'string',
              format: 'uuid',
              description: 'Driver assigned to the ride'
            },
            vehicle_id: {
              type: 'string',
              format: 'uuid',
              description: 'Vehicle used for the ride'
            },
            pickup_location: {
              $ref: '#/components/schemas/Location'
            },
            destination_location: {
              $ref: '#/components/schemas/Location'
            },
            status: {
              type: 'string',
              enum: ['requested', 'accepted', 'driver_arriving', 'in_progress', 'completed', 'cancelled'],
              description: 'Current ride status'
            },
            estimated_fare: {
              type: 'number',
              format: 'float',
              description: 'Estimated ride fare in MAD'
            },
            actual_fare: {
              type: 'number',
              format: 'float',
              description: 'Final ride fare in MAD'
            },
            distance_km: {
              type: 'number',
              format: 'float',
              description: 'Ride distance in kilometers'
            },
            duration_minutes: {
              type: 'integer',
              description: 'Ride duration in minutes'
            },
            requested_at: {
              type: 'string',
              format: 'date-time',
              description: 'Ride request timestamp'
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Ride completion timestamp'
            }
          }
        },
        Location: {
          type: 'object',
          required: ['latitude', 'longitude'],
          properties: {
            latitude: {
              type: 'number',
              format: 'double',
              minimum: -90,
              maximum: 90,
              description: 'Latitude coordinate',
              example: 33.5731
            },
            longitude: {
              type: 'number',
              format: 'double',
              minimum: -180,
              maximum: 180,
              description: 'Longitude coordinate',
              example: -7.5898
            },
            address: {
              type: 'string',
              description: 'Human-readable address',
              example: 'Hassan II Avenue, Casablanca, Morocco'
            }
          }
        },
        Payment: {
          type: 'object',
          required: ['id', 'ride_id', 'amount', 'method', 'status'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique payment identifier'
            },
            ride_id: {
              type: 'string',
              format: 'uuid',
              description: 'Associated ride identifier'
            },
            amount: {
              type: 'number',
              format: 'float',
              minimum: 0,
              description: 'Payment amount in MAD'
            },
            method: {
              type: 'string',
              enum: ['cash', 'card', 'wallet', 'cmi'],
              description: 'Payment method used'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'refunded'],
              description: 'Payment status'
            },
            transaction_id: {
              type: 'string',
              description: 'External payment gateway transaction ID'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Payment creation timestamp'
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
            },
            stack: {
              type: 'string',
              description: 'Error stack trace (development only)'
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
  apis: process.env.NODE_ENV === 'production'
    ? ['./dist/routes/*.js', './dist/index.js']
    : ['./src/routes/*.ts', './src/controllers/*.ts', './src/index.ts']
};

export const specs = swaggerJsdoc(options);
export const swaggerUiOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c5aa0 }
  `,
  customSiteTitle: 'Rentauras X API Documentation'
};
