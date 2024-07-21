// controllers/userController.js
const db = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validatePassword } = require('../utils/utils');
const { Op } = require('sequelize');
const moment = require('moment');

/**
 * Controller to handle user registration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const signUpUser = async (req, res) => {
 try {
  const { name, email, password, confirmPassword } = req.body;

  // Check if the password and confirmPassword match
  if (password !== confirmPassword) {
   return res.status(400).send('Passwords do not match');
  }

  // Validate the password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
   return res.status(400).send(passwordValidation.message);
  }

  // Check if the user already exists
  const userExists = await db.User.findOne({ where: { email } });
  if (userExists) {
   return res.status(400).send('Email is already associated with an account');
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await db.User.create({ name, email, password: hashedPassword, isVerified: false });

  // Generate email verification token
  const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '8h' })

  // Send verification email
  const verificationUrl = `${process.env.BE_URL}/verify-email?token=${token}`
  await sendVerificationEmail(email, verificationUrl)

  return res.status(200).send('Registration successful. Please check your email for verification.');
 } catch (err) {
  return res.status(500).send('Error in registering user');
 }
}

/**
 * Send verification email
 * @param {string} email - User's email
 * @param {string} url - Verification URL
 */
const sendVerificationEmail = async (email, url) => {
 try {
  const transporter = nodemailer.createTransport({
   host: process.env.MAIL_HOST,
   port: process.env.MAIL_PORT,
   secure: false,
   auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
   },
  });

  const mailOptions = {
   from: 'no-reply@patar.com',
   to: email,
   subject: 'Verify your email',
   html: `<p>Please verify your email by clicking the following link: <a href="${url}">${url}</a></p>`,
  };

  await transporter.sendMail(mailOptions);
 } catch (error) {
  console.error('Error in sending verification email:', error.message); // Log the error message
  throw new Error('Error in sending verification email');
 }
}

/**
 * Controller to handle email verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyEmail = async (req, res) => {
 try {
  const { token } = req.query;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await db.User.findOne({ where: { id: decoded.id } });
  if (!user) {
   return res.status(404).send('User not found');
  }

  user.isVerified = true;
  await user.save();

  return res.status(200).send('User succesfully verified, please login again!');
 } catch (err) {
  console.error('Error in email verification:', err.message); // Log the error for debugging
  return res.status(500).send('Error in email verification');
 }
}

/**
 * Controller to handle user login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const signInUser = async (req, res) => {
 try {
  const { email, password } = req.body;

  // Find the user by email
  const user = await db.User.findOne({
   where: { email }
  });

  if (!user) {
   return res.status(404).json('Email not found');
  }

  // Verify password
  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
   return res.status(404).json('Incorrect password');
  }

  // Check if email is verified
  if (!user.isVerified) {
   return res.status(403).send('Email not verified. Please check your email for verification link.');
  }

  // Update user login information
  user.lastLoginAt = new Date();
  user.loginCount += 1;
  await user.save();

  // Authenticate user with jwt
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
   expiresIn: process.env.JWT_REFRESH_EXPIRATION
  });

  // Set cookie
  res.cookie('token', token, {
   httpOnly: true,
   secure: process.env.NODE_ENV === 'production', // Set secure to true only in production
   sameSite: 'Lax', // Adjust based on your needs
  });

  return res.status(200).json({
   message: 'Login successful', token,
   name: user.name, email: user.email
  });
 } catch (err) {
  return res.status(500).send('Sign in error');
 }
}

const logoutUser = async (req, res) => {
 try {
  const token = req.cookies.token;
  if (!token) {
   return res.status(401).send('Access token not provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  res.clearCookie('token');

  const user = await db.User.findByPk(userId);

  if (user) {
   user.logoutAt = new Date();
   await user.save();
  }

  res.status(200).send('Logout successful');
 } catch (err) {
  if (err instanceof jwt.JsonWebTokenError) {
   return res.status(401).send('Invalid token');
  }

  return res.status(500).send('Logout error');
 }
};

/**
 * Resend verification email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resendVerificationEmail = async (req, res) => {
 try {
  const { email } = req.body;
  const user = await db.User.findOne({ where: { email } });

  if (!user) {
   return res.status(404).send('User not found');
  }

  if (user.isVerified) {
   return res.status(400).send('Email is already verified');
  }

  // Generate email verification token
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Send verification email
  const verificationUrl = `${process.env.BE_URL}/verify-email?token=${token}`;
  await sendVerificationEmail(email, verificationUrl);
  return res.status(200).send('Verification email resent, check your e-mail');
 } catch (err) {
  console.error('Error in resending verification email:', err); // Log the error for debugging
  return res.status(500).send('Error in resending verification email');
 }
}

/**
 * Controller to handle password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetPassword = async (req, res) => {
 try {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.user.id; // Assuming the user ID is available in req.user after authentication

  // Find the user by ID
  const user = await db.User.findOne({ where: { id: userId } });
  if (!user) {
   return res.status(404).send('User not found');
  }

  // Verify the old password
  const oldPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!oldPasswordValid) {
   return res.status(400).send('Old password is incorrect');
  }

  // Check if the new password and confirmNewPassword match
  if (newPassword !== confirmNewPassword) {
   return res.status(400).send('New passwords do not match');
  }

  // Validate the new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
   return res.status(400).send(passwordValidation.message);
  }

  // Hash the new password before saving
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedNewPassword;
  await user.save();

  return res.status(200).send('Password reset successful');
 } catch (err) {
  console.error('Error in resetting password:', err); // Log the error for debugging
  return res.status(500).send('Error in resetting password');
 }
}

const getAllUsers = async (req, res) => {
 try {
  const users = await db.User.findAll({
   attributes: ['id', 'name', 'email', 'createdAt', 'lastLoginAt', 'loginCount', 'logoutAt']
  });

  res.status(200).json(users);
 } catch (err) {
  console.error('Error fetching users:', err);
  res.status(500).send('Error fetching users');
 }
}

const getUserStatistics = async (req, res) => {
 try {
  // Total number of users who have signed up
  const totalUsers = await db.User.count();
  // Total number of users with active sessions today
  const activeSessionsToday = await db.User.count({
   where: {
    lastLoginAt: {
     [Op.gte]: moment().startOf('day').toDate(),
     [Op.lte]: moment().endOf('day').toDate(),
    },
   },
  });

  // Average number of active session users in the last 7 days rolling
  const pastWeekSessions = await db.User.findAll({
   attributes: [
    [db.sequelize.fn('date', db.sequelize.col('lastLoginAt')), 'date'],
    [db.sequelize.fn('count', db.sequelize.col('id')), 'count'],
   ],
   where: {
    lastLoginAt: {
     [Op.gte]: moment().subtract(7, 'days').startOf('day').toDate(),
     [Op.lte]: moment().endOf('day').toDate(),
    },
   },
   group: ['date'],
  });

  const totalSessionsInPastWeek = pastWeekSessions.reduce((sum, session) => sum + parseInt(session.dataValues.count, 10), 0);
  const averageSessionsLast7Days = totalSessionsInPastWeek / 7;

  res.status(200).json({
   totalUsers,
   activeSessionsToday,
   averageSessionsLast7Days,
  });
 } catch (err) {
  console.error('Error fetching user statistics:', err);
  res.status(500).send('Error fetching user statistics');
 }
};

// Get user profile
const getUserProfile = async (req, res) => {
 try {
  const userId = req.user.id;
  const user = await db.User.findByPk(userId, {
   attributes: ['id', 'name', 'email']
  });

  if (!user) {
   return res.status(404).send('User not found');
  }

  res.status(200).json(user);
 } catch (err) {
  console.error('Error fetching user profile:', err);
  res.status(500).send('Error fetching user profile');
 }
};

// Update user name
const updateUserName = async (req, res) => {
 try {
  const userId = req.user.id;
  const { name } = req.body;

  const user = await db.User.findByPk(userId);

  if (!user) {
   return res.status(404).send('User not found');
  }

  user.name = name;
  await user.save();

  res.status(200).json(user);
 } catch (err) {
  console.error('Error updating user name:', err);
  res.status(500).send('Error updating user name');
 }
};

module.exports = {
 signUpUser,
 signInUser,
 logoutUser,
 verifyEmail,
 resetPassword,
 resendVerificationEmail,
 getAllUsers,
 getUserStatistics,
 getUserProfile,
 updateUserName
}