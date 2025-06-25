const subscribeRouter = require("express").Router();
const Subscribers = require("../models/subscribers")
const handleSendEmail = require('../utils/handleSendEmail');

subscribeRouter.post("/", async(req, res)=>{
    // console.log(req.body)
    const {email} = req.body
    if (!email) {
        return res.status(400).json({
            error: "A valid email address is required to subscribe to our newsletter."
        })
    }

    try {
        const existingEmail  = await Subscribers.find({email: email}).exec()
        if (existingEmail.length >= 1) {
            return res.status(200).json({
                subscriber: existingEmail,
                message: "You have already subscribed to our newsletter!"
            })
        }
        const newSubscriber = await new Subscribers({email})
        const saveSubscriber = await newSubscriber.save()

        await handleSendEmail('subSuccessful.html', email, 'Your Newsletter Subscription Is Successfull!', {
            year: new Date().getFullYear(),
        });
        return res.status(201).json({subscriber: saveSubscriber, message: "You have successfully subscribed to our newsletter."})

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error, please try again later." })
    }
})

module.exports = subscribeRouter