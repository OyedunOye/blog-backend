const loginRouter = require("express").Router();
const User = require("../models/user")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('../utils/config');
const { generateOTP } = require("../utils/generateOtp");
const handleSendEmail = require('../utils/handleSendEmail');

// console.log(new Date(Date.now()))
// console.log(new Date)


loginRouter.post("/", async (req, res) => {
    const { email, password } = req.body
    const user = await User.findOne({email})
    if (user && !user.activeUser) {
                return res.status(404).json({ message: "This user has been deactivated, please contact our support team to verify if account can be reactivated." });
            }
    const passwordCheck = user === null ? false : await bcrypt.compare(password, user.passwordHash)
    if (!(user && passwordCheck)) {
        return res.status(401).json({error: "Incorrect password or email!"})
    }
    const userDetails = { email:user.email, id: user._id, firstName:user.firstName, lastName:user.lastName, authorImg:user.authorImg }
    // console.log(user.isTwoFAuthActive)
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
})

loginRouter.post("/validate-otp", async(req, res)=> {
    const {otp, email} = req.body
    const user = await User.findOne({email})
    const currentTime = new Date(Date.now())

    if (user && !user.activeUser) {
                return res.status(404).json({ message: "This user has been deactivated, please contact our support team to verify if account can be reactivated." });
            }

    if (!(otp)) {
        return res.status(401).json({error: "OTP is required!"})
    }

    if (!(user)) {
        return res.status(404).json({error: "User not found."})
    }

    try {
        if(currentTime < user.otpExpires && otp=== user.otp) {
            const userDetails = { email:user.email, id: user._id, firstName:user.firstName, lastName:user.lastName, authorImg:user.authorImg }
            const token = jwt.sign(userDetails, config.CRYPTO_KEY, {expiresIn: '1d'})
            return res.status(200).json({token: token, message: "Logged in successfully!"})
        } else if(otp!== user.otp) {
            return res.status(401).json({error: "The OTP you provided does not match the one sent to your email!"})

        } else if(currentTime > user.otpExpires) {
            return res.status(401).json({error: "This OTP has expired, please request for a new OTP."})
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({error: "An error occured, unable to log you in at the moment, please try again later."})
    }

})

loginRouter.post("/resend-otp", async(req, res)=>{
    const { email } = req.body
    const user = await User.findOne({email})

    if (user && !user.activeUser) {
                return res.status(404).json({ message: "This user has been deactivated, please contact our support team to verify if account can be reactivated." });
            }
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
        res.status(200).json({email: user.email, message: "OTP has been resent to your email address successfully!"})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: "Unable to send you an OTP at the moment, please try again later."})
    }

})
module.exports = loginRouter