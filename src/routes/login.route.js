const loginRouter = require("express").Router();
const User = require("../models/user")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('../utils/config')


loginRouter.post("/", async (req, res) => {
    const { email, password } = req.body
    const user = await User.findOne({email})
    const passwordCheck = user === null ? false : await bcrypt.compare(password, user.passwordHash)
    if (!(user && passwordCheck)) {
        return res.status(401).json({error: "Invalid password!"})
    }
    const userDetails = { email:user.email, id: user._id, firstName:user.firstName, lastName:user.lastName, authorImg:user.authorImg }
    const token = jwt.sign(userDetails, config.CRYPTO_KEY, {expiresIn: '1d'})
    res.status(200).json({token: token, message: "Logged in successfully!"})
})
module.exports = loginRouter