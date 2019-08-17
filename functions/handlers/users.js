const config = require('../util/config')
const firebase = require('firebase')
firebase.initializeApp(config)
const {db} = require('../util/admin')
const {validateSignupData, validateLoginData} = require('../util/validators')

exports.signup = (req,res)=>{
  const {email,password,confirmPassword,handle} = req.body

  const {valid,errors} = validateSignupData({email,password,confirmPassword,handle})
  if(!valid) return res.status(400).json(errors)

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
}

exports.login = (req,res)=>{
  const {email,password} = req.body

  const {valid, errors} = validateLoginData({email,password})
  if(!valid) res.status(400).json(errors)

  firebase.auth().signInWithEmailAndPassword(email,password)
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
}