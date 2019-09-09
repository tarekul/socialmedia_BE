const functions = require('firebase-functions');
const express = require('express');
const app = express();

const {getAllPosts,postOnePost,getPost,commentOnPost,likePost,unlikePost} = require('./handlers/posts')
const {signUpUser,login,uploadImage,addUserDetails,getAuthenticatedUser} = require('./handlers/user')
const {middleWare} = require('./utils/middleware')
// const {admin,db} = require('./utils/admin')

//post routes
app.get('/posts',getAllPosts)
app.post('/post',middleWare,postOnePost)
app.get('/post/:postId',getPost)
// TODO: delete post
app.get('/post/:postId/like',middleWare,likePost)
app.get('/post/:postId/unlike',middleWare,unlikePost)
app.post('/post/:postId/comment',middleWare,commentOnPost)

//users route
app.post('/signup',signUpUser)
app.post('/login',login)
app.post('/user/image',middleWare,uploadImage)
app.post('/user',middleWare,addUserDetails)
app.get('/user',middleWare,getAuthenticatedUser)

exports.api = functions.https.onRequest(app);