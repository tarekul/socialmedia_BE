const functions = require('firebase-functions');
const express = require('express');
const app = express();

const {getAllPosts,postOnePost} = require('./handlers/posts')
const {signUpUser,login} = require('./handlers/user')
const {middleWare} = require('./utils/middleware')
// const {admin,db} = require('./utils/admin')

//get all posts
app.get('/post',getAllPosts)

//share a post 
app.post('/post',middleWare,postOnePost)


//sign up route
app.post('/signup',signUpUser)
app.post('/login',login)


exports.api = functions.https.onRequest(app);