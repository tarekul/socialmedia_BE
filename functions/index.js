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

const FBAuth = (req,res,next) =>{
  let idToken;
  const {authorization} = req.headers

  if(authorization && authorization.startsWith('Bearer ')){
    idToken = authorization.split('Bearer ')[1];
  } else {
    console.error('No token found')
    return res.status(403).json({error: 'unauthorized'})
  }

  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      console.log(decodedToken);
      return db.collection('users')
        .where('userId', '==',req.user.uid)
        .limit(1)
        .get()
    })
    .then(data => {
      req.user.handle = data.docs[0].data().handle;
      next();
    })
    .catch(err=>{
      console.error('Error while verifying token',err);
      return res.status(403).json(err);
    })
}

app.post('/post',FBAuth,(req,res)=>{
  const newPost = {
    body:req.body.body,
    userHandle:req.user.handle,
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
  if(email.match(reqEx)) return true
  else return false
}

const isEmpty = string =>{
  if(string.trim() === '') return true;
  else return false;
}
//Sign up route
app.post('/signup',(req,res)=>{
  const {email,password,confirmPassword,handle} = req.body
  // const newUser = {
  //   email:req.body.email,
  //   password:req.body.password,
  //   confirmPassword:req.body.confirmPassword,
  //   handle:req.body.handle
  // }

  let errors = {};
  if(isEmpty(email)) errors.email = 'Email must not be empty'
  else if(!isEmail(email)) errors.email = 'Must be a valid email address'
  
  if(isEmpty(password)) errors.password = 'Must not be empty'
  if(password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match'
  if(isEmpty(handle)) errors.handle = 'Must not be empty'

  if((Object.keys(errors)).length > 0) return res.status(400).json(errors)
  //TODO validate data
  let token,userId;
  db.doc(`users/${handle}`).get()
    .then(doc =>{
      if(doc.exists){
        //bad request
        return res.status(400).json({handle: 'this handle is already taken'})
      } else{
        return firebase.auth().createUserWithEmailAndPassword(email,password)
      }
    })
    .then(data =>{
      userId = data.user.uid
      return data.user.getIdToken()
    })
    .then(idToken =>{
      token = idToken;
      const userCredentials = {
        handle:handle,
        email:email,
        createdAt: new Date().toISOString(),
        userId: userId
        
      }
      return db.doc(`/users/${handle}`).set(userCredentials);
    })
    .then(()=>{
      //new resource created
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

app.post('/login',(req,res)=>{
  const user = {
    email: req.body.email,
    password: req.body.password
  }

  let errors = {}
  if(isEmpty(user.email)) errors.email = 'Must not be empty';
  if(isEmpty(user.password)) errors.password = 'Must not be empty';

  if(Object.keys(errors).length > 0) return res.status(400).json(errors)

  firebase.auth().signInWithEmailAndPassword(user.email,user.password)
    .then(data =>{
      return data.user.getIdToken();
    })
    .then(token =>{
      return res.json(token)
    })
    .catch(err=>{
      console.error(err)
      if(err.code === 'auth/wrong-password'){
        //403 is unauthorized error
        return res.status(403).json({general: 'Wrong credentials, please try again'});
      }
      else return res.status(500).json({error:err.code});
    })
})

exports.api = functions.https.onRequest(app);