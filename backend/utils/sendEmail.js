const nodemailer = require('nodemailer');
const buildEmailOptions = require('./buildEmailOptions');

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define email options
  const mailOptions = buildEmailOptions(options);

  // Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;