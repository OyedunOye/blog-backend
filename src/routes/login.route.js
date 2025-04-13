const loginRouter = require("express").Router();
const Reader = require("../models/reader")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const config = require('../utils/config')


loginRouter.post("/", async (req, res) => {
    const { email, password } = req.body
    const reader = await Reader.findOne({email})
    const passwordCheck = reader === null ? false : await bcrypt.compare(password, reader.passwordHash)
    if (!(reader && passwordCheck)) {
        return res.status(401).json({error: "Invalid password!"})
    }
    const readerDetails = { email:reader.email, id: reader._id, firstName:reader.firstName }
    const token = jwt.sign(readerDetails, config.CRYPTO_KEY, {expiresIn: '1d'})
    res.status(200).json({token: token, message: "Logged in successfully!"})
})
module.exports = loginRouter