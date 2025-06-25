const mongoose = require ('mongoose');


const { Schema, model } = mongoose;

const subscribersSchema = Schema({
    email: {type: String, required: true, unique: true},
},
{timestamps: true}
)

const Subscribers = model("Subscribers", subscribersSchema)

module.exports = Subscribers