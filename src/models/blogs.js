const mongoose = require('mongoose')

const {Schema, model} = mongoose

const blogSchema = Schema({
    title: {type: String, required: true},
    blogContent: {type: String, required: true},
    readTime:{type: Number, required: true},
    loveCount: {type: Number, required: false, default: 0},
    bookmarkCount: {type: Number, required: false, default: 0},
    commentCount: {type: Number, required: false, default: 0},
    articleImg: {type: String, required: true},
    author: {type:Schema.Types.ObjectId, ref: "User"},
    category: {type: String, required: true},
    comments: [{
        comment: {type: String},
        commenter: {type: Schema.Types.ObjectId, ref: "User"},
        commentedAt: {type: Date, default: Date.now}
    }],
    // loves: [{
    //     lover: {type: Schema.Types.ObjectId, ref: "User"},
    //     lovedAt: {type: Date, default: Date.now}
    // }],
    loves: [{type:Schema.Types.ObjectId, ref: "User"}],
    bookmarks: [{type:Schema.Types.ObjectId, ref: "User"}],
    displayBlog: {type: Boolean, required: false, default: true},

},
{timestamps: true}
)

const Blog = model("Blog", blogSchema)

module.exports = Blog