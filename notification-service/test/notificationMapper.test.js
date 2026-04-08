const test = require('node:test');
const assert = require('node:assert/strict');

const { toResponse } = require('../utils/notificationMapper');

function row(payload) {
  return {
    toJSON() {
      return { ...payload };
    },
  };
}

test('toResponse converts numeric 1 read value to boolean true', () => {
  const response = toResponse(row({ notificationId: 'n-1', read: 1 }));
  assert.equal(response.read, true);
});

test('toResponse converts numeric 0 read value to boolean false', () => {
  const response = toResponse(row({ notificationId: 'n-2', read: 0 }));
  assert.equal(response.read, false);
});

test('toResponse converts boolean true read value to true', () => {
  const response = toResponse(row({ notificationId: 'n-3', read: true }));
  assert.equal(response.read, true);
});

test('toResponse converts boolean false read value to false', () => {
  const response = toResponse(row({ notificationId: 'n-4', read: false }));
  assert.equal(response.read, false);
});

test('toResponse converts string "1" to true', () => {
  const response = toResponse(row({ notificationId: 'n-5', read: '1' }));
  assert.equal(response.read, true);
});

test('toResponse converts null to false', () => {
  const response = toResponse(row({ notificationId: 'n-6', read: null }));
  assert.equal(response.read, false);
});

test('toResponse converts undefined to false', () => {
  const response = toResponse(row({ notificationId: 'n-7' }));
  assert.equal(response.read, false);
});

test('toResponse preserves unrelated fields', () => {
  const response = toResponse(
    row({
      notificationId: 'n-8',
      memberId: 'm-1',
      title: 'Booking Confirmed',
      read: 0,
    }),
  );

  assert.equal(response.notificationId, 'n-8');
  assert.equal(response.memberId, 'm-1');
  assert.equal(response.title, 'Booking Confirmed');
});

test('toResponse can process already normalized object shape', () => {
  const response = toResponse(row({
    notificationId: 'n-9',
    read: true,
    createdAt: '2026-04-25T10:00:00Z',
  }));

  assert.equal(response.read, true);
  assert.equal(response.createdAt, '2026-04-25T10:00:00Z');
});

test('toResponse always returns an object', () => {
  const response = toResponse(row({ notificationId: 'n-10', read: 0 }));
  assert.equal(typeof response, 'object');
  assert.ok(response);
});
