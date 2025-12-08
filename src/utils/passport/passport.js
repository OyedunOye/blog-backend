const passport = require('passport');
const config = require('../config');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const {findOrCreateGoogleUser} = require('./createGoogleUser')
const User = require('../../models/user')

console.log(config.GOOGLE_CLIENT_ID)

passport.use(new GoogleStrategy({
  clientID: config.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3001/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  // Extracting details to save to the db here

  try {
    const user = await findOrCreateGoogleUser(profile)
    // Pass user to next step
    return done(null, user);
  } catch (error) {
    return done(error, null)
  }

}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async(_id, done) =>  {
  const user = await User.findById(_id)
  done(null, user)
});
