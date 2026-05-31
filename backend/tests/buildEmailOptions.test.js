const buildEmailOptions = require('../utils/buildEmailOptions');

describe('buildEmailOptions', () => {
  test('uses env and payload', () => {
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

    expect(options).toEqual({
      from: 'Hostel Admin <noreply@example.com>',
      to: 'student@example.com',
      subject: 'Verify account',
      text: 'Please verify your email.',
      html: '<p>Please verify your email.</p>',
    });
  });
});
