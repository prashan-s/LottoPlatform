const test = require('node:test');
const assert = require('node:assert/strict');

const { toResponse } = require('../utils/notificationMapper');

test('toResponse converts numeric 1 read value to boolean true', () => {
  const row = {
    toJSON() {
      return { notificationId: 'n-1', read: 1 };
    },
  };

  const response = toResponse(row);
  assert.equal(response.read, true);
});

test('toResponse converts numeric 0 read value to boolean false', () => {
  const row = {
    toJSON() {
      return { notificationId: 'n-2', read: 0 };
    },
  };

  const response = toResponse(row);
  assert.equal(response.read, false);
});
