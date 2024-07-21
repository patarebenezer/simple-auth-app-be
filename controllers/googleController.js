// controllers/googleController.js
const { google } = require('googleapis');
const db = require('../models');
const jwt = require('jsonwebtoken');

// Google OAuth configuration
const googleOAuthClient = new google.auth.OAuth2(
 process.env.GOOGLE_CLIENT_ID,
 process.env.GOOGLE_CLIENT_SECRET,
 'http://localhost:4000/auth/google/callback'
)

// Scope from users
const scopes = [
 'https://www.googleapis.com/auth/userinfo.email',
 'https://www.googleapis.com/auth/userinfo.profile',
]

/**
 * Controller to handle google oauth login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const googleAuthLogin = async (req, res) => {
 // Authorization url
 const authUrl = googleOAuthClient.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  include_granted_scopes: true
 })

 res.redirect(authUrl) // Automatically redirect
}

/**
 * Controller to handle google oauth login callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const googleAuthLoginCallback = async (req, res) => {
 const { code } = req.query;
 const { tokens } = await googleOAuthClient.getToken(code)

 googleOAuthClient.setCredentials(tokens)

 const oauth2 = google.oauth2({
  auth: googleOAuthClient,
  version: 'v2'
 })

 const { data } = await oauth2.userinfo.get()

 if (!data.email || !data.name) {
  return res.json({
   data: data
  })
 }
 let user = await db.User.findOne({
  where: {
   email: data.email
  }
 });

 if (!user && data) {
  user = await db.User.create({
   name: data?.name,
   email: data?.email,
   isVerified: true
  })
 }

 // Update user login information
 user.lastLoginAt = new Date();
 user.loginCount += 1;
 await user.save();

 const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_REFRESH_EXPIRATION
 });

 // Set cookie
 res.cookie('token', token, {
  httpOnly: true,
  secure: true,
 });

 return res.redirect(`http://localhost:3000/auth-success?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&profilePic=${encodeURIComponent(data.picture)}&type=google`);
}

module.exports = {
 googleAuthLogin,
 googleAuthLoginCallback,
};