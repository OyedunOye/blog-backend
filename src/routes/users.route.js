const userRouter = require("express").Router();
const bcrypt = require('bcryptjs')
const fs = require('fs')
const multer = require('multer')
const uploadMiddleware = multer({dest: "uploads/"})
const User = require("../models/user");
const { userExtractor } = require("../utils/middleware");

userRouter.get("/", async (req, res) => {
    const allUsers = await User.find({})
    res.json(allUsers)
})

userRouter.get("/authors", async (req, res) => {
    try {
        const allUsers = await User.find({}).populate("blogs")
        // .sort({blogs.length: -1})
        // res.json(allUsers)
        const authors = []
        allUsers.map((user)=> {
            if (user.blogs.length !==0){
                authors.push(user)
            }
        })

        return res.status(200).json({authors: authors, message: "All authors retrieved successfully!"})
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "An error occured, unable to retrieve the list of blog authors."})
    }

})

userRouter.post("/", uploadMiddleware.single('authorImg'), async (req, res) => {

    const { firstName, lastName, email, password } = req.body

    let filePath = ""
    // const { originalname, path } = req.file

    try {
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                error: "All the 4 fields are required, please provide all to create an account."
            })
        }

        const existingEmail  = await User.find({email: email}).exec()

        if (existingEmail.length >= 1) {
            return res.status(409).json({
                user: null,
                message: "User already exists, please login."
            })
        }

        // if(originalname && path) {
            // if(typeof req.file !== "undefined") {
        if(req.file) {
            const { originalname, path } = req.file
            const fileNameSplit = originalname.split('.')
            const ext = fileNameSplit[fileNameSplit.length - 1]
            filePath = (path + '.' + ext)
            fs.renameSync(path, filePath)
        }

        const salt = 10
        const passwordHash = await bcrypt.hash(password, salt)

        const newUser = new User({firstName, lastName, email, passwordHash, authorImg: filePath})
        const savedUser = await newUser.save()
        res.status(201).json({user: savedUser, message: "User created Successfully!"})
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Something went wrong!" })
    }
})

userRouter.get("/profile", userExtractor, async (req, res) => {
    const userId = req.user._id.toString()
    console.log(userId)
    try {
        
        const user = await User.findById(userId).populate('blogs')
        res.status(200).json({user, message: "Retrieved the user successfully"})
    } catch (error) {
        return res.status(500).json({error: "Unable to get user's details"})
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