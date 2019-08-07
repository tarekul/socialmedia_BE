const functions = require('firebase-functions');
const admin = require('firebase-admin')

admin.initializeApp() 

const app = require('express')()

const config = {
  apiKey: "AIzaSyAnetcw4F_7FRenXGJFPSMtBCp8-F8U9o8",
  authDomain: "socialapp-caeff.firebaseapp.com",
  databaseURL: "https://socialapp-caeff.firebaseio.com",
  projectId: "socialapp-caeff",
  storageBucket: "socialapp-caeff.appspot.com",
  messagingSenderId: "849464252435",
  appId: "1:849464252435:web:69f6f0c86e08f434"
};

const firebase = require('firebase')
firebase.initializeApp(config)

const db = admin.firestore()

app.get('/posts',(req,res)=>{
  db.collection('posts')
    .orderBy('createdAt','desc')
    .get()
    .then(data=>{
      let posts = []
      data.forEach(doc=>{
        posts.push({
          postId:doc.id,
          body:doc.data().body,
          userHandle:doc.data().userHandle,
          createdAt:doc.data().createdAt
        })
      })
      return res.json(posts);
    })
    .catch(err=> console.log(err));
})

app.post('/post',(req,res)=>{
  const newPost = {
    body:req.body.body,
    userHandle:req.body.userHandle,
    createdAt: new Date().toISOString()
  }

  db.collection('posts').add(newPost)
    .then(doc=>{
        res.json({message:`document ${doc.id} created`})
    })
    .catch(err=>{
      res.status(500).json({error:'something went wrong'})
      console.error(err)
    })
})



//Sign up route

app.post('/signup',(req,res)=>{
  const newUser = {
    email:req.body.email,
    password:req.body.password,
    confirmPassword:req.body.confirmPassword,
    handle:req.body.handle
  }

  //TODO validate data
  firebase.auth().createUserWithEmailAndPassword(req.body.email,req.body.password)
    .then(data=>{
      //status 201 is resource created
      return res.status(201).json({message:`user ${data.user.uid} signed up successfully`})
    })
    .catch(err=>{
      console.error(err);
      return res.status(500).json({err:err.code}) //server error
    })
})
exports.api = functions.https.onRequest(app);