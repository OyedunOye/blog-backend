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
        const passwordHash = await bcrypt.hashSync(password, salt)
        const newReader = new Reader({firstName, lastName, email, passwordHash})
        const savedReader = await newReader.save()
        res.status(201).json({reader: savedReader, message: "User created Successfully!"})
    } catch (error) {
        console.log(error)
    }
})

readerRouter.get("/:id", async (req, res) => {
    const id = req.params.id
    const reader = await User.findById(id)
    res.json(reader)
})

readerRouter.delete("/:id", async (req,res) => {
    try {
        const id = req.params.id
        const deletedReader = await User.findByIdAndDelete(id).exec()
        console.log(deletedReader)
        if (!deletedReader) {
            return res.status(404).json({ message: "User does not exist!" });
        }
        res.status(200).json({message: `User ${deletedReader.firstName} has been deleted successfully.`})
        } catch (error) {
            res.status(500).json({ error: "An error occurred while deleting the item" });
        }

})

readerRouter.patch("/:id", async (req, res) => {
    const updates = req.body
    const id = req.params.id

    try {
        const updatedReader = await User.findOneAndUpdate({_id:id}, updates, {isDeleted: true});
        console.log(updatedReader)
        if (!updatedReader) {
            return res.status(404).json({error: `No user with id ${id} exists! Create a user instead`})
        }
        const updatedInstance = await User.find({_id:id})
        res.status(200).json({user: updatedInstance, message: "User details has been updated successfully!"})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Internal server error"})
    }
})

module.exports = readerRouter