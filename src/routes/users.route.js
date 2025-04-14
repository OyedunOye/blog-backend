const userRouter = require("express").Router();
const bcrypt = require('bcrypt')
const User = require("../models/user")

userRouter.get("/", async (req, res) => {
    const allUsers = await User.find({})
    res.json(allUsers)
})

userRouter.post("/", async (req, res) => {

    try {
        const { firstName, lastName, email, password } = req.body
        const existingEmail  = await User.find({email: email}).exec()
        console.log(existingEmail)

        if (existingEmail.length >= 1) {
            return res.status(409).json({user: null, message: "User already exists, please login."})
        }

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({error: "All the 4 fields are required, please provide all to create an account."})
        }

        const salt = 10
        const passwordHash = await bcrypt.hashSync(password, salt)
        const newUser = new User({firstName, lastName, email, passwordHash})
        const savedUser = await newUser.save()
        res.status(201).json({user: savedUser, message: "User created Successfully!"})
    } catch (error) {
        console.log(error)
    }
})

userRouter.get("/:id", async (req, res) => {
    const id = req.params.id
    const user = await User.findById(id)
    res.json(user)
})

userRouter.delete("/:id", async (req,res) => {
    try {
        const id = req.params.id
        const deletedUser = await User.findByIdAndDelete(id).exec()
        console.log(deletedUser)
        if (!deletedUser) {
            return res.status(404).json({ message: "User does not exist!" });
        }
        res.status(200).json({message: `User ${deletedUser.firstName} has been deleted successfully.`})
        } catch (error) {
            res.status(500).json({ error: "An error occurred while deleting the item" });
        }

})

userRouter.patch("/:id", async (req, res) => {
    const updates = req.body
    const id = req.params.id

    try {
        const updatedUser = await User.findOneAndUpdate({_id:id}, updates, {isDeleted: true});
        console.log(updatedUser)
        if (!updatedUser) {
            return res.status(404).json({error: `No user with id ${id} exists! Create a user instead`})
        }
        const updatedInstance = await User.find({_id:id})
        res.status(200).json({user: updatedInstance, message: "User details has been updated successfully!"})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Internal server error"})
    }
})

module.exports = userRouter