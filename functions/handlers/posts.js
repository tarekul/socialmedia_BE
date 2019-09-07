const {db,increment} = require('../utils/admin')

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
  if(body.trim() === '') return res.status(400).json({error:'body cannot be empty'})
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

//fetch post and the comments
exports.getPost = (req,res)=>{
  let postData = {};
  db.doc(`posts/${req.params.postId}`).get()
    .then(doc =>{
      if(!doc.exists){
        return res.status(404)  //resource not found
        .json({error:'Post not found'})
      }
      postData = doc.data()
      postData.postId = doc.id;
      return db.collection('comments')
        .where('postId','==',req.params.postId)
        .orderBy('createdAt','desc')
        .get()
    })
    .then(data=>{
      postData.comments = []
      data.forEach(doc=>{
        postData.comments.push(doc.data())
      })
      return res.json(postData)
    })
    .catch(err=>{
      console.error(err)
      res.status(500).json({error:err.code})
    })
}

//comment on a post
exports.commentOnPost = (req,res) =>{
  let commentId;
  const {postId} = req.params
  const {body} = req.body
  if(body.trim() === '') return res.status(400).json({error:'body cannot be empty'})

  db.doc(`/posts/${postId}`).get()
    .then(doc => {
      if(!doc.exists) return res.status(404).json({ error: 'Post not found'})
      return db.collection('/comments').add({
        userhandle: req.user.handle,
        body,
        createdAt: new Date().toISOString(),
        postId,
        userImage: req.user.imageUrl
      })
    })
    .then(doc => {
      commentId = doc.id
      return db.doc(`posts/${postId}`).update({commentCount: increment})
    })
    .then(()=> {
      return res.status(200).json({message:`document ${commentId} created successfully`})
    })
    .catch(err=>{
      console.error(err)
      res.status(500).json({error:err.code})
    })
}

