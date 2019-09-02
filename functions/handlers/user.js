const firebase = require('firebase')
const {config} = require('../utils/config')
firebase.initializeApp(config);

const {db} = require('../utils/admin')
const {validateSignUp,validateLogin} = require('../utils/validators')

exports.signUpUser = (req,res)=>{
  const {email,password,confirmPassword,handle} = req.body
  const validateResult = validateSignUp(email,password,confirmPassword,handle)
  if(!validateResult.valid) return res.status(400).json(validateResult.errors)

  let token;
  let userId;
  db.doc(`/users/${handle}`).get()
  .then(doc => {
    if(doc.exists){
      return res.status(400).json({handle: 'this handle is already taken'})
    } else {
      return firebase.auth().createUserWithEmailAndPassword(email,password)
    }
  })
  .then(data=>{
    userId = data.user.uid
    return data.user.getIdToken()
  })
  .then(idToken=>{
    token = idToken;
    const userCredentials = {
      handle,
      email,
      createdAt: new Date().toISOString(),
      userId
    };
    return db.doc(`/users/${handle}`).set(userCredentials);
  })
  .then(()=>{
    return res.status(201).json({token})
  })
  .catch(err=>{
    console.error(err)
    if(err.code === "auth/email-already-in-use") return res.status(400).json({error: 'Email already in use'})
    return res.status(500).json({error: err.code});
  })
}

exports.login = (req,res) => {
  const {email, password} = req.body
  validateResult = validateLogin(email,password)
  if(!validateResult.valid) return res.status(400).json(validateResult.errors)

  firebase.auth().signInWithEmailAndPassword(email,password)
  .then(data => {
    return data.user.getIdToken()
  })
  .then(token=>{
    return res.status(200).json({token})
  })
  .catch(err=>{
    return res.status(500).json({error:err.code})
  })

}