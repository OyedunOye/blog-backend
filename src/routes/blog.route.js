const blogRouter = require("express").Router();
const Blog = require("../models/blogs");
const { userExtractor } = require("../utils/middleware");
const multer = require("multer");
const { storage, cloudinary } = require("../utils/cloudinary/cloudinary");
const uploadMiddleware = multer({ storage });
const handleSendEmail = require('../utils/handleSendEmail');
const Subscribers = require("../models/subscribers");

// const options = {
//   use_filename: true,
//   unique_filename: false,
//   overwrite: true,
// };

// Log the configuration
// console.log(cloudinary.config());

blogRouter.get("/", async (req, res) => {
  try {
    const allBlogs = await Blog.find({})
      .populate("author")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ blogs: allBlogs, message: "Blogs retrieved successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error,
      message:
        "Unable to connect to the server, please try again in a few minutes.",
    });
  }
});

blogRouter.get("/category-count", async (req, res) => {
  try {
    const counts = await Blog.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
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
});

blogRouter.post("/comment/:id", userExtractor, async (req, res) => {
  const { comment } = req.body;
  const commenterId = req.user._id;
  const id = req.params.id;
  try {
    const selectedBlog = await Blog.findById(id).populate("author");
    if (!selectedBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    const newComment = {
      comment: comment,
      commenter: commenterId,
    };
    selectedBlog.comments = selectedBlog.comments.concat(newComment);
    selectedBlog.commentCount = selectedBlog.comments.length;
    selectedBlog.populate("comments.commenter");
    updatedSelectedBlog = await selectedBlog.save();
    res.status(201).json({
      updatedBlog: updatedSelectedBlog,
      message: "New comment added successfully!",
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Opps, there is an internal server error!" });
  }
});

blogRouter.patch("/love/:id", userExtractor, async (req, res) => {
  const loverId = req.user._id;
  const id = req.params.id;
  const author = req.user

  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized action" });
    }
    const selectedBlog = await Blog.findById(id).populate("author");
    if (!selectedBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // const newLove = {lover: loverId}
    const index = selectedBlog.loves.indexOf(loverId);
    if (index === -1) {
      console.log("Never loved");
      selectedBlog.loves.push(loverId);
      author.loved = author.loved.concat(selectedBlog._id)
      await author.save()
    } else {
      // console.log("already loved")
      selectedBlog.loves = selectedBlog.loves.filter(
        (id) => id.toString() !== loverId.toString()
      );
      author.loved = author.loved.filter((id)=> id.toString() !== selectedBlog._id.toString())
      await author.save()
    }

    selectedBlog.loveCount = selectedBlog.loves.length;
    const updatedSelectedBlog = await selectedBlog.save();

    res
      .status(201)
      .json({ updatedBlog: updatedSelectedBlog, message: "Successful!" });
  } catch (error) {
    console.error("Error loving this blog:", error);
    res.status(500).json({ error: "Opps, there is an internal server error!" });
  }
});

blogRouter.patch("/bookmark/:id", userExtractor, async (req, res) => {
  const bookmarkerId = req.user._id;
  const id = req.params.id;
  const author = req.user

  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized action" });
    }
    const selectedBlog = await Blog.findById(id).populate("author");
    if (!selectedBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }


    const index = selectedBlog.bookmarks.indexOf(bookmarkerId);
    if (index === -1) {
      console.log("Not bookmarked");
      selectedBlog.bookmarks.push(bookmarkerId);
      author.bookmarked = author.bookmarked.concat(selectedBlog._id);
      await author.save()
    } else {
      // console.log("already loved")
      selectedBlog.bookmarks = selectedBlog.bookmarks.filter(
        (id) => id.toString() !== bookmarkerId.toString()
      );
      author.bookmarked = author.bookmarked.filter((id) => id.toString() !==selectedBlog._id.toString());
      await author.save()
    }

    selectedBlog.bookmarkCount = selectedBlog.bookmarks.length;
    const updatedSelectedBlog = await selectedBlog.save();
    // console.log(selectedBlog._id)
    // author.bookmarked = author.bookmarked.concat(updatedSelectedBlog._id);
    // updatedSelectedBlog.populate("bookmarks")
    res
      .status(201)
      .json({ updatedBlog: updatedSelectedBlog, message: "Successful!" });
  } catch (error) {
    console.error("Error bookmarking this blog:", error);
    res.status(500).json({ error: "Opps, there is an internal server error!" });
  }
});

blogRouter.get("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const selectedBlog = await Blog.find({ _id: id })
      .populate("author")
      .populate("comments.commenter");
    if (!selectedBlog.length) {
      return res
        .status(404)
        .json({ error: `No blog with id ${id} is found for this author!` });
    }
    res
      .status(200)
      .json({ blog: selectedBlog, message: "Blog retrieved successfully!" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

blogRouter.post(
  "/",
  userExtractor,
  uploadMiddleware.single("articleImg"),
  async (req, res) => {
    const { title, blogContent, readTime, category } = req.body;
    const author = req.user;

    // console.log("REQ.BODY:", req.body);
    // console.log("REQ.FILE:", req.file);
    // console.log("REQ.HEADERS:", req.headers["content-type"]);

    if (!author) {
      return res.status(403).json({ error: "Unauthorized request." });
    }

    if (!title || !blogContent || !readTime || !category || !req.file) {
      return res
        .status(400)
        .json({ error: "Some of the required fields are missing." });
    }
    //403 error skipped when incorrect token or no token is provided for a user. Something to be corrected in userExtractor? Seem not needed as unregistered user can't login to even attempt creating a note, right?

    try {
      const newBlog = new Blog({
        title,
        blogContent,
        readTime,
        articleImg: req.file.path,
        author,
        category,
      });
      const savedBlog = await newBlog.save();
      author.blogs = author.blogs.concat(savedBlog._id);
      await author.save();

      // save a list of all subcribers in the variable recipients below for handleSendEmail 'to' option
      const recipients = await Subscribers.find({}, 'email').then(subscribers => {
        const emailArray = subscribers.map(subscriber=> subscriber.email)
        return emailArray
      })
      // console.log(recipients)
      const baseUrl = "https://blog-frontend-pi-blush.vercel.app/blog/"
      await handleSendEmail('newArticleNotification.html', recipients, "New Blog Post Alert", {
        year: new Date().getFullYear(),
        blogUrl: baseUrl + savedBlog._id,
        blogId: savedBlog._id,
        articleImg: savedBlog.articleImg,
        title: savedBlog.title,
      })
      res
        .status(201)
        .json({ blog: savedBlog, message: "New blog created Successfully!" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Opps, there is an internal server error!" });
    }
  }
);

blogRouter.patch(
  "/:id",
  userExtractor,
  uploadMiddleware.single("articleImg"),
  async (req, res) => {
    const updates = req.body;
    const id = req.params.id;
    const options = { new: true };

    if (!updates && !req.file) {
      return res.status(400).json({
        error:
          "You cannot send an empty form as update. At least, one of the fields is required.",
      });
    }
    try {
      const blogExists = await Blog.findById(id);

      if (!blogExists) {
        return res
          .status(404)
          .json({ error: `No blog with id ${id} is found for this author!` });
      }
      if (req.file) {
        const previousImagePath = blogExists.articleImg;

        // Delete the old image file
        if (previousImagePath) {
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

        const updatedBlog = await Blog.findByIdAndUpdate(
          id,
          { ...updates, articleImg: req.file.path },
          options
        );

        const updatedInstance = await updatedBlog.save();
        res.status(200).json({
          blog: updatedInstance,
          message: "Blog has been updated successfully!",
        });
      } else if (!req.file) {
        const updatedBlog = await Blog.findByIdAndUpdate(
          id,
          { ...updates },
          { new: true }
        );
        const updatedInstance = await updatedBlog.save();
        res.status(200).json({
          blog: updatedInstance,
          message: "Blog has been updated successfully!",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

blogRouter.delete("/:id", userExtractor, async (req, res) => {
  const id = req.params.id;
  const author = req.user;

  try {
    const deletedBlog = await Blog.findOneAndDelete({ author, _id: id });

    const previousImagePath = deletedBlog.articleImg;
    // Delete the old image file

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

    author.blogs = author.blogs.filter(blog => blog.toString() !== id);
    await author.save()
    // console.log(deletedBlog)
    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog does not exist." });
    }
    res.status(204).json({ message: "Blog deleted Successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = blogRouter;
