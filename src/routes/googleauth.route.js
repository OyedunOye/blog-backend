const passport = require('passport')
const googleAuthRouter = require("express").Router();
// const User = require("../models/user")
const jwt = require('jsonwebtoken')
const config = require('../utils/config');
const { generateOTP } = require("../utils/generateOtp");
const handleSendEmail = require('../utils/handleSendEmail');

// Google OAuth starts here
googleAuthRouter.get("/auth/google", passport.authenticate('google', {
    scope: ["profile", "email"]
}))

// callback after Google authenticates the user
googleAuthRouter.get('/auth/google/callback', passport.authenticate('google',
    { failureRedirect:'http://localhost:3000/login'}),
    async(req, res)=> {
    console.log(req)
    const user = req.user
    const userDetails = { email:user.email, id: user._id, firstName:user.firstName, lastName:user.lastName, authorImg:user.authorImg }

    if (user.isTwoFAuthActive) {
        try {

            const otpCode = generateOTP()
            user.otp = otpCode
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
            // console.log(otpExpires)
            user.otpExpires = otpExpires;
            await user.save()

            await handleSendEmail('otp.html', user.email, 'OTP Code for 2 Factor Authentication ✅', {
              username: user.firstName,
              otpCode: otpCode,
              year: new Date().getFullYear(),
            });
            res.status(200).json({email: user.email, message: "OTP sent successfully!"})
        } catch (error) {
            console.log(error)
            return res.status(500).json({error: "Unable to send you an OTP at the moment, please try again later."})
        }
    } else {
        const token = jwt.sign(userDetails, config.CRYPTO_KEY, {expiresIn: '1d'})
        res.status(200).json({token: token, message: "Logged in successfully!"})

    }

    // res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
})

module.exports = googleAuthRouter
