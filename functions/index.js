const functions = require('firebase-functions');
const express = require('express');
const app = express();

const {getAllPosts,postOnePost,getPost,
  commentOnPost,likePost,unlikePost,deletePost} = require('./handlers/posts')
const {signUpUser,login,uploadImage,addUserDetails,
  getAuthenticatedUser,getUserDetails,markNotificationsRead} = require('./handlers/user')
const {middleWare} = require('./utils/middleware')
const {db} = require('./utils/admin')

//post routes
app.get('/posts',getAllPosts)
app.post('/post',middleWare,postOnePost)
app.get('/post/:postId',getPost)
app.delete('/post/:postId',middleWare,deletePost)
app.get('/post/:postId/like',middleWare,likePost)
app.get('/post/:postId/unlike',middleWare,unlikePost)
app.post('/post/:postId/comment',middleWare,commentOnPost)

//users route
app.post('/signup',signUpUser)
app.post('/login',login)
app.post('/user/image',middleWare,uploadImage)
app.post('/user',middleWare,addUserDetails)
app.get('/user',middleWare,getAuthenticatedUser)
app.get('/user/:handle',getUserDetails)
app.post('/notifications',middleWare,markNotificationsRead)


exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/posts/${snapshot.data().postId}`)
      .get()
      .then((doc) => {
        if(doc.exists && snapshot.data().userHandle !== doc.data().userHandle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            postId: doc.id
          });
        }
      })
      .catch((err) => console.error(err));
  });

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}')
  .onDelete(snapshot => {
    db.doc(`/notifications/${snapshot.id}`).delete()
      .then(()=>{
        return;
      })
      .catch(err=>{
        console.error(err)
        return;
      })
  })

exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
  .onCreate(snapshot =>{
    db.doc(`/posts/${snapshot.data().postId}`).get()
    .then(doc=>{
      if(doc.exists && snapshot.data().userHandle !== doc.data().userHandle){
        return db.doc(`/notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          recipient:doc.data().userHandle,
          sender: snapshot.data().userHandle,
          type: 'comment',
          read:false,
          postId: doc.id
        })
      }
    })
    .catch(err=> console.error(err))
  })