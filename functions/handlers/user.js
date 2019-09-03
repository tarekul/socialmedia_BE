const firebase = require('firebase')
const {config} = require('../utils/config')
firebase.initializeApp(config);

const {admin,db} = require('../utils/admin')
const {validateSignUp,validateLogin, reduceUserDetails} = require('../utils/validators')

exports.signUpUser = (req,res)=>{
  const {email,password,confirmPassword,handle} = req.body
  const validateResult = validateSignUp(email,password,confirmPassword,handle)
  if(!validateResult.valid) return res.status(400).json(validateResult.errors)

  const noImage = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/no-image.png?alt=media&token=f568604c-a5dc-4484-854e-caac8a78ad5f`

  let token,userId;
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
      imageUrl: noImage,
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

//add user details
exports.addUserDetails = (req,res) =>{
  let userDetails = reduceUserDetails(req.body);
  db.doc(`/users/${req.user.handle}`).update(userDetails)
    .then(()=>{
      return res.json({message: 'Details added successfully'});
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({error: err.code})
    })
}

//get own user details
exports.getAuthenticatedUser = (req,res) => {
  let userData = {};
  db.doc(`/users/${req.user.handle}`).get()
  .then(doc => {
    if(doc.exists){
      userData.credentials = doc.data();
      return db.collection('likes').where('userHandle','==', req.user.handle).get()
    }
  })
  .then(data => {
    userData.likes = [];
    data.forEach(doc => {
      userData.likes.push(doc.data());
    });
    return res.json(userData)
  })
  .catch(err=>{
    console.error(err);
    return res.status(500).json({error: err.code})
  })
}



// Upload a profile image for user
exports.uploadImage = (req, res) => {
  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = {};
  let imageFileName;

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    console.log(filename,mimetype);
    if(mimetype !== 'image/jpg' && mimetype !== 'image/png'){
      return res.status(400).json({error: 'Wrong file type submitted'})
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split('.')[filename.split('.').length - 1];
    // 32756238461724837.png
    imageFileName = `${Math.round(Math.random() * 1000000000000).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on('finish', () => {
    admin.storage().bucket().upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype
          }
        }
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: 'image uploaded successfully' });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: 'something went wrong' });
      });
  });
  busboy.end(req.rawBody);
};

