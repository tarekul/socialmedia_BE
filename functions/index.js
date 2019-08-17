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

const isEmail = email => {
  const reqEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  email.match(reqEx) ? true : false ;
}

const isEmpty = string =>{
  if(string.trim() === '') return true;
  else return false;
}
//Sign up route
app.post('/signup',(req,res)=>{
  const newUser = {
    email:req.body.email,
    password:req.body.password,
    confirmPassword:req.body.confirmPassword,
    handle:req.body.handle
  }

  let errors = {};
  if(isEmpty(newUser.email)) errors.email = 'Email must not be empty'
  else if(isEmail(newUser.email)) errors.email = 'Must be a valid email address'
  
  if(isEmpty(newUser.password)) errors.password = 'Must not be empty'
  if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match'
  if(isEmpty(newUser.handle)) errors.handle = 'Must not be empty'

  if((Object.keys(errors)).length > 0) return res.status(400).json(errors)
  //TODO validate data
  let token,userId;
  db.doc(`users/${newUser.handle}`).get()
    .then(doc =>{
      if(doc.exists){
        //bad request
        return res.status(400).json({handle: 'this handle is already taken'})
      } else{
        return firebase.auth().createUserWithEmailAndPassword(newUser.email,newUser.password)
      }
    })
    .then(data =>{
      userId = data.user.uid
      return data.user.getIdToken()
    })
    .then(idToken =>{
      token = idToken;
      const userCredentials = {
        handle:newUser.handle,
        email:newUser.email,
        createdAt: new Date().toISOString(),
        userId: userId
        
      }
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(()=>{
      return res.status(201).json({token});
    })
    .catch(err=>{
      console.error(err);
      if(err.code === 'auth/email-already-in-use'){
        return res.status(400).json({email:'Email is already in use'})
      }
      else return res.status(500).json({error:err.code})
      
    })
  
})

exports.api = functions.https.onRequest(app);