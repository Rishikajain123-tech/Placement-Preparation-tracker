'use strict';

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');
const Question = require('../models/questionModel'); // Ensure this imports the Mongoose model
const mongoose = require('mongoose');
const seedQuestions = require('../data/seedQuestions');
const dsaQuestions = require('../data/dsaQuestions');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret',
      callbackURL: `${process.env.APP_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // New user - create them
        user = await User.create({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '',
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
        });

        // Seed Core/Dev questions for the new user
        // We have to directly use mongoose model since questionModel.js exports helper functions
        // Wait, questionModel.js exports { getAll, getById, create, update, remove, isDuplicate }
        // It does not export the Mongoose model directly. I need to update questionModel.js to export it or use create() in a loop.
        // Let's import the raw mongoose model
        const RawQuestion = mongoose.model('Question'); 
        
        const questionsToInsert = [
          ...seedQuestions.map(q => ({ ...q, userId: user._id })),
          ...dsaQuestions.map(q => ({ ...q, userId: user._id }))
        ];

        await RawQuestion.insertMany(questionsToInsert);
        
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);
