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
        const allUsers = await User.find({}).populate("blogs").sort({createdAt: -1})
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
        return res.status(201).json({user: savedUser, message: "User created Successfully!"})
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong!" })
    }
})

userRouter.get("/profile", userExtractor, async (req, res) => {
    const userId = req.user._id.toString()
    console.log(userId)
    if (!userId){
            return res.status(401).json({error: "Unauthorized request, please log in first."})
        }
    try {
        const user = await User.findById(userId).populate('blogs')
        if (!user){
            return res.status(404).json({error: "User not found"})
        }
        res.status(200).json({user, message: "Retrieved the user successfully"})
    } catch (error) {
        return res.status(500).json({error: "Internal server error, unable to get user's details."})
    }
})

userRouter.patch("/edit-profile", userExtractor, uploadMiddleware.single('authorImg'), async (req, res) => {
    const updates = req.body
    let filePath = ""

    const userId = req.user._id.toString()
    if (!userId){
        return res.status(401).json({error: "Unauthorized request, please log in first."})
    }

    if (!updates && !req.file){
        return res.status(400).json({error:"You cannot send an empty form as update. At least, one of the fields is required."})
    }

    try {
        const thisUser = await User.findById(userId);

        if(!thisUser){
            return res.status(404).json({error: `The user with id ${userId} does not exist!`})
        }

        if(req.file){
            const { originalname, path } = req.file
                const fileNameSplit = originalname.split('.')
                const ext = fileNameSplit[fileNameSplit.length - 1]
                filePath = (path + '.' + ext)
                fs.renameSync(path, filePath)

                const previousImagePath = thisUser.authorImg

                // Safely delete the old image file
                if (previousImagePath && fs.existsSync(previousImagePath)) {
                    console.log("check image to delete")
                fs.unlink(previousImagePath, (err) => {
                    console.log('Deleting here...')
                    if (err) console.error("Failed to delete previous image:", err);
                });
                }

                const updatedUser = await User.findByIdAndUpdate(userId, {...updates, authorImg: filePath}, {new: true})
                const updatedUserInstance = await updatedUser.save()

                return res.status(200).json({user: updatedUserInstance, message: "The user profile has been updated successfully!"})
        } else {
             if(updates.authorImg==="") {
            const previousImagePath = thisUser.authorImg

                // Safely delete the old image file
                if (previousImagePath && fs.existsSync(previousImagePath)) {
                    console.log("check image to delete")
                fs.unlink(previousImagePath, (err) => {
                    console.log('Deleting here...')
                    if (err) console.error("Failed to delete previous image:", err);
                });
                }
            }

            const updatedUser = await User.findByIdAndUpdate(userId, {...updates}, {new: true});

            const updatedUserInstance = await updatedUser.save()
            return res.status(200).json({user: updatedUserInstance, message: "The user profile has been updated successfully!"})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: "Internal server error"})
    }
})

userRouter.patch("/change-password", userExtractor, async(req, res) => {
    const {oldPassword, newPassword } = req.body
    const userId = req.user._id.toString()
    if (!oldPassword || !newPassword ) {
        return res.status(400).json({error: "Both the current and new password are required to change your password"})
    }

    if(!userId){
        return res.status(401).json({error: "Unauthorized request, please log in first."})
    }
    try {
        const thisUser = await User.findById(userId)
        const passwordCheck = thisUser === null ? false : await bcrypt.compare(oldPassword, thisUser.passwordHash)

        if (!passwordCheck) {
            return res.status(401).json({error: "The current password that you provided does not match the current password in our record."})
        }

        const salt = 10
        const passwordHash = await bcrypt.hash(newPassword, salt)

        const updatedUser = await User.findByIdAndUpdate(userId, {passwordHash: passwordHash}, {new: true});
        const updatedUserInstance = await updatedUser.save()
        return res.status(200).json({user: updatedUserInstance, message: "The user password has been successfully changed!"})

    } catch (error) {
        console.log(error)
        return res.status(500).json({error: "Internal server error"})
    }
})

userRouter.delete("/delete-profile", userExtractor, async (req,res) => {
    const userId = req.user._id.toString()

    if(!userId){
        return res.status(401).json({error: "Unauthorized request, please log in first."})
    }
    try {
        const deletedUser = await User.findByIdAndDelete(userId).exec()
        console.log(deletedUser)
        if (!deletedUser) {
            return res.status(404).json({ message: "User does not exist!" });
        }
        res.status(200).json({message: `User ${deletedUser.firstName} has been deleted successfully.`})
        } catch (error) {
            return res.status(500).json({ error: `An error occurred while deleting the user ${req.user.firstName}, please try again later.` });
        }

})


module.exports = userRouter