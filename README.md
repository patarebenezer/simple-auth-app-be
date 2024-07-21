# Simple Auth App Backend

This project is a backend for a simple authentication app that supports sign-up, sign-in, Google OAuth, Facebook OAuth, email verification, and user profile management. The backend is built with Node.js, Express, and Sequelize.

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js installed on your machine.
- npm (Node Package Manager) installed.
- MySQL or any other SQL database set up.

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd simple-auth-app-be

2. Install dependency
   ```bash pnpm install

3. Set up your environment variables. Create a .env file in the root directory and add the following:
   ```bash
    RPGHOST='localhost'
    PGDATABASE=''
    PGUSER=''
    PGPASSWORD=''
    PORT=4000
    JWT_SECRET=''
    JWT_REFRESH_EXPIRATION='8h'
    FE_URL='http://localhost:3000'
    BE_URL='http://localhost:4000'
    MAIL_HOST='sandbox.smtp.mailtrap.io'
    MAIL_PORT=2525
    MAIL_USER=''
    MAIL_PASSWORD=''
    GOOGLE_CLIENT_ID=''
    GOOGLE_CLIENT_SECRET=''
    FB_CLIENT_ID=''
    FB_CLIENT_SECRET=''
    CALLBACK_URL_FB=''
    NODE_ENV='development'

4. Set up the database:  npx sequelize-cli db:migrate
5. Start the server : pnpm run start

6. Project Structure

	•	config/: Configuration files for the database.
	•	controllers/: Contains all the controllers for handling requests.
	•	middlewares/: Contains middleware for authentication and email verification.
	•	models/: Contains the Sequelize models.
	•	routes/: Contains the route definitions.
	•	utils/: Utility functions.
	•	.env: Environment variables.
	•	migrations/: Database migrations.
	•	seeders/: Database seeders.

API Endpoints

Auth

	•	POST /sign-up: Sign up a new user.
	•	POST /sign-in: Sign in an existing user.

Google OAuth

	•	GET /auth/google: Initiate Google OAuth login.
	•	GET /auth/google/callback: Google OAuth callback URL.

Facebook OAuth

	•	GET /auth/facebook: Initiate Facebook OAuth login.
	•	GET /auth/facebook/callback: Facebook OAuth callback URL.

Email Verification

	•	GET /verify-email: Verify user email.
	•	POST /resend-verification-email: Resend verification email.

User Statistics

	•	GET /user-statistics: Get user statistics.

User Profile

	•	GET /profile: Get user profile.
	•	PUT /profile: Update user profile name.

Middleware

	•	ensureAuthenticated: Middleware to ensure the user is authenticated.
	•	ensureEmailVerified: Middleware to ensure the user’s email is verified.

Usage

Sign Up

To sign up a new user, send a POST request to /sign-up with the following body:
```bash
  {
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "confirmPassword": "password123"
  }

Sign In

To sign in an existing user, send a POST request to /sign-in with the following body:
```bash
{
  "email": "john.doe@example.com",
  "password": "password123"
}

Google OAuth

Initiate Google OAuth login by navigating to /auth/google.

Facebook OAuth

Initiate Facebook OAuth login by navigating to /auth/facebook.

Verify Email

To verify the user’s email, send a GET request to /verify-email with the verification token as a query parameter.

Resend Verification Email

Get User Profile

To get the user’s profile, send a GET request to /profile with the authorization token in the headers.

Update User Profile



This README provides an overview of the project, installation steps, environment setup, project structure, API endpoints, middleware, usage examples, and licensing information. Adjust the content as needed to match your specific setup and details.
