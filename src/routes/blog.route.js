const blogRouter = require("express").Router();
const Blog = require("../models/blogs")
const { userExtractor } = require("../utils/middleware")

blogRouter.get("/", userExtractor, async (req, res) => {
    const author = req.user
    console.log(author)
    try{
        const authorBlogs = await Blog.find({author}).populate('author', {firstName: 1, lastName: 1, email: 1});
        console.log(authorBlogs)
        if (!authorBlogs.length) {
            return res.status(404).json({ message: "No blogs are found for this user" });
        }
        res.status(200).json({ blogs: authorBlogs, message: "Blogs retrieved successfully!" })
    } catch(error) {
        res.status(500).json({error: error, message:"Unable to connect to the server, please try again in a few minutes."})
    }
})

blogRouter.get("/:id", userExtractor, async (req, res) => {
    const id = req.params.id
    const author = req.user

    try {
        const selectedBlog = await Blog.find({_id:id, author}).populate('author', {firstName: 1, lastName: 1, email: 1});
        if (!selectedBlog.length) {
            return res.status(404).json({error: `No blog with id ${id} is found for this author!`})
        }
        res.status(200).json({ note: selectedBlog, message: "Blog retrieved successfully!" })
        } catch (error) {
            console.log(error.message)
        res.status(500).json({error: "Internal server error"})
    }
})

blogRouter.post("/", userExtractor, async (req, res) => {
    const { title, blogContent } = req.body
    const author = req.user
    if(!title || !blogContent ) {
        return res.status(400).json({error:"One or both of the required fields are missing."})
    }
    //403 error skipped when incorrect token or no token is provided for a user. Something to be corrected in userExtractor? Seem not needed as unregistered user can't login to even attempt creating a note, right?

    if(!author) {
        return res.status(403).json({error: "Unauthorized request."})
    }
    try {
        const newBlog = new Blog({ title, blogContent, author })
        const savedBlog = await newBlog.save()
        author.blogs = author.blogs.concat(savedBlog._id)
        author.save()
        res.status(201).json({blog: savedBlog, message: "New blog created Successfully!"})
    } catch (error) {
        res.status(500).json({error: "Opps, there is an internal server error!"})
    }
})

blogRouter.patch("/:id", userExtractor, async (req, res) => {
    const updates = req.body
    const id = req.params.id
    const author = req.user

    try {
        const updatedBlog = await Blog.findOneAndUpdate({_id:id, author}, updates, {isDeleted: true});
        // console.log(updatedBlog)
        if (!updatedBlog) {
            return res.status(404).json({error: `No blog with id ${id} is found for this author!`})
        }
        const updatedInstance = await Blog.find({_id:id, author})
        res.status(200).json({blog: updatedInstance, message: "Blog has been updated successfully!"})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Internal server error"})
    }
})

blogRouter.delete("/:id", userExtractor, async (req, res) => {
    const id = req.params.id
    const author = req.user

    try {
        const deletedBlog = await Blog.findOneAndDelete({author, _id:id})
        console.log(deletedBlog)
        if (!deletedBlog) {
            return res.status(404).json({message: "Blog does not exist."})
        }
        res.status(204).json({message: "Blog deleted Successfully!"})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Internal server error"})
    }
})

module.exports = blogRouter