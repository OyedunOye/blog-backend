const mongoose = require ('mongoose');


const { Schema, model } = mongoose;

const subscribersSchema = Schema({
    email: {type: String, required: true, unique: true},
    isActive: {type: Boolean, required: false, default: true}
},
{timestamps: true}
)

const Subscribers = model("Subscribers", subscribersSchema)

module.exports = Subscribers