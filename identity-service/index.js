const fs = require('fs');
const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { Umzug, SequelizeStorage } = require('umzug');
const sequelize = require('./config/database'); // Import the sequelize instance
const Member = require('./models/Member'); // Import models
const Profile = require('./models/Profile'); // Import models
const identityController = require('./controllers/identityController'); // Import controller

const app = express();
const port = 8081;

// Middleware for parsing JSON bodies
app.use(express.json());

const swaggerSpec = {
  openapi: '3.0.0',
  info: { title: 'Identity Service API', description: 'API for managing user membership and profile data.', version: '1.0.0' },
  servers: [{ url: 'http://localhost:8081', description: 'Local Identity Service' }],
  paths: {
    '/members': {
      post: {
        tags: ['Members'],
        summary: 'Create a new member',
        description: 'Registers a new member in the system.',
        operationId: 'createMember',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMemberRequest' } } } },
        responses: {
          '201': { description: 'Member created.', content: { 'application/json': { schema: { $ref: '#/components/schemas/MemberResponse' } } } },
          '400': { description: 'Invalid request payload.' },
          '409': { description: 'Member with provided email already exists.' },
        },
      },
      get: {
        tags: ['Members'],
        summary: 'Get member by email',
        description: 'Looks up a member by email address.',
        operationId: 'getMemberByEmail',
        parameters: [{ in: 'query', name: 'email', required: true, schema: { type: 'string', format: 'email' } }],
        responses: {
          '200': { description: 'Member found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/MemberResponse' } } } },
          '404': { description: 'Member not found.' },
        },
      },
    },
    '/members/{memberId}': {
      get: {
        tags: ['Members'],
        summary: 'Get member by ID',
        operationId: 'getMemberById',
        parameters: [{ in: 'path', name: 'memberId', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Member details.', content: { 'application/json': { schema: { $ref: '#/components/schemas/MemberResponse' } } } },
          '404': { description: 'Member not found.' },
        },
      },
    },
    '/profiles/{memberId}': {
      get: {
        tags: ['Profiles'],
        summary: 'Get member profile',
        operationId: 'getProfileByMemberId',
        parameters: [{ in: 'path', name: 'memberId', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Profile details.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfileResponse' } } } },
          '404': { description: 'Profile not found.' },
        },
      },
      put: {
        tags: ['Profiles'],
        summary: 'Update member profile',
        operationId: 'updateProfile',
        parameters: [{ in: 'path', name: 'memberId', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileRequest' } } } },
        responses: {
          '200': { description: 'Profile updated.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfileResponse' } } } },
          '400': { description: 'Invalid request payload.' },
          '404': { description: 'Profile not found.' },
        },
      },
    },
  },
  components: {
    schemas: {
      CreateMemberRequest: {
        type: 'object', required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          address: { type: 'string' },
          phoneNumber: { type: 'string' },
          preferences: { type: 'object', additionalProperties: true },
        },
      },
      MemberResponse: {
        type: 'object',
        properties: {
          memberId: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          tier: { type: 'string', enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'], default: 'BRONZE' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ProfileResponse: {
        type: 'object',
        properties: {
          memberId: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          address: { type: 'string' },
          phoneNumber: { type: 'string' },
          preferences: { type: 'object', additionalProperties: true },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

const umzug = new Umzug({
  migrations: {
    glob: ['migrations/*.sql', { cwd: __dirname }],
    resolve: ({ name, path: migrationPath, context }) => ({
      name,
      up: async () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        return sequelize.query(sql);
      },
      down: async () => {
        // Implement rollback logic if needed, or leave empty if not supported
      },
    }),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await umzug.up();
    console.log('Migrations are up to date');
  } catch (error) {
    console.error('Unable to connect to the database or run migrations:', error);
    process.exit(1);
  }
}


app.get('/', (req, res) => {
  res.send('Identity service is running!');
});

// Swagger UI
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.post('/members', identityController.createMember);
app.get('/members', identityController.getMemberByEmail);   // ?email=...
app.get('/members/:memberId', identityController.getMemberById);
app.put('/profiles/:memberId', identityController.updateProfile);
app.get('/profiles/:memberId', identityController.getProfileByMemberId);


// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An unexpected error occurred!' });
});

runMigrations().then(() => {
  app.listen(port, () => {
    console.log(`Identity service listening at http://localhost:${port}`);
  });
});
