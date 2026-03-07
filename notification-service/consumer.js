const { Kafka } = require('kafkajs');
const { Sequelize, DataTypes } = require('sequelize');
const { randomUUID } = require('crypto');

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const consumer = kafka.consumer({
  groupId: 'notification-service-group',
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
    multiplier: 2
  }
});

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'notification-db',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'notification_service_db',
  username: process.env.DB_USER || 'notification_user',
  password: process.env.DB_PASSWORD || 'notification_password',
  logging: false
});

// Notification model — matches the DB schema (post-migration columns)
const Notification = sequelize.define('Notification', {
  notificationId: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: () => randomUUID(),
    field: 'notification_id'
  },
  memberId: {
    type: DataTypes.STRING(36),
    field: 'member_id'
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  recipient: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  retryCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'retry_count'
  },
  read: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    field: 'read'
  },
  lastAttemptAt: {
    type: DataTypes.DATE,
    field: 'last_attempt_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'notifications',
  timestamps: false
});

// Dead Letter Topic producer
const producer = kafka.producer();

async function createNotification({ memberId, type, recipient, title, message }) {
  await Notification.create({
    notificationId: randomUUID(),
    memberId,
    type,
    recipient,
    title,
    subject: title,  // subject mirrors title for backwards-compat
    message,
    status: 'PENDING',
    retryCount: 0,
    createdAt: new Date()
  });
}

async function handleBookingEvent(message) {
  const event = JSON.parse(message.value.toString());
  console.log('Received booking event:', event.eventType);

  let type, title, notifMessage;

  switch (event.eventType) {
    case 'booking.reserved.v1':
      type = 'BOOKING_CONFIRMED';
      title = 'Slot Reserved';
      notifMessage = `Your slot for booking ${event.bookingId} has been reserved. Complete payment to confirm.`;
      break;
    case 'booking.confirmed.v1':
      type = 'BOOKING_CONFIRMED';
      title = 'Booking Confirmed';
      notifMessage = `Booking ${event.bookingId} is confirmed. You are entered in the draw!`;
      break;
    case 'booking.cancelled.v1':
      type = 'BOOKING_CANCELLED';
      title = 'Booking Cancelled';
      notifMessage = `Booking ${event.bookingId} has been cancelled.`;
      break;
    default:
      console.log('Unknown booking event type:', event.eventType);
      return;
  }

  await createNotification({
    memberId: event.memberId,
    type,
    recipient: event.memberId,
    title,
    message: notifMessage
  });

  console.log('Notification created for booking event:', event.eventType);
}

async function handlePaymentEvent(message) {
  const event = JSON.parse(message.value.toString());
  console.log('Received payment event:', event.eventType);

  let type, title, notifMessage;

  switch (event.eventType) {
    case 'payment.captured.v1':
      type = 'PAYMENT_CAPTURED';
      title = 'Payment Successful';
      notifMessage = `Payment of LKR ${event.amount} for booking ${event.bookingId} was successful. You are in the draw!`;
      break;
    case 'payment.failed.v1':
      type = 'PAYMENT_FAILED';
      title = 'Payment Declined';
      notifMessage = `Your payment for booking ${event.bookingId} was declined. Please try a different card or contact your bank.`;
      break;
    case 'payment.refunded.v1':
      type = 'PAYMENT_REFUNDED';
      title = 'Payment Refunded';
      notifMessage = `Your payment for booking ${event.bookingId} was charged back. Please contact support if you believe this is an error.`;
      break;
    default:
      console.log('Unknown payment event type:', event.eventType);
      return;
  }

  await createNotification({
    memberId: event.memberId,
    type,
    recipient: event.memberId,
    title,
    message: notifMessage
  });

  console.log('Notification created for payment event:', event.eventType);
}

async function handleDrawEvent(message) {
  const event = JSON.parse(message.value.toString());
  console.log('Received draw event:', event.eventType);

  if (event.eventType !== 'draw.completed.v1') {
    console.log('Unknown draw event type:', event.eventType);
    return;
  }

  if (event.winnerId) {
    await createNotification({
      memberId: event.winnerId,
      type: 'DRAW_RESULT',
      recipient: event.winnerId,
      title: `You Won — ${event.lotteryName}!`,
      message: `Congratulations! You are the winner of "${event.lotteryName}". Your winning booking ID: ${event.winnerBookingId}.`
    });
    console.log('Winner notification created for draw:', event.lotteryId);
  } else {
    console.log(`Draw "${event.lotteryName}" closed with no winner — no notification sent.`);
  }
}

async function sendToDeadLetterQueue(message, error) {
  try {
    await producer.send({
      topic: 'notifications.dlq',
      messages: [{
        key: message.key,
        value: JSON.stringify({
          originalTopic: message.topic,
          originalValue: message.value.toString(),
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }]
    });
    console.log('Message sent to dead letter queue');
  } catch (dlqError) {
    console.error('Failed to send to DLQ:', dlqError);
  }
}

async function startConsumer() {
  await sequelize.authenticate();
  console.log('Database connection established');

  await producer.connect();
  console.log('Kafka producer connected');

  await consumer.connect();
  console.log('Kafka consumer connected');

  await consumer.subscribe({
    topics: [
      'booking.reserved.v1',
      'booking.confirmed.v1',
      'booking.cancelled.v1',
      'payment.captured.v1',
      'payment.failed.v1',
      'payment.refunded.v1',
      'draw.completed.v1'
    ],
    fromBeginning: true
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const maxRetries = 3;
      let retries = 0;

      while (retries < maxRetries) {
        try {
          if (topic.startsWith('booking.')) {
            await handleBookingEvent(message);
          } else if (topic.startsWith('payment.')) {
            await handlePaymentEvent(message);
          } else if (topic.startsWith('draw.')) {
            await handleDrawEvent(message);
          }
          break;
        } catch (error) {
          retries++;
          console.error(`Error processing message (attempt ${retries}/${maxRetries}):`, error);

          if (retries >= maxRetries) {
            await sendToDeadLetterQueue(message, error);
          } else {
            const backoffTime = Math.pow(2, retries) * 1000;
            console.log(`Retrying in ${backoffTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
        }
      }
    },
  });

  console.log('Notification service consumer started successfully');
}

// Graceful shutdown
const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

errorTypes.forEach(type => {
  process.on(type, async (error) => {
    try {
      console.log(`process.on ${type}`);
      console.error(error);
      await consumer.disconnect();
      await producer.disconnect();
      process.exit(0);
    } catch (_) {
      process.exit(1);
    }
  });
});

signalTraps.forEach(type => {
  process.once(type, async () => {
    try {
      await consumer.disconnect();
      await producer.disconnect();
    } finally {
      process.kill(process.pid, type);
    }
  });
});

module.exports = { startConsumer, Notification, sequelize };
