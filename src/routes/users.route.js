const userRouter = require("express").Router();
const User = require("../models/user");
const bcrypt = require('bcryptjs')
const { userExtractor } = require("../utils/middleware");
const multer = require("multer")
const { storage, cloudinary } = require("../utils/cloudinary/cloudinary");
const uploadMiddleware = multer({ storage})
const handleSendEmail = require('../utils/handleSendEmail');
const Blog = require("../models/blogs");

// Get all users, both active and inactive
userRouter.get("/", async (req, res) => {
    try {
        const allUsers = await User.find({})
        return res.status(200).json({allUsers:allUsers, message:"Successfully retrieved all users"})
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "An error occured, unable to retrieve the list of users."})
    }
})

// Get all users, both active and inactive
userRouter.get("/active-users", async (req, res) => {
    try {
        const allUsers = await User.find({activeUser: true})
        return res.status(200).json({allUsers:allUsers, message:"Successfully retrieved all users"})
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "An error occured, unable to retrieve the list of the active users."})
    }
})

userRouter.get("/authors", async (req, res) => {
    try {
        const allActiveUsers = await User.find({activeUser: true}).populate("blogs").sort({createdAt: -1})
        // .sort({blogs.length: -1})
        // res.json(allUsers)
        // const activeUsers = []

        // console.log(allActiveUsers)

        const authors = []
        allActiveUsers.map((user)=> {
            if (user.blogs.length > 0){
                authors.push(user)
            }
        })

        return res.status(200).json({authors: authors, message: "All authors retrieved successfully!"})
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "An error occured, unable to retrieve the list of blog authors."})
    }

})

userRouter.post("/", uploadMiddleware.single("authorImg"), async (req, res) => {
    // console.log("REQ.BODY:", req.body);
    // console.log("REQ.FILE:", req.file);
    // console.log("REQ.HEADERS:", req.headers["content-type"]);

    const { firstName, lastName, email, password } = req.body
    // console.log(firstName, lastName, email, password)
    // console.log(req.file)
    
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
            error: "All the 4 fields are required, please provide all to create an account."
        })
    }

    let filePath = ""
    try {

        const existingEmail  = await User.find({email: email}).exec()

        if (existingEmail.length >= 1 && !existingEmail.activeUser) {
            return res.status(409).json({
                user: null,
                message: "This account is deactivated, please contact support to reactivate your account."
            })
        }

        if (existingEmail.length >= 1 ) {
            return res.status(409).json({
                user: null,
                message: "User already exists, please login."
            })
        }

        if(req.file) {
            filePath=req.file.path
        }

        // console.log(filePath)

        const salt = 10
        const passwordHash = await bcrypt.hash(password, salt)

        const newUser = await new User({firstName, lastName, email, passwordHash, authorImg: filePath})
        const savedUser = await newUser.save()

        await handleSendEmail('welcome.html', email, 'Your Account Creation Is Successfull!', {
              username: firstName,
              year: new Date().getFullYear(),
            });

        return res.status(201).json({user: savedUser, message: "User created Successfully!"})
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Something went wrong!" })
    }
})

userRouter.get("/profile", userExtractor, async (req, res) => {
    const userId = req.user._id.toString()
    if (!userId){
            return res.status(401).json({error: "Unauthorized request, please log in first."})
        }
    try {
        const user = await User.findById(userId).populate('blogs').populate('bookmarked').populate('loved')
        .populate([
            {
                path: 'bookmarked',
                populate: {
                    path:'author',
                }
            }
        ])
        .populate([
            {
                path: 'loved',
                populate: {
                    path:'author',
                }
            }
        ])
        // .populate('bookmarked.author').populate('bookmarked.comments.commenter')
        if (!user || !user.activeUser){
            return res.status(404).json({error: "User not found"})
        }
        res.status(200).json({user, message: "Retrieved the user successfully"})
    } catch (error) {
        return res.status(500).json({error: "Internal server error, unable to get user's details."})
    }
})

userRouter.patch("/edit-profile", userExtractor, uploadMiddleware.single('authorImg'), async (req, res) => {
    const updates = req.body
    // console.log(req.body)
    // console.log(req.file)
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

        if(!thisUser || !thisUser.activeUser){
            return res.status(404).json({error: `The user with id ${userId} does not exist!`})
        }

        if(req.file){
            filePath = req.file.path
            const previousImagePath = thisUser.authorImg

                // Safely delete the old image file
                if (previousImagePath !=="") {

                    try {
                        const firstSplit = previousImagePath.split("/")
                        const fileWithExt = firstSplit[firstSplit.length-2] + "/" + firstSplit[firstSplit.length-1]
                        const secondSplit = fileWithExt.split(".")
                        const pubId = secondSplit[0]
                        // console.log(pubId)

                        await cloudinary.uploader.destroy(pubId)
                    } catch (error) {
                        console.error("Failed to delete previous image:", error)
                    }
                }

                const updatedUser = await User.findByIdAndUpdate(userId, {...updates, authorImg: filePath}, {new: true})
                const updatedUserInstance = await updatedUser.save()

                return res.status(200).json({user: updatedUserInstance, message: "The user profile has been updated successfully!"})
        } else {
             if(updates.authorImg==="") {
            const previousImagePath = thisUser.authorImg

                if (previousImagePath !=="" ) {

                    try {
                        const firstSplit = previousImagePath.split("/")
                        const fileWithExt = firstSplit[firstSplit.length-2] + "/"+ firstSplit[firstSplit.length-1]
                        const secondSplit = fileWithExt.split(".")
                        const pubId = secondSplit[0]
                        // console.log(pubId)

                        await cloudinary.uploader.destroy(pubId)

                    } catch (error) {
                        console.error("Failed to delete previous image:", error)
                    }
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
        if(!thisUser || !thisUser.activeUser){
            return res.status(404).json({error: `The user with id ${userId} does not exist!`})
        }
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

userRouter.patch("/toggle-two-fa", userExtractor, async(req, res)=> {
    // console.log(req)
    // console.log(req.user)
    // console.log(req.body)
    const userId = req.user._id.toString()
    // console.log(userId)
    const {status} = req.body
    // console.log(status)

    if (!req.user || !status) {
      return res.status(401).json({ error: "Unauthorized action" });
    }

    try {
        const concernedUser = await User.find({_id: userId})
        if (!concernedUser.activeUser){
            return res.status(404).json({error: `The user with id ${userId} does not exist!`})
        }
        const updatedUser = await User.findByIdAndUpdate(userId, {isTwoFAuthActive: status}, {new: true});
        const updatedUserInstance = await updatedUser.save()
        if (updatedUserInstance.isTwoFAuthActive === true) {
            await handleSendEmail('twoFAActiveNotification.html', updatedUserInstance.email, 'Two factor authentication has been activated on your account', {
              username: updatedUserInstance.firstName,
              year: new Date().getFullYear(),
            });
        }
        return res.status(200).json({user: updatedUserInstance, message: "The two factor authentication has been successfully updated!"})
    } catch (error) {
        console.error("Error toggling the two factor authentication button.", error);
        return res.status(500).json({ error: "Opps, there is an internal server error!" });
    }
})

userRouter.patch("/deactivate-profile", userExtractor, async (req,res) => {
    const userId = req.user._id.toString()

    if(!userId){
        return res.status(401).json({error: "Unauthorized request, please log in first."})
    }
    try {
        const userToInactivate = await User.findById(userId).populate('blogs')
        // console.log(userToInactivate)
        if (!userToInactivate || !userToInactivate.activeUser) {
                return res.status(404).json({ message: "User does not exist!" });
            }
        userToInactivate.activeUser=false

        // I updated and saved displayBlog property individually for blogs of inactive author. How could I posibly do this multiple doc update?
        // I attempted to update bulk but couldn't save since the blogs are in an array...
        const userBlogs = await Blog.find({author: userId})
        console.log(userBlogs)
        for (let blog in userBlogs){
            const eachBlog = userBlogs[blog]
            eachBlog.displayBlog=false
            await eachBlog.save()
        }
        // userBlogs.map(([blog])=>{
        //     blog.displayBlog=false
        //      userBlogs.save()
        //     // userToInactivateBlogArray.push(blog)
        // })
        // console.log(userToInactivateBlogArray)
        // console.log("userblogs are:", userBlogs)
        // await userBlogs.save()
        await userToInactivate.save()
        

            res.status(200).json({message: `User ${userToInactivate.firstName} has been deactivated.`})

        } catch (error) {
            return res.status(500).json({ error: `An error occurred while deactivating the user ${req.user.firstName}'s account, please try again later.` });
        }

})

// endpoint reactivates user on user's request provided request is within the 90 days grace period. Strictly for app support use!!
userRouter.patch("/reactivate-profile", userExtractor, async (req,res) => {
    const userId = req.user._id.toString()
    const {userIdToRestore} = req.body
    console.log(userIdToRestore)

    // user oyesinaoyedun@yahoo.com, main and confirmed prod db
    // if(!userId || userId !== "68472f79e34dc07e6bc6cab2"){
    //     return res.status(401).json({error: "Unauthorized request, only admin can delete account."})
    // }

    // user oba@lola.com as admin, blog_app db
    if(!userId || !req.user.isAdmin){
        return res.status(401).json({error: "Unauthorized request, only admin can reactivate account."})
    }

    try {
        const userToReactivate = await User.findById(userIdToRestore).populate('blogs')
        console.log(userToReactivate)
        if (!userToReactivate) {
                return res.status(404).json({ message: "User does not exist!" });
            }

        if (userToReactivate.activeUser) {
                return res.status(404).json({ message: "User is active!" });
            }
        userToReactivate.activeUser=true

        // I updated and saved displayBlog property individually for blogs of inactive author. How could I posibly do this multiple doc update?
        // I attempted to update bulk but couldn't save since the blogs are in an array...
        const userBlogs = await Blog.find({author: userIdToRestore})
        console.log(userBlogs)
        for (let blog in userBlogs){
            const eachBlog = userBlogs[blog]
            eachBlog.displayBlog=true
            await eachBlog.save()
        }

        await userToReactivate.save()


            res.status(200).json({message: `User ${userToReactivate.firstName} has been reactivated!`})

        } catch (error) {
            return res.status(500).json({ error: `An error occurred while restoring the user ${req.user.firstName}, please try again later.` });
        }

})


// endpoint deletes user and his blogs permanently. Strictly for app support use!!
userRouter.patch("/delete-profile", userExtractor, async (req,res) => {
    const userId = req.user._id.toString()
    const {userIdToDelete} = req.body

    
    if(!userId || !req.user.isAdmin){
        return res.status(401).json({error: "Unauthorized request, only admin can delete account."})
    }
    try {
        const deletedUser = await User.findByIdAndDelete(userIdToDelete).exec()
        console.log(deletedUser)
        const previousImagePath = deletedUser.authorImg

            if (previousImagePath !=="" ) {

                try {
                    const firstSplit = previousImagePath.split("/")
                    const fileWithExt = firstSplit[firstSplit.length-2] + "/"+ firstSplit[firstSplit.length-1]
                    const secondSplit = fileWithExt.split(".")
                    const pubId = secondSplit[0]
                    console.log(pubId)

                    await cloudinary.uploader.destroy(pubId)

                } catch (error) {
                    console.error("Failed to delete previous image:", error)
                }
            }
            const blogsToDelete = await Blog.find({author: userIdToDelete})

            for (let blog in blogsToDelete){
                const eachBlog = await Blog.findByIdAndDelete(blogsToDelete[blog]._id)
                const previousImagePath = eachBlog.articleImg;


                try {
                      // split the saved image url to obtain cloudinary's publicId which can be used to delete or do other operations on a cloudinary asset
                      const firstSplit = previousImagePath.split("/")
                      const fileWithExt = firstSplit[firstSplit.length-2] + "/" + firstSplit[firstSplit.length-1]
                      const secondSplit = fileWithExt.split(".")
                      const pubId = secondSplit[0]
                      // console.log(pubId)
                      console.log('Deleting here...')
                      await cloudinary.uploader.destroy(pubId)
                    } catch (error) {
                      console.error("Failed to delete previous image:", error)
                    }
            }
            // blogsToDelete.filter(blog => blog.author.toString() !== userIdToDelete)
            console.log("BLOGS AND bLOG IMAGES DELETED SUCCESSFULLY")

            res.status(200).json({message: `User ${deletedUser.firstName} has been deleted successfully.`})
            if (!deletedUser) {
                return res.status(404).json({ message: "User does not exist!" });
            }
        } catch (error) {
            return res.status(500).json({ error: `An error occurred while deleting the user ${req.user.firstName}, please try again later.` });
        }

})


module.exports = userRouter