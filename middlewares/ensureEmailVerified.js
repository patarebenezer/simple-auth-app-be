const db = require('../models');

const ensureEmailVerified = async (req, res, next) => {
 try {
  const { id } = req.user; // Assuming user ID is available in req.user
  const user = await db.User.findOne({ where: { id } });

  if (!user || !user.isVerified) {
   return res.status(403).send('Email not verified');
  }

  next();
 } catch (err) {
  console.error('Error in ensuring email verification:', err); // Log the error for debugging
  return res.status(500).send('Error in ensuring email verification');
 }
};

module.exports = ensureEmailVerified;