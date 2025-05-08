const blogRouter = require("express").Router();
const Blog = require("../models/blogs")
const { userExtractor } = require("../utils/middleware")
const fs = require('fs')
const multer = require('multer')
const uploadMiddleware = multer({dest: "uploads/"})

blogRouter.get("/", async (req, res) => {
    // const author = req.user
    // console.log(author)
    try{
        const allBlogs = await Blog.find({}).populate("author").sort({updatedAt: -1});
        // console.log(allBlogs)
        // if (!authorBlogs.length) {
        //     return res.status(404).json({ message: "No blogs are found for this user" });
        // }
        res.status(200).json({ blogs: allBlogs, message: "Blogs retrieved successfully!" })
    } catch(error) {
        console.log(error)
        res.status(500).json({error: error, message:"Unable to connect to the server, please try again in a few minutes."})
    }
})

blogRouter.get("/category-count", async(req, res) => {
    try {
        const counts = await Blog.aggregate([
          {$group: {
              _id: "$category",
              count: { $sum: 1 }
            }
          }
        ]);

        // Convert array to an object with category names as keys
        const countResult = counts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
            }, {});


        res.json(countResult);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to count blogs by category" });
      }
})

blogRouter.get("/:id", async (req, res) => {
    const id = req.params.id

    try {
        const selectedBlog = await Blog.find({_id:id}).populate('author');
        if (!selectedBlog.length) {
            return res.status(404).json({error: `No blog with id ${id} is found for this author!`})
        }
        res.status(200).json({ blog: selectedBlog, message: "Blog retrieved successfully!" })
        } catch (error) {
            console.log(error.message)
        res.status(500).json({error: "Internal server error"})
    }
})

blogRouter.post("/", userExtractor, uploadMiddleware.single('articleImg'), async (req, res) => {
    const { title, blogContent, readTime, category } = req.body
    const author = req.user


    // let filePath = ""

    if(!title || !blogContent || !readTime || !req.file) {
        return res.status(400).json({error:"Some of the required fields are missing."})
    }
    //403 error skipped when incorrect token or no token is provided for a user. Something to be corrected in userExtractor? Seem not needed as unregistered user can't login to even attempt creating a note, right?

    if(!author) {
        return res.status(403).json({error: "Unauthorized request."})
    }
    try {
        const { originalname, path } = req.file
        const fileNameSplit = originalname.split('.')
        const ext = fileNameSplit[fileNameSplit.length - 1]
        const filePath = (path + '.' + ext)
        fs.renameSync(path, filePath)

        const newBlog = new Blog({ title, blogContent, readTime, articleImg: filePath, author, category })
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