const express = require('express');
const { createPost, getPosts, updatePost, deletePost, likePost, addComment, addReply, getPostMedia } = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/', authMiddleware, upload.single('media'), createPost);
router.get('/', authMiddleware, getPosts);
router.put('/:id', authMiddleware, upload.single('media'), updatePost);
router.delete('/:id', authMiddleware, deletePost);
router.patch('/like/:postId', authMiddleware, likePost);
router.post('/:postId/comments', authMiddleware, addComment);
router.post('/:postId/comments/:commentId/replies', authMiddleware, addReply);
router.get('/media/:postId', getPostMedia);

module.exports = router;
