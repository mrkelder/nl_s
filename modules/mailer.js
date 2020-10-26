const nodemailer = require('nodemailer');

function sendEmail({ from, to, password, text = '', subject , html}) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: from,
      pass: password
    }
  });

  transporter.sendMail({ from: from, to: to, text: text, subject: subject , html: html}, err => {
    if (err) console.error(err);
  });
}

exports.sendEmail = sendEmail;

