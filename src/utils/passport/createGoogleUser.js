// services/userService.js
const User = require('../../models/user');
const handleSendEmail = require('../handleSendEmail');

async function findOrCreateGoogleUser(profile) {
    const email = profile.emails?.[0]?.value;
    const firstName = profile.name?.givenName || '';
    const lastName = profile.name?.familyName || '';
    const googleId = profile.id


    // 1. Try to find user by googleId
    let user = await User.findOne({ googleId: googleId });

    // 2. If not found by googleId, try by email
    if (!user) {
    user = await User.findOne({ email });
    }

    if (user && user.activeUser) {
        // Link googleId if email exists
        user.googleId = googleId;
        await user.save();
    }

    if (user && !user.activeUser) {
                return res.status(404).json({ message: "This user has been deactivated, please contact our support team to verify if account can be reactivated." });
    }

    // 3. If still not found, create a new user
    if (!user) {
    user = await new User({
        firstName,
        lastName,
        email,
        googleId: googleId
    });
    user = await user.save()
    await handleSendEmail('welcome.html', email, 'Your Account Creation Is Successfull!', {
                  username: firstName,
                  year: new Date().getFullYear(),
                });
    }
    user = await User.findOne({ email });

    return user;
}

module.exports = { findOrCreateGoogleUser };
