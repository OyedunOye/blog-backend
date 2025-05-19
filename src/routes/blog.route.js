const blogRouter = require("express").Router();
const Blog = require("../models/blogs")
const { userExtractor } = require("../utils/middleware")
const fs = require('fs')
const multer = require('multer')
const uploadMiddleware = multer({dest: "uploads/"})
const path = require("path")

blogRouter.get("/", async (req, res) => {
    // const author = req.user
    // console.log(author)
    try{
        const allBlogs = await Blog.find({}).populate("author").sort({createdAt: -1});
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

blogRouter.post("/comment/:id", userExtractor, async(req, res)=> {
    const {comment} = req.body
    const commenterId = req.user._id
    const id = req.params.id
    try {
        const selectedBlog = await Blog.findById(id).populate('author');
        if (!selectedBlog) {
            return res.status(404).json({ error: "Blog not found" });
        }
        // console.log(selectedBlog)
        const newComment = {
            comment: comment,
            commenter: commenterId
        }
        selectedBlog.comments = selectedBlog.comments.concat(newComment)
        selectedBlog.commentCount = selectedBlog.comments.length;
        selectedBlog.populate('comments.commenter')
        console.log("the comment is ",newComment)
        console.log(selectedBlog)
        updatedSelectedBlog = await selectedBlog.save()
        res.status(201).json({updatedBlog: updatedSelectedBlog, message: "New comment added successfully!"})
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({error: "Opps, there is an internal server error!"})
    }
})

blogRouter.get("/:id", async (req, res) => {
    const id = req.params.id

    try {
        const selectedBlog = await Blog.find({_id:id}).populate('author').populate('comments.commenter');
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

    console.log(req.body)

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

blogRouter.patch("/:id", userExtractor, uploadMiddleware.single('articleImg'), async (req, res) => {
    const updates = req.body
    const id = req.params.id
    const author = req.user
    let filePath = ""
    const options = {new:true}

    if(!updates && !req.file){
        return res.status(400).json({error:"You cannot send an empty form as update. At least, one of the fields is required."})
    }
    try {
        const blogExists = await Blog.findById(id);
        const imagePath = path.join(process.cwd(), blogExists.articleImg)

        if (!blogExists) {
                return res.status(404).json({error: `No blog with id ${id} is found for this author!`})
            }
        if (req.file) {
            const { originalname, path } = req.file
            const fileNameSplit = originalname.split('.')
            const ext = fileNameSplit[fileNameSplit.length - 1]
            filePath = (path + '.' + ext)
            fs.renameSync(path, filePath)

            
            const previousImagePath = blogExists.articleImg;
            console.log(previousImagePath)

            // Safely delete the old image file
            if (previousImagePath && fs.existsSync(previousImagePath)) {
                console.log("check image to delete")
            fs.unlink(previousImagePath, (err) => {
                console.log('Deleting here...')
                if (err) console.error("Failed to delete previous image:", err);
            });
            }
 
            const updatedBlog = await Blog.findByIdAndUpdate(id, {...updates, articleImg: filePath}, options);

            const updatedInstance = await updatedBlog.save()
            // console.log("Updated blog: ", updatedInstance)
            res.status(200).json({blog: updatedInstance, message: "Blog has been updated successfully!"})
        } else if(!req.file){
            const updatedBlog = await Blog.findByIdAndUpdate(id, {...updates}, {new: true});
            // console.log("updates", updates)
            // console.log(updatedBlog)
            const updatedInstance = await updatedBlog.save()
            res.status(200).json({blog: updatedInstance, message: "Blog has been updated successfully!"})
        }

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