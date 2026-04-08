const test = require('node:test');
const assert = require('node:assert/strict');

const createMemberSchema = require('../dto/CreateMemberRequest');
const updateProfileSchema = require('../dto/UpdateProfileRequest');

test('createMemberSchema defaults membershipTier to BRONZE', () => {
  const { error, value } = createMemberSchema.validate({
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
  });

  assert.equal(error, undefined);
  assert.equal(value.membershipTier, 'BRONZE');
});

test('createMemberSchema accepts valid GOLD membership payload', () => {
  const { error, value } = createMemberSchema.validate({
    membershipTier: 'GOLD',
    firstName: 'Grace',
    lastName: 'Hopper',
    email: 'grace@example.com',
    phoneNumber: '+1-555-0110',
    preferences: { channel: 'email' },
  });

  assert.equal(error, undefined);
  assert.equal(value.membershipTier, 'GOLD');
});

test('createMemberSchema rejects unsupported membership tier', () => {
  const { error } = createMemberSchema.validate({
    membershipTier: 'PLATINUM',
    firstName: 'Alan',
    lastName: 'Turing',
    email: 'alan@example.com',
  });

  assert.ok(error);
});

test('createMemberSchema rejects invalid email', () => {
  const { error } = createMemberSchema.validate({
    firstName: 'Linus',
    lastName: 'Torvalds',
    email: 'not-an-email',
  });

  assert.ok(error);
});

test('updateProfileSchema requires at least one field', () => {
  const { error } = updateProfileSchema.validate({});
  assert.ok(error);
});

test('updateProfileSchema accepts a partial profile update', () => {
  const { error, value } = updateProfileSchema.validate({
    phoneNumber: '+94-71-555-0101',
  });

  assert.equal(error, undefined);
  assert.equal(value.phoneNumber, '+94-71-555-0101');
});
