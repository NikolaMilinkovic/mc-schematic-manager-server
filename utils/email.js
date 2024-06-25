const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async(option) => {
  // #1 Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    secure: false,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASSWORD,
    }
  });

  // EMAIL OPTIONS
  const emailOptions = {
    from: 'Mc-Schematic-Manager <nikolamilinkovic221@gmail.com>',
    to: option.email,
    subject: option.subject,
    text: option.message,
  }

  console.log('> SENDING MAIL...')
  console.log('')
  await transporter.sendMail(emailOptions)
}

module.exports = sendEmail;