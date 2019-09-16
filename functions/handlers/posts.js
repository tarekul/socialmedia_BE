const {db,increment} = require('../utils/admin')

exports.getAllPosts = (req,res)=>{
  db.collection('posts')
  .orderBy('createdAt','desc')
  .get()
  .then(data=>{
    let posts = [];
    data.forEach(doc=>{
      const postData = doc.data()
      postData.postId = doc.id
      posts.push(postData)

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
  const newPost = {
    body,
    userHandle:req.user.handle,
    createdAt: new Date().toISOString(),
    userImage : req.user.imageUrl,
    commentCount: 0,
    likeCount: 0
  }
  db.collection('posts').add(newPost)
  .then(doc=>{
    const resPost = newPost
    resPost.postId = doc.id
    res.json(resPost)
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
  if(body.trim() === '') return res.status(400).json({comment:'body cannot be empty'})

  const postDocument = db.doc(`/posts/${postId}`);
  postDocument.get()
    .then(doc => {
      if(!doc.exists) return res.status(404).json({ error: 'Post not found'})
      doc.ref.update({commentCount : doc.data().commentCount + 1})
      .then(() => {
        return db.collection('/comments').add({
          userHandle: req.user.handle,
          body,
          createdAt: new Date().toISOString(),
          postId,
          userImage: req.user.imageUrl
        })
      })
      .then(doc => {
        return res.status(200).json({message:`document ${doc.id} created successfully`})
      })
    })
    .catch(err=>{
      console.error(err)
      res.status(500).json({error:err.code})
    })
}

exports.likePost = (req,res) => {
  const {postId} = req.params
  const likeDocument = db.collection('likes').where('userHandle','==',req.user.handle)
    .where('postId','==',postId)
    .limit(1);

  const postDocument = db.doc(`/posts/${postId}`);
  let postData;
  postDocument.get()
    .then(doc =>{
      if(!doc.exists) return res.status(404).json({error:'post not found'})
      else {
        postData = doc.data()
        postData.postId = doc.id
        return likeDocument.get()
      }
    })
    .then(data=>{
      if(data.empty){
        const newLike = {
          userHandle: req.user.handle,
          postId
        }
        return db.collection('likes').add(newLike)
        .then(()=>{
          postData.likeCount++
          return postDocument.update({likeCount:postData.likeCount})
        })
        .then(()=>{
          return res.json(postData)
        })
      }
      else{
        return res.status(400).json({error:'post already liked'})
      }
    })
    .catch(err=>{
      console.error(err)
      if(err.code === 5) res.status(400).json({error: err.details})
      res.status(500).json({error:err.code})
    })
}

exports.unlikePost = (req,res) => {
  const {postId} = req.params
  const likeDocument = db.collection('likes').where('userHandle','==',req.user.handle)
    .where('postId','==',postId)
    .limit(1);

  const postDocument = db.doc(`/posts/${postId}`);
  let postData;
  postDocument.get()
    .then(doc =>{
      if(!doc.exists) return res.status(404).json({error:'post not found'})
      else {
        postData = doc.data()
        postData.postId = doc.id
        return likeDocument.get()
      }
    })
    .then(data=>{
      if(data.empty){
        return res.status(400).json({error:'post not liked'})
      }
      else{
        return db.doc(`/likes/${data.docs[0].id}`).delete()
          .then(()=>{
            postData.likeCount--
            return postDocument.update({likeCount:postData.likeCount})
          })
          .then(()=>{
            res.json(postData)
          })
      }
    })
    .catch(err=>{
      console.error(err)
      if(err.code === 5) res.status(400).json({error: err.details})
      res.status(500).json({error:err.code})
    })
}

exports.deletePost = (req,res) => {
  const {postId} = req.params
  const {handle} = req.user
  
  const postDocument = db.doc(`/posts/${postId}`);
  postDocument.get()
    .then(doc => {
      if(!doc.exists) return res.status(404).json({error: 'post does not exist'})
      else if(doc.data().userHandle !== handle){
        return res.status(403).json({error:'Unauthorized'})
      }
      else postDocument.delete()
    })
    .then(()=>{

      res.json({message: 'post deleted successfully'})
    })
    .catch(err=>{
      console.error(err)
      res.status(500).json({error:err.code})
    })
}