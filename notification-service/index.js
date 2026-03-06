const fs = require('fs');
const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { Sequelize, Op } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const { startConsumer, Notification } = require('./consumer');

const app = express();
app.use(express.json());
const port = 8083;

const swaggerSpec = {
  openapi: '3.0.0',
  info: { title: 'Notification Service API', description: 'API for querying and managing member notifications.', version: '1.1.0' },
  servers: [{ url: 'http://localhost:8083', description: 'Local Notification Service' }],
  paths: {
    '/notifications/member/{memberId}': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications for a member',
        description: 'Returns all notifications for a member, ordered by most recent first.',
        operationId: 'getNotificationsByMember',
        parameters: [{ in: 'path', name: 'memberId', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'List of notifications.', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/NotificationResponse' } } } } },
          '500': { description: 'Internal server error.' },
        },
      },
    },
    '/notifications/member/{memberId}/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Get unread notification count for a member',
        operationId: 'getUnreadCount',
        parameters: [{ in: 'path', name: 'memberId', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Unread count.', content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'integer' } } } } } },
          '500': { description: 'Internal server error.' },
        },
      },
    },
    '/notifications/member/{memberId}/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read for a member',
        operationId: 'markAllRead',
        parameters: [{ in: 'path', name: 'memberId', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'All notifications marked as read.', content: { 'application/json': { schema: { type: 'object', properties: { updated: { type: 'integer' } } } } } },
          '500': { description: 'Internal server error.' },
        },
      },
    },
    '/notifications/{notificationId}': {
      get: {
        tags: ['Notifications'],
        summary: 'Get a single notification by ID',
        operationId: 'getNotification',
        parameters: [{ in: 'path', name: 'notificationId', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Notification record.', content: { 'application/json': { schema: { $ref: '#/components/schemas/NotificationResponse' } } } },
          '404': { description: 'Notification not found.' },
          '500': { description: 'Internal server error.' },
        },
      },
    },
    '/notifications/{notificationId}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark a single notification as read',
        operationId: 'markNotificationRead',
        parameters: [{ in: 'path', name: 'notificationId', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Notification marked as read.', content: { 'application/json': { schema: { $ref: '#/components/schemas/NotificationResponse' } } } },
          '404': { description: 'Notification not found.' },
          '500': { description: 'Internal server error.' },
        },
      },
    },
  },
  components: {
    schemas: {
      NotificationResponse: {
        type: 'object',
        properties: {
          notificationId: { type: 'string', format: 'uuid' },
          memberId: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'PAYMENT_CAPTURED', 'PAYMENT_AUTHORIZED', 'PAYMENT_FAILED', 'DRAW_CLOSING', 'DRAW_RESULT'] },
          title: { type: 'string' },
          message: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'SENT', 'FAILED', 'RETRYING'] },
          read: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'notification-db',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'notification_service_db',
  username: process.env.DB_USER || 'notification_user',
  password: process.env.DB_PASSWORD || 'notification_password',
  dialectOptions: { multipleStatements: true },
});

const umzug = new Umzug({
  migrations: {
    glob: ['migrations/*.sql', { cwd: __dirname }],
    resolve: ({ name, path: migrationPath, context }) => ({
      name,
      up: async () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        return sequelize.query(sql);
      },
      down: async () => {},
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

// Normalize a Notification Sequelize row to the API response shape.
// Converts the TINYINT read field to a proper boolean.
function toResponse(n) {
  const obj = n.toJSON();
  obj.read = Boolean(obj.read);
  return obj;
}

app.get('/', (req, res) => {
  res.send('Notification service is running!');
});

// Swagger UI
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// GET /notifications/member/:memberId/unread-count
// Must be declared BEFORE /notifications/:notificationId to avoid route conflict
app.get('/notifications/member/:memberId/unread-count', async (req, res) => {
  try {
    const { memberId } = req.params;
    const count = await Notification.count({
      where: { memberId, read: 0 }
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PATCH /notifications/member/:memberId/read-all
app.patch('/notifications/member/:memberId/read-all', async (req, res) => {
  try {
    const { memberId } = req.params;
    const [updated] = await Notification.update(
      { read: 1 },
      { where: { memberId, read: 0 } }
    );
    res.json({ updated });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// GET /notifications/member/:memberId
app.get('/notifications/member/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const rows = await Notification.findAll({
      where: { memberId },
      order: [['createdAt', 'DESC']],
    });
    res.json(rows.map(toResponse));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /notifications/:notificationId
app.get('/notifications/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(toResponse(notification));
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

// PATCH /notifications/:notificationId/read
app.patch('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (!notification.read) {
      await notification.update({ read: 1 });
    }
    res.json(toResponse(notification));
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

runMigrations().then(() => {
  app.listen(port, () => {
    console.log(`Notification service listening at http://localhost:${port}`);
  });

  startConsumer().catch(error => {
    console.error('Failed to start Kafka consumer:', error);
    process.exit(1);
  });
});
