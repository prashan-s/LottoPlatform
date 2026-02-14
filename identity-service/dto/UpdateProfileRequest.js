const Joi = require('joi');

const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(100),
  lastName: Joi.string().max(100),
  email: Joi.string().email().max(255),
  phoneNumber: Joi.string().max(50),
  preferences: Joi.object().optional(),
}).min(1); // At least one field is required for update

module.exports = updateProfileSchema;