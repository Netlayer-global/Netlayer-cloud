/**
 * Minimal hand-curated OpenAPI 3.0 spec for the NetLayer API.
 *
 * Strategy: cover the public-facing surface first (auth, catalog, servers,
 * billing, SSH keys, notifications). Admin endpoints can be added as the
 * external admin API is finalized. Generated SDKs and the Terraform provider
 * will be driven from this spec.
 */

import { config } from './config/env'

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'NetLayer Cloud API',
    description:
      'Public API for NetLayer Cloud — VPS hosting platform.\n\n' +
      'All endpoints under `/api`. Authenticate via `Authorization: Bearer <accessToken>` ' +
      'obtained from `POST /api/auth/login`.',
    version: '1.0.0',
    contact: { name: 'NetLayer Support', email: 'support@netlayer.com' },
  },
  servers: [
    { url: '/', description: 'Current host' },
    { url: 'http://localhost:5000', description: 'Local dev' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          details: {},
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'BILLING'] },
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BANNED'] },
          balance: { type: 'number' },
          country: { type: 'string' },
          currency: { type: 'string' },
          emailVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Plan: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          cpu: { type: 'integer' },
          ramGB: { type: 'integer' },
          diskGB: { type: 'integer' },
          bandwidthTB: { type: 'number' },
          priceInr: { type: 'number' },
          priceMonthly: { type: 'number' },
          priceHourly: { type: 'number' },
          isPopular: { type: 'boolean' },
        },
      },
      Region: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          country: { type: 'string' },
          countryCode: { type: 'string' },
          city: { type: 'string' },
          flag: { type: 'string' },
        },
      },
      OsTemplate: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          version: { type: 'string' },
          family: { type: 'string', enum: ['LINUX', 'WINDOWS', 'BSD'] },
        },
      },
      Server: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          hostname: { type: 'string' },
          ipv4: { type: 'string', nullable: true },
          status: {
            type: 'string',
            enum: ['PENDING', 'BUILDING', 'RUNNING', 'STOPPED', 'REBOOTING', 'ERROR', 'DELETING', 'DELETED'],
          },
          plan: { $ref: '#/components/schemas/Plan' },
          region: { $ref: '#/components/schemas/Region' },
          osTemplate: { $ref: '#/components/schemas/OsTemplate' },
          specs: {
            type: 'object',
            properties: {
              cpu: { type: 'integer' },
              ram: { type: 'integer' },
              disk: { type: 'integer' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          invoiceNumber: { type: 'string' },
          amount: { type: 'number' },
          tax: { type: 'number' },
          total: { type: 'number' },
          currency: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'] },
          dueDate: { type: 'string', format: 'date-time' },
          paidAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
    parameters: {
      IdempotencyKey: {
        name: 'Idempotency-Key',
        in: 'header',
        description: 'Client-supplied UUID to make POST/PATCH/DELETE retries safe.',
        required: false,
        schema: { type: 'string' },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth' },
    { name: 'Catalog' },
    { name: 'Servers' },
    { name: 'Billing' },
    { name: 'SSH Keys' },
    { name: 'Notifications' },
    { name: 'Health' },
  ],
  paths: {
    '/healthz': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        security: [],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/readyz': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe (checks DB + Redis)',
        security: [],
        responses: { '200': { description: 'Ready' }, '503': { description: 'Not ready' } },
      },
    },
    '/metrics': {
      get: {
        tags: ['Health'],
        summary: 'Prometheus metrics',
        security: [],
        responses: { '200': { description: 'Prometheus exposition format' } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        accessToken: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '409': { description: 'Email already registered' },
          '429': { description: 'Rate limited' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK with accessToken + refresh cookie' },
          '401': { description: 'Invalid credentials' },
          '423': { description: 'Account locked' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/plans': {
      get: {
        tags: ['Catalog'],
        summary: 'List active plans',
        security: [],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Plan' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/regions': {
      get: {
        tags: ['Catalog'],
        summary: 'List active regions',
        security: [],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/os': {
      get: {
        tags: ['Catalog'],
        summary: 'List active OS templates',
        security: [],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/servers': {
      get: {
        tags: ['Servers'],
        summary: 'List my servers',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Server' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Servers'],
        summary: 'Deploy a new server',
        parameters: [{ $ref: '#/components/parameters/IdempotencyKey' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'planId', 'regionId', 'osTemplateId'],
                properties: {
                  name: { type: 'string' },
                  planId: { type: 'string' },
                  regionId: { type: 'string' },
                  osTemplateId: { type: 'string' },
                  sshKeyId: { type: 'string' },
                  rootPassword: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Deploy queued' },
          '400': { description: 'Invalid request' },
          '402': { description: 'Insufficient balance' },
          '503': { description: 'No capacity in region' },
        },
      },
    },
    '/api/servers/{id}': {
      get: { tags: ['Servers'], summary: 'Get server', responses: { '200': { description: 'OK' } } },
      delete: { tags: ['Servers'], summary: 'Destroy server', responses: { '200': { description: 'Destroyed' } } },
    },
    '/api/servers/{id}/power': {
      post: {
        tags: ['Servers'],
        summary: 'Power action',
        parameters: [{ $ref: '#/components/parameters/IdempotencyKey' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { action: { type: 'string', enum: ['start', 'stop', 'restart'] } },
              },
            },
          },
        },
        responses: { '200': { description: 'Action queued' } },
      },
    },
    '/api/billing/invoices': {
      get: {
        tags: ['Billing'],
        summary: 'List invoices',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Invoice' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/billing/orders': {
      post: {
        tags: ['Billing'],
        summary: 'Create payment order (Razorpay/Stripe)',
        parameters: [{ $ref: '#/components/parameters/IdempotencyKey' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['invoiceId'], properties: { invoiceId: { type: 'string' } } },
            },
          },
        },
        responses: { '200': { description: 'Order with provider info' } },
      },
    },
  },
} as const

void config // referenced to keep import side-effect for env validation
