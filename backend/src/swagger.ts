import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import path from 'path';

// In Lambda/bundled env, import.meta.url can be undefined; avoid fileURLToPath(undefined).
const __dirname =
  typeof import.meta?.url === 'string'
    ? path.dirname(fileURLToPath(import.meta.url))
    : undefined;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Download Gate API',
      version: '1.0.0',
      description: 'REST API for Download Gate: users, auth, and (future) download gates and smart links.',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Clerk session token (Authorization: Bearer <token>)',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'string', description: 'Clerk user ID' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            status: { type: 'string', example: 'active' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        ListUsersResponse: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            nextToken: { type: 'string', nullable: true, description: 'Pagination cursor for next page (use as cursor query param)' },
            count: { type: 'number', description: 'Number of items returned' },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check' },
      { name: 'Users', description: 'User management (Clerk-backed)' },
    ],
  },
  apis:
    __dirname !== undefined
      ? [
          path.join(__dirname, 'app.ts'),
          path.join(__dirname, 'routes', '*.ts'),
        ]
      : [], // Lambda bundle: no source files to scan; use definition-only spec
};

const spec = swaggerJsdoc(options);
export default spec;
