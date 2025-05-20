const jwt = require('jsonwebtoken')
const config = require("./config")
const User = require('../models/user')
const logger = require('./logger')

const errorHandler = (err, req, res, next) => {
    logger.error(err.message)
    if(err.name === "JsonWebTokenError") {
        return res.status(400).send({error: "Invalid token"})
    }
    else if(err.name === "TokenExpiredError") {
        return res.status(400).send({error: "Token expired"})
    }
    else if(err.name === "CastError") {
        return res.status(400).send({error: "Malformatted id"})
    }
    else if(err.name === "ValidationError") {
        return res.status(400).send({error: "All fields are required"})
    }
}

const tokenExtractor = (req, res, next) => {
    const auth = req.get("Authorization" || "authorization")
    if (auth && auth.startsWith("Bearer ")) {
        const updatedAuth = auth.replace("Bearer ", "")
        req.token = updatedAuth
    }
    next()
}

const userExtractor = async (req, res, next) => {
    console.log("token inside userExtractor is", req.token)
    const decodedToken = jwt.verify(req.token, config.CRYPTO_KEY)
    if(!decodedToken) {
        return res.status(400).json({error:"Invalid token."})
    }
    req.user = await User.findById(decodedToken.id)
    next()
}

module.exports = { userExtractor, tokenExtractor, errorHandler }