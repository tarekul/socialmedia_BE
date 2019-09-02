const {db} = require('../utils/admin')

exports.getAllPosts = (req,res)=>{
  db.collection('posts')
  .orderBy('createdAt','desc')
  .get()
  .then(data=>{
    let posts = [];
    data.forEach(doc=>{
      posts.push(doc.data())
    });

    res.json(posts)
  })
  .catch(err=>{
    console.error(err);
    //server error
    res.status(500).json({message:err.code})
  })
}

exports.postOnePost = (req,res)=>{
  const {body} = req.body
  db.collection('posts').add({
    body,
    userhandle:req.user.handle,
    createdAt: new Date().toISOString(),
    commentCount: 0,
    likeCount: 0
  })
  .then(doc=>{
    res.json({message:`document ${doc.id} created successfully`})
  })
  .catch(err=>{
    console.error(err);
    res.status(500).json({message:err.code})
  })
}