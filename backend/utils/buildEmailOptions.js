const buildEmailOptions = (options, env = process.env) => {
  return {
    from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };
};

module.exports = buildEmailOptions;
