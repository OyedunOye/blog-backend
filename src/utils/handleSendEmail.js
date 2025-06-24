const Handlebars = require('handlebars');
const { readFileSync } = require('fs');
const path = require('path');
const config = require('./config')
const nodemailer = require('nodemailer')

const main = async(template, recipient, subject, data) => {
    const html = await readHtmlTemplate(template,data)

    if (html === ""){
        console.log('UNABLE TO READ TEMPLATE FILE')
        return
    }
    sendEmailMessage(recipient, subject, html)
}

module.exports = main

const readHtmlTemplate = async(templatename, data)=>{
    try {
        const templatePath = path.join(__dirname, '..', '..', 'email_templates', `${templatename}`)
        console.log(templatePath)
        const htmlSource = readFileSync(templatePath, 'utf-8')
        const template= Handlebars.compile(htmlSource)
        const html = template(data)
        return html
    }catch(error){
        console.log('ERROR READING TEMPLATE: ', error)
        return ''
    }
}

const sendEmailMessage = async (recipient, subject, html)=>{
    // define transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        secure: false,
        auth: {user: config.GOOGLE_USER, pass: config.GOOGLE_APP_PASSWORD}
    })

    // define mail options
    const mailOptions={
        from: config.GOOGLE_SENDER_MAIL,
        to: recipient,
        subject: subject,
        html: html,
    }

    // send mail with the transporter
    transporter.sendMail(mailOptions, (error, info)=> {
        if(error){
            console.log('Error sending mail: ', error)
        }else{
            console.log('Email sent: ', info.response)
        }
    })
}