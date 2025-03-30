const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendConfirmationEmail } = require('../config/email');
require('dotenv').config();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists', 
        errorType: 'user_exists' 
      });
    }

    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(20).toString('hex');
    const confirmationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const user = new User({
      email,
      password,
      confirmationToken,
      confirmationTokenExpires
    });

    await user.save();

    // Send confirmation email
    const emailSent = await sendConfirmationEmail(email, confirmationToken);

    if (!emailSent) {
      return res.status(500).json({ 
        message: 'Failed to send confirmation email',
        errorType: 'email_send_failed'
      });
    }

    res.status(201).json({ 
      message: 'User registered successfully. Please check your email to confirm your account.' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error',
      errorType: 'server_error'
    });
  }
};

// Confirm user registration
exports.confirmRegistration = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      confirmationToken: token,
      confirmationTokenExpires: { $gt: Date.now() }
    });

    // Create HTML response templates
    const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Confirmed | Media Recommend</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            max-width: 600px;
            width: 100%;
            padding: 40px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            text-align: center;
          }
          .icon-success {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background-color: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .icon-error {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background-color: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          svg {
            width: 40px;
            height: 40px;
            fill: white;
          }
          h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 16px;
          }
          p {
            color: #4b5563;
            font-size: 16px;
            margin-bottom: 24px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            transition: background-color 0.2s;
          }
          .button:hover {
            background-color: #2563eb;
          }
          .footer {
            margin-top: 40px;
            color: #9ca3af;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon-success">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          </div>
          <h1>Email Confirmed Successfully!</h1>
          <p>Your email has been verified and your account is now active. You can now log in to your account and start using our services.</p>
          <a href="${process.env.BASE_URL.replace('/api', '')}/login" class="button">Go to Login</a>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Media Recommend. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation Failed | Media Recommend</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            max-width: 600px;
            width: 100%;
            padding: 40px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            text-align: center;
          }
          .icon-error {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background-color: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          svg {
            width: 40px;
            height: 40px;
            fill: white;
          }
          h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 16px;
          }
          p {
            color: #4b5563;
            font-size: 16px;
            margin-bottom: 24px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            transition: background-color 0.2s;
          }
          .button:hover {
            background-color: #2563eb;
          }
          .footer {
            margin-top: 40px;
            color: #9ca3af;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon-error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>
          </div>
          <h1>Confirmation Failed</h1>
          <p>The confirmation link is invalid or has expired. Please request a new confirmation email or contact support if you continue to experience issues.</p>
          <a href="${process.env.BASE_URL.replace('/api', '')}/register" class="button">Register Again</a>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Media Recommend. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (!user) {
      return res.status(400).send(errorHtml);
    }

    // Update user
    user.isConfirmed = true;
    user.confirmationToken = null;
    user.confirmationTokenExpires = null;
    await user.save();

    res.status(200).send(successHtml);
  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Server Error | Media Recommend</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            max-width: 600px;
            width: 100%;
            padding: 40px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            text-align: center;
          }
          .icon-error {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background-color: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          svg {
            width: 40px;
            height: 40px;
            fill: white;
          }
          h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 16px;
          }
          p {
            color: #4b5563;
            font-size: 16px;
            margin-bottom: 24px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            transition: background-color 0.2s;
          }
          .button:hover {
            background-color: #2563eb;
          }
          .footer {
            margin-top: 40px;
            color: #9ca3af;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon-error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h1>Server Error</h1>
          <p>We're sorry, but something went wrong on our end. Please try again later or contact support if the issue persists.</p>
          <a href="${process.env.BASE_URL.replace('/api', '')}" class="button">Go to Homepage</a>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Media Recommend. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `);
  }
};

// Validate token
exports.validateToken = async (req, res) => {
  try {
    // If the request made it past the auth middleware, the token is valid
    res.status(200).json({ 
      success: true, 
      message: 'Token is valid',
      userId: req.user._id 
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ message: 'Server error during token validation' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'User does not exist', errorType: 'user_not_found' });
    }

    // Check if email is confirmed
    if (!user.isConfirmed) {
      return res.status(401).json({ message: 'Please confirm your email before logging in', errorType: 'email_not_confirmed' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password', errorType: 'invalid_password' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', errorType: 'server_error' });
  }
};
