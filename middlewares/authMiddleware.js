const jwt = require('jsonwebtoken');
const db = require('../models');

const ensureAuthenticated = async (req, res, next) => {
 const authHeader = req.headers.authorization;

 if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).send('Access token is missing or invalid');
 }

 const token = authHeader.split(' ')[1];

 try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded; // Attach decoded token to the request object
  next();
 } catch (err) {
  console.error('Authentication error:', err); // Log the error for debugging
  return res.status(401).send('Access token is missing or invalid');
 }
};

module.exports = ensureAuthenticated;