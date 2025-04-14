const mongoose = require('mongoose')
// const root = 'https://s3.amazonaws.com/mybucket';


const {Schema, model} = mongoose

const blogSchema = Schema({
    title: {type: String, required: true},
    blogContent: {type: String, required: true},
    readTime:{type: Number, required: false, default: 0},
    loveCount: {type: Number, required: false, default: 0},
    commentCount: {type: Number, required: false, default: 0},
    // articleImg: {type: String, required: true, get: v=> `${root}${v}`},
    author: {type:Schema.Types.ObjectId, ref: "User"}
},
{timestamps: true}
)

const Blog = model("Blog", blogSchema)

module.exports = Blog