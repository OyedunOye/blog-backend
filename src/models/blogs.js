const mongoose = require('mongoose')

const {Schema, model} = mongoose

const blogSchema = Schema({
    title: {type: String, required: true},
    blogContent: {type: String, required: true},
    readTime:{type: Number, required: true},
    loveCount: {type: Number, required: false, default: 0},
    commentCount: {type: Number, required: false, default: 0},
    articleImg: {type: String, required: true},
    author: {type:Schema.Types.ObjectId, ref: "User"},
    category: {type: String, required: true},
    comments: [{
        comment: {type: String},
        commenter: {type: Schema.Types.ObjectId, ref: "User"},
        commentedAt: {type: Date, default: Date.now}
}]
},
{timestamps: true}
)

const Blog = model("Blog", blogSchema)

module.exports = Blog