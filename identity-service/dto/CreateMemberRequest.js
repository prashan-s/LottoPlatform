const Joi = require('joi');

const createMemberSchema = Joi.object({
  membershipTier: Joi.string().valid('BRONZE', 'SILVER', 'GOLD').default('BRONZE'),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  email: Joi.string().email().max(255).required(),
  phoneNumber: Joi.string().max(50),
  preferences: Joi.object().optional(),
});

module.exports = createMemberSchema;