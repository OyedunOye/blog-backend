const mongoose = require ('mongoose');
// const root = 'https://s3.amazonaws.com/mybucket';


const { Schema, model } = mongoose;
const readerSchema = Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    passwordHash: {type: String, required: true},
    // profilePic: {type: String, required: false, get: v=> `${root}${v}`}
},
{timestamps: true}
)

const Reader = model("Reader", readerSchema)

module.exports = Reader