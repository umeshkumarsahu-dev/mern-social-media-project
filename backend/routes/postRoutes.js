const express = require('express');
const { createPost, getPosts, updatePost, deletePost, likePost, addComment, addReply } = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, createPost);
router.get('/', authMiddleware, getPosts);
router.put('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);

router.patch('/like/:postId', authMiddleware, likePost);
router.post('/:postId/comments', authMiddleware, addComment);
router.post('/:postId/comments/:commentId/replies', authMiddleware, addReply);

module.exports = router;
