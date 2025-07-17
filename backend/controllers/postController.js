const Post = require('../models/Post');
const User = require('../models/User');

exports.createPost = async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "Post content is required" });
  }

  try {
    const newPost = new Post({
      content,
      author: req.user.userId
    });

    await newPost.save();

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'fullName username');

    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePost = async (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if logged-in user is the author
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    post.content = content || post.content;
    post.edited = true;

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePost = async (req, res) => {
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId); 
    } else {
      post.likes.splice(index, 1); 
    }

    await post.save();
    res.status(200).json({ message: 'Like updated', likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addComment = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  try {
    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({
      content,
      author: req.user.userId,
      createdAt: new Date()
    });

    await post.save();
    res.status(200).json({ message: 'Comment added' });
  } catch (err) {
    console.error("Internal Server Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addReply = async (req, res) => {
  const { postId, commentId } = req.params;
  const { content } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.replies.push({
      content,
      author: req.user.userId,
      createdAt: new Date()
    });

    await post.save();
    res.status(200).json({ message: 'Reply added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
