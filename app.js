const express = require('express')
const app = express()
// const bodyParser = require('body-parser') no need for body parser as there is similar functions in built-in Express middleware.
const morgan = require('morgan')
const userRouter = require('./src/routes/users.route')
const loginRouter = require('./src/routes/login.route')
const blogRouter = require('./src/routes/blog.route')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(__dirname+'/uploads'))
app.use(morgan("dev"))

app.use("/api/users", userRouter)
app.use("/api/login",  loginRouter)
app.use("api/blogs", blogRouter)

app.get('/', (req, res) => {
    res.send("Hello World! Welcome to blog's backend 🙂")
  })

module.exports = app