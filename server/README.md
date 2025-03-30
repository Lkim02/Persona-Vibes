# Media Recommend Backend API

A Node.js backend service built with Express and Mongoose that provides user authentication and tweet collection functionality.

## Features

- User registration with email confirmation (using Mailgun)
- User authentication with JWT
- Tweet collection API
- MongoDB database with Mongoose ODM

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or accessible via URL)
- Mailgun account (for email confirmation)

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables in `.env` file:
   ```
   MONGODB_URI=mongodb://localhost:27017/media-recommend
   JWT_SECRET=your_jwt_secret_key
   MAILGUN_API_KEY=your_mailgun_api_key
   MAILGUN_DOMAIN=your_mailgun_domain
   EMAIL_FROM=no-reply@yourdomain.com
   BASE_URL=http://localhost:3000
   ```

## Running the Server

Development mode (with auto-restart):
```
npm run dev
```

Production mode:
```
npm start
```

## API Endpoints

### Authentication

- **Register User**: `POST /api/auth/register`
  - Request Body: `{ "email": "user@example.com", "password": "password123" }`
  - Response: `{ "message": "User registered successfully. Please check your email to confirm your account." }`

- **Confirm Registration**: `GET /api/auth/confirm/:token`
  - Response: `{ "message": "Email confirmed successfully. You can now log in." }`

- **Login**: `POST /api/auth/login`
  - Request Body: `{ "email": "user@example.com", "password": "password123" }`
  - Response: `{ "message": "Login successful", "token": "jwt_token", "user": { "id": "user_id", "email": "user@example.com" } }`

### Tweets

- **Create Tweet**: `POST /api/tweets`
  - Headers: `Authorization: Bearer jwt_token`
  - Request Body: `{ "tweetId": "tweet123", "content": "Tweet content", "isReply": false }`
  - Response: `{ "message": "Tweet saved successfully", "tweet": { ... } }`

- **Get User Tweets**: `GET /api/tweets`
  - Headers: `Authorization: Bearer jwt_token`
  - Response: `{ "count": 1, "tweets": [ { ... } ] }`

## Database Models

### User Model

- email (String, required, unique)
- password (String, required, hashed)
- isConfirmed (Boolean, default: false)
- confirmationToken (String)
- confirmationTokenExpires (Date)
- timestamps (createdAt, updatedAt)

### Tweet Model

- tweetId (String, required, unique)
- content (String, required)
- isReply (Boolean, default: false)
- userId (ObjectId, reference to User)
- timestamps (createdAt, updatedAt)

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Email confirmation for registration
- Protected routes requiring authentication
