const {admin,db} = require('./admin')

module.exports = (req,res,next) =>{
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