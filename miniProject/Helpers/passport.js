const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require("../../Modals/user.js");
passport.use(new GoogleStrategy({
  clientID: process.env.client_ID,
  clientSecret: process.env.client_Secret,
  callbackURL: 'http://localhost:8080/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  console.log("🔐 GoogleStrategy triggered!");
  // console.log("👤 Google Profile:", profile);

  try {
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        user.googleId = profile.id;
        await user.save();
        console.log('✅ Google ID updated for user:', user.email);
      } else {
        console.error('❌ User not registered:', profile.emails[0].value);
        return done(null, false, { message: 'User is not registered. Please contact support.' });
      }
    }

    console.log("✅ Authenticated user:", user.email);
    return done(null, user);
  } catch (err) {
    console.error('❌ Error in Google Strategy:', err);
    return done(err, null);
  }
}));
