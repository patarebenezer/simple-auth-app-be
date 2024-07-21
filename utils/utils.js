const bcrypt = require('bcryptjs');

/**
 * Validate password against the specified conditions
 * @param {string} password - The password to validate
 * @returns {Object} - An object containing validation result and message
 */
const validatePassword = (password) => {
 const criteria = [
  { regex: /.{8,}/, message: 'Password must be at least 8 characters long' },
  { regex: /[a-z]/, message: 'Password must contain at least one lowercase character' },
  { regex: /[A-Z]/, message: 'Password must contain at least one uppercase character' },
  { regex: /\d/, message: 'Password must contain at least one digit character' },
  { regex: /[!@#$%^&*(),.?":{}|<>]/, message: 'Password must contain at least one special character' },
 ];

 for (let { regex, message } of criteria) {
  if (!regex.test(password)) {
   return { isValid: false, message };
  }
 }

 return { isValid: true, message: 'Password is valid' };
};

module.exports = {
 validatePassword,
};