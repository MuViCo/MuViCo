const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("../models/user") 
const config = require("../utils/config")

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id })

        if (!user) {
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
          })
          await user.save()
        }

        return done(null, user)
      } catch (err) {
        return done(err, null)
      }
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err, null)
  }
})

module.exports = passport