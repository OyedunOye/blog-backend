const mongoose = require ('mongoose');
// const root = 'https://s3.amazonaws.com/mybucket';


const { Schema, model } = mongoose;
const userSchema = Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    passwordHash: {type: String, required: true},
    blogs: [{type:Schema.Types.ObjectId, ref: "Blog"}]
    // profilePic: {type: String, required: false, get: v=> `${root}${v}`}
},
{timestamps: true}
)

const User = model("User", userSchema)

module.exports = User