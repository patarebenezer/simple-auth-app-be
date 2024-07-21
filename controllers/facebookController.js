// controllers/facebookController.js
const passport = require('passport');
const db = require('../models');
const jwt = require('jsonwebtoken');
const FacebookStrategy = require('passport-facebook').Strategy;

// Facebook OAuth configuration
passport.use(
 new FacebookStrategy(
  {
   clientID: process.env.FB_CLIENT_ID,
   clientSecret: process.env.FB_CLIENT_SECRET,
   callbackURL: 'http://localhost:4000/auth/facebook/callback',
   profileFields: ['id', 'displayName', 'emails', 'photos'], // Ensure you request the email field
  },
  async function (token, refreshToken, profile, cb) {
   try {
    let user = await db.User.findOne({
     where: {
      email: profile.emails[0].value, // Extract email from the profile object
     },
    });

    if (!user) {
     user = await db.User.create({
      name: profile.displayName,
      email: profile.emails[0].value,
      isVerified: true,
     });
    }

    // Add profile picture URL
    user.photos = profile.photos[0].value;

    return cb(null, user);
   } catch (error) {
    console.error('Error during Facebook authentication:', error);
    return cb(error, null);
   }
  }
 )
);


passport.serializeUser((user, done) => {
 done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
 try {
  const user = await db.User.findByPk(id);
  done(null, user);
 } catch (err) {
  done(err);
 }
});

/**
 * Controller to handle facebook oauth login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const facebookAuthLogin = (req, res, next) => {
 passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
}

/**
 * Controller to handle facebook oauth login callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const facebookAuthLoginCallback = (req, res, next) => {
 passport.authenticate('facebook', { failureRedirect: '/auth/facebook/error' }, (err, user, info) => {
  if (err) {
   return next(err);
  }
  if (!user) {
   return res.redirect('/auth/facebook/error');
  }
  req.logIn(user, async (err) => {
   if (err) {
    return next(err);
   }
   const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION,
   });

   // Update user login information
   user.lastLoginAt = new Date();
   user.loginCount += 1;
   await user.save();

   // Set cookie
   res.cookie('token', token, {
    httpOnly: true,
    secure: true,
   });
   return res.redirect(`http://localhost:3000/auth-success?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&profilePic=${encodeURIComponent(user.photos)}&type=facebook`);

  });
 })(req, res, next);
}

module.exports = {
 facebookAuthLogin,
 facebookAuthLoginCallback,
};