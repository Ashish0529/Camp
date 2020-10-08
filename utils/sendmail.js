const nodemailer = require('nodemailer');

  const sendEmail = async options => {


    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
        user: process.env.email,
        pass: process.env.password //  replace both with your real credentials or an application-specific password
       }
      });
     console.log(options.email);
    // 2. Define email options
    const mailOptions = {
        from: process.env.email,
        to: options.email,
        subject: options.subject,
        html: options.message
      };

    // 3. Send the email
    await transporter.sendMail(mailOptions);
        
}


module.exports = sendEmail;