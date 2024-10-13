const nodemailer = require('nodemailer')
const path = require('path')
const hbs = require('nodemailer-express-handlebars');

export async function sendMail(mailOptions) {
  const transporter = await nodemailer.createTransport({
    service: 'SendinBlue', // no need to set host or port etc.
    auth: {
      user: process.env.EMAIL,
      pass: process.env.NODEMAIL_PASS
    }
  });
  transporter.use(
    "compile", hbs({
      viewEngine: {
        extname: '.handlebars', // handlebars extension
        layoutsDir: `${path.resolve('./src/email_templates/layouts')}`,
        defaultLayout: 'template', // name of main template
      },
      viewPath: `${path.resolve('./src/email_templates')}`,
      extName: '.handlebars',
    }));
  return await transporter.sendMail(mailOptions)

}

export function mailOptions(data) {
  return {
    from: `Madesoft Academy ${data.from}`, // sender address
    to: `${data.to}`, // list of receivers
    subject: `${data.subject}`, // Subject line
    text: "click this link to change and verify your password?", // plain text body
    html: `${data.html}`,
  }
}

