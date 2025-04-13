const readerRouter = require("express").Router();
const bcrypt = require('bcrypt')
const Reader = require("../models/reader")

readerRouter.get("/", async (req, res) => {
    const allReaders = await Reader.find({})
    res.json(allReaders)
})

readerRouter.post("/", async (req, res) => {

    try {
        const { firstName, lastName, email, password } = req.body
        const existingEmail  = await Reader.find({email: email}).exec()
        console.log(existingEmail)

        if (existingEmail.length >= 1) {
            return res.status(409).json({user: null, message: "User already exists, please login."})
        }

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({error: "All the 4 fields are required, please provide all to create an account."})
        }
        const salt = 10
        // console.log(req)
        // console.log(firstName, lastName, email, password)
        // console.log(req.body)
        const passwordHash = await bcrypt.hashSync(password, salt)
        const newReader = new Reader({firstName, lastName, email, passwordHash})
        const savedReader = await newReader.save()
        res.status(201).json({reader: savedReader, message: "User created Successfully!"})
    } catch (error) {
        console.log(error)
    }
})

module.exports = readerRouter