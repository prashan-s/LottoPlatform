const Outbox = require('../models/Outbox');
const { v4: uuidv4 } = require('uuid');

class OutboxService {
  async saveEvent(eventType, aggregateId, payload) {
    try {
      const event = {
        eventId: uuidv4(),
        eventType,
        aggregateId,
        payload: JSON.stringify(payload),
        status: 'PENDING',
        createdAt: new Date()
      };

      await Outbox.create(event);
      console.log(`Outbox event saved: ${event.eventId}`);
    } catch (error) {
      console.error('Error saving outbox event:', error);
      throw error;
    }
  }

  async getPendingEvents() {
    try {
      return await Outbox.findAll({
        where: { status: 'PENDING' },
        order: [['createdAt', 'ASC']]
      });
    } catch (error) {
      console.error('Error fetching pending events:', error);
      throw error;
    }
  }

  async markAsPublished(eventId) {
    try {
      await Outbox.update(
        { status: 'PUBLISHED' },
        { where: { eventId } }
      );
    } catch (error) {
      console.error('Error marking event as published:', error);
      throw error;
    }
  }
}

module.exports = new OutboxService();
