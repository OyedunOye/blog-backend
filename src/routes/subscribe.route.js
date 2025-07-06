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
        const existingEmail  = await Subscribers.findOne({email: email}).exec()
        console.log(existingEmail)
        if (existingEmail && existingEmail.isActive) {
            return res.status(200).json({
                subscriber: existingEmail,
                message: "You have already subscribed to our newsletter!"
            })
        }

        if (existingEmail && !existingEmail.isActive) {
            existingEmail.isActive = true
            await existingEmail.save()
            await handleSendEmail('subSuccessful.html', email, 'Your Newsletter Subscription Is Successfull!', {
            year: new Date().getFullYear(),
            unSubLink: `https://blog-frontend-pi-blush.vercel.app/unsubscribe?email=${email}`
        });
            return res.status(200).json({
                subscriber: existingEmail,
                message: "You have successfully subscribed to our newsletter!"
            })
        }
        const newSubscriber = await new Subscribers({email})
        const saveSubscriber = await newSubscriber.save()

        await handleSendEmail('subSuccessful.html', email, 'Your Newsletter Subscription Is Successfull!', {
            year: new Date().getFullYear(),
            unSubLink: `https://blog-frontend-pi-blush.vercel.app/unsubscribe?email=${email}`
        });
        return res.status(201).json({subscriber: saveSubscriber, message: "You have successfully subscribed to our newsletter."})

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error, please try again later." })
    }
})

subscribeRouter.patch("/unsubscribe", async(req, res)=> {
    const {email} = req.body
    // console.log(email)

    if (!email){
        return res.status(400).json({error: "Please provide the email address to unsubscribe"})
    }

    try {
        const subToDel = await Subscribers.findOne({email:email})
        if (!subToDel || !subToDel.isActive){
            return res.status(400).json({error: "This email is not subscribed to our newsletter."})
        }
        
        subToDel.isActive = false
        await subToDel.save()

        return res.status(200).json({email:email, message: "You are successfully unsubscribed from our newsletter."})
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error, please try again later." })
    }
})

module.exports = subscribeRouter