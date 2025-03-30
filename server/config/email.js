const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
require('dotenv').config();

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const sendConfirmationEmail = async (email, confirmationToken) => {
  const confirmationUrl = `${process.env.BASE_URL}/api/auth/confirm/${confirmationToken}`;
  
  const sender = new Sender(
    process.env.EMAIL_FROM, 
    process.env.EMAIL_FROM_NAME
  );
  
  const recipients = [new Recipient(email)];
  
  // Create a beautiful HTML email template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm Your Email</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eaeaea;
        }
        .logo {
          max-width: 150px;
          margin-bottom: 20px;
        }
        .content {
          padding: 30px 20px;
          text-align: center;
        }
        h1 {
          color: #2563eb;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          margin-bottom: 15px;
          font-size: 16px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: white !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #eaeaea;
          color: #666;
          font-size: 14px;
        }
        .note {
          background-color: #f0f9ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Media Recommend</h1>
        </div>
        <div class="content">
          <h1>Confirm Your Email Address</h1>
          <p>Thank you for registering! We're excited to have you join us.</p>
          <p>Please confirm your email address to activate your account and start using our services.</p>
          
          <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
          
          <div class="note">
            <p><strong>Note:</strong> This confirmation link will expire in 24 hours.</p>
            <p>If you did not create an account, you can safely ignore this email.</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Media Recommend. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo(recipients)
    .setSubject('Confirm Your Media Recommend Account')
    .setHtml(htmlContent)
    .setReplyTo(sender);
  
  try {
    const response = await mailerSend.email.send(emailParams);
    console.log(`Confirmation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }
};

module.exports = { sendConfirmationEmail };
