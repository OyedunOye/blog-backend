const mongoose = require ('mongoose');
// const root = 'https://s3.amazonaws.com/mybucket';


const { Schema, model } = mongoose;
const userSchema = Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    passwordHash: {type: String, required: true},
    blogs: [{type:Schema.Types.ObjectId, ref: "Blog"}],
    loved: [{type:Schema.Types.ObjectId, ref: "Blog"}],
    bookmarked: [{type:Schema.Types.ObjectId, ref: "Blog"}],
    isTwoFAuthActive: {type: Boolean, required: false, default: false},
    authorImg: {type: String, required: false}
},
{timestamps: true}
)

const User = model("User", userSchema)

module.exports = User