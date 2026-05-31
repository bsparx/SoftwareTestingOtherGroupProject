const test = require('node:test');
const assert = require('node:assert/strict');
const buildEmailOptions = require('../utils/buildEmailOptions');

test('buildEmailOptions uses env and payload', () => {
  const env = {
    EMAIL_FROM_NAME: 'Hostel Admin',
    EMAIL_FROM: 'noreply@example.com',
  };

  const options = buildEmailOptions(
    {
      email: 'student@example.com',
      subject: 'Verify account',
      message: 'Please verify your email.',
      html: '<p>Please verify your email.</p>',
    },
    env
  );

  assert.deepEqual(options, {
    from: 'Hostel Admin <noreply@example.com>',
    to: 'student@example.com',
    subject: 'Verify account',
    text: 'Please verify your email.',
    html: '<p>Please verify your email.</p>',
  });
});
