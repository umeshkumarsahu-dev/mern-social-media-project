import React, { useEffect, useState, useRef, useCallback } from 'react';
import API from '../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

// Constants
const LOCAL_MEDIA_URL = 'http://localhost:5000/api/posts/media/';
const REMOTE_MEDIA_URL = 'https://mern-backend-s6eq.onrender.com/api/posts/media/';

const CHARACTER_LIMIT = 200;

const Home = () => {
  // State declarations
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [showCommentBox, setShowCommentBox] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [mediaFile, setMediaFile] = useState(null);
  const [editedMediaFile, setEditedMediaFile] = useState(null);
  const [editedPreview, setEditedPreview] = useState(null);
  const [likeLoadingPostId, setLikeLoadingPostId] = useState(null);

  // Refs
  const fileInputRef = useRef();
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  // Get userId from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.userId);
      } catch {
        setUserId('');
      }
    }
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async (pageNum = 1) => {
    try {
      const res = await API.get(`/posts?page=${pageNum}`);
      setPosts(res.data.posts);
      setPage(pageNum);
      pageRef.current = pageNum + 1;
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (!loading && hasMore && scrollTop + windowHeight >= fullHeight - 100) {
        loadMorePosts();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  // Post submit handler
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !mediaFile) return;

    const formData = new FormData();
    formData.append("content", newPost);
    if (mediaFile) {
      formData.append("media", mediaFile);
    }

    try {
      await API.post('/posts', formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success("Post created successfully!");
      setNewPost('');
      setMediaFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      fetchPosts();
    } catch (err) {
      toast.error("Failed to post");
      console.error(err);
    }
  };

  // Delete post handler
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to delete this post?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await API.delete(`/posts/${id}`);
        toast.success("Post deleted successfully!");
        fetchPosts();
      } catch (err) {
        console.error("Delete error:", err);
        toast.error("Failed to delete post.");
      }
    }
  };

  // Edit post handler
  const handleEdit = (post) => {
    setEditingPostId(post._id);
    setEditedContent(post.content);
    setEditedPreview(post.media ?
      `${REMOTE_MEDIA_URL}${post._id}?t=${post.updatedAt || Date.now()}`
      : null
    );
  };

  // Media change handler for edit
  const handleEditedMediaChange = (e) => {
    const file = e.target.files[0];
    setEditedMediaFile(file);
    setEditedPreview(file ? URL.createObjectURL(file) : null);
  };

  // Update post handler
  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append("content", editedContent);
      if (editedMediaFile) {
        formData.append("media", editedMediaFile);
      }

      await API.put(`/posts/${editingPostId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Post updated!");
      setEditingPostId(null);
      setEditedContent("");
      setEditedMediaFile(null);
      setEditedPreview(null);
      fetchPosts();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  // Like handler
  const handleLike = async (postId) => {
    if (likeLoadingPostId === postId) return;

    setLikeLoadingPostId(postId);
    try {
      await API.patch(`/posts/like/${postId}`);
      fetchPosts();
    } catch (error) {
      console.error("Like failed", error);
    } finally {
      setLikeLoadingPostId(null);
    }
  };

  // Add comment handler
  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const content = commentInputs[postId];
    if (!content) return;

    try {
      await API.post(`/posts/${postId}/comments`, { content });
      setCommentInputs({ ...commentInputs, [postId]: '' });
      fetchPosts();
    } catch (error) {
      console.error("Comment failed", error);
    }
  };

  // Reply handler
  const handleReply = async (e, postId, commentId) => {
    e.preventDefault();
    const key = `reply-${postId}-${commentId}`;
    const content = commentInputs[key];
    if (!content) return;

    try {
      await API.post(`/posts/${postId}/comments/${commentId}/replies`, { content });
      setCommentInputs({ ...commentInputs, [key]: '' });
      fetchPosts();
    } catch (error) {
      console.error("Reply failed", error);
    }
  };

  // Truncate helpers
  const isTruncated = (content) => content.length > CHARACTER_LIMIT;

  const getDisplayContent = (content, postId) => {
    if (expandedPosts[postId] || !isTruncated(content)) {
      return content;
    }
    return content.slice(0, CHARACTER_LIMIT) + '...';
  };

  const toggleExpanded = (postId) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Load more posts for infinite scroll
  const loadMorePosts = useCallback(async () => {
    if (loadingRef.current || loading) return;

    setLoading(true);
    loadingRef.current = true;
    try {
      const res = await API.get(`/posts?page=${pageRef.current}&limit=10`);
      const newPosts = res.data.posts;

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prevPosts) => {
          const existingIds = new Set(prevPosts.map((p) => p._id));
          const filteredPosts = newPosts.filter((p) => !existingIds.has(p._id));
          return [...prevPosts, ...filteredPosts];
        });
        setPage(pageRef.current);
        pageRef.current += 1;
      }
    } catch (error) {
      console.error("Error loading more posts", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [loading]);

  // Render
  return (
    <div className="container mt-5">
      {/* Share Post Card */}
      <div className="card shadow-sm mb-5">
        <div className="card-body">
          <h4 className="text-center text-primary mb-4">📝 Share a Post</h4>
          <form onSubmit={handlePostSubmit} encType="multipart/form-data">
            <div className="form-floating mb-3">
              <textarea
                className="form-control"
                placeholder="What's on your mind?"
                style={{ height: '100px' }}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                required
                aria-label="Post content"
              ></textarea>
              <label htmlFor="postContent">What's on your mind?</label>
            </div>
            <input
              type="file"
              className="form-control mb-3"
              ref={fileInputRef}
              onChange={(e) => setMediaFile(e.target.files[0])}
              aria-label="Upload media"
            />
            <div className="text-end">
              <button type="submit" className="btn btn-primary px-4">Post</button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent Posts */}
      <h3 className="text-center mb-4">📢 Recent Posts</h3>
      {posts.length === 0 ? (
        <p className="text-muted text-center">No posts yet.</p>
      ) : (
        posts.map((post) => (
          <div key={post._id || `${post.createdAt}-${Math.random()}`}
            className="card mb-4 shadow-sm">
            <div className="card-body">
              {/* Edit Mode */}
              {editingPostId === post._id ? (
                <>
                  <textarea
                    className="form-control mb-2"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  {editedPreview && (
                    <div className="mb-3 text-center">
                      <img
                        src={editedPreview}
                        alt="Preview"
                        className="img-fluid rounded"
                        style={{ maxHeight: "300px", objectFit: "cover" }}
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    className="form-control mb-3"
                    accept="image/*,video/*"
                    onChange={handleEditedMediaChange}
                  />

                  <div className="text-end">
                    <button className="btn btn-success me-2" onClick={handleUpdate}>Update</button>
                    <button className="btn btn-secondary" onClick={() => setEditingPostId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  {/* Post Header */}
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${post.author?.fullName || "User"}&background=random`}
                      alt={`${post.author?.fullName || "User"} avatar`}
                      className="rounded-circle me-3"
                      width="50"
                      height="50"
                    />
                    <div className="flex-grow-1">
                      <strong>{post.author?.fullName || "User"} ({post.author?.username || "unknown"})</strong>
                      <div className="text-muted small">
                        {new Date(post.createdAt).toLocaleString()}
                        {post.edited && <span className="ms-2 text-warning">(edited)</span>}
                      </div>
                    </div>
                    {post.author?._id === userId && (
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-outline-secondary dropdown-toggle"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          ⋯
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li><button className="dropdown-item" onClick={() => handleEdit(post)}>✏️ Edit</button></li>
                          <li><button className="dropdown-item text-danger" onClick={() => handleDelete(post._id)}>🗑️ Delete</button></li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Post Content */}
                  <pre className="mb-2 card-text" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                    {getDisplayContent(post.content, post._id)}
                    {isTruncated(post.content) && (
                      <span
                        onClick={() => toggleExpanded(post._id)}
                        style={{ color: 'blue', cursor: 'pointer', fontWeight: 'bold' }}
                        role="button"
                        tabIndex={0}
                        aria-label={expandedPosts[post._id] ? 'Show less' : 'Read more'}
                      >
                        {expandedPosts[post._id] ? ' Show less' : ' Read more'}
                      </span>
                    )}
                  </pre>

                  {/* Media */}
                  {post.media?.contentType && (
                    <div className="text-center my-3">
                      {post.media.contentType.startsWith("image") ? (
                        <img
                          src={`${REMOTE_MEDIA_URL}${post._id}?t=${post.updatedAt || Date.now()}`}
                          alt="Post media"
                          className="img-fluid rounded"
                          style={{ maxHeight: "300px", objectFit: "cover" }}
                        />
                      ) : post.media.contentType.startsWith("video") ? (
                        <video controls className="w-100 rounded" style={{ maxHeight: "300px" }}>
                          <source
                            src={`${REMOTE_MEDIA_URL}${post._id}`}
                            type={post.media.contentType}
                          />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <p className="text-muted">Unsupported media type</p>
                      )}
                    </div>
                  )}

                  {/* Like/Comment Summary */}
                  <div className="d-flex justify-content-between text-muted small mb-2">
                    <span>❤️ {post.likes.length} Likes</span>
                    <span>💬 {post.comments.length} Comments</span>
                  </div>

                  {/* Like & Comment Buttons */}
                  <div className="d-flex justify-content-around mb-3">
                    <button
                      className={`btn btn-sm ${post.likes.includes(userId) ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => handleLike(post._id)}
                      disabled={likeLoadingPostId === post._id}
                    >
                      ❤️ {likeLoadingPostId === post._id ? "Liking..." : "Like"}
                    </button>

                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() =>
                        setShowCommentBox({ ...showCommentBox, [post._id]: !showCommentBox[post._id] })
                      }
                    >
                      💬 Comment
                    </button>
                  </div>

                  {/* Comment Box */}
                  {showCommentBox[post._id] && (
                    <>
                      {/* New Comment */}
                      <form onSubmit={(e) => handleAddComment(e, post._id)} className="d-flex mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm me-2"
                          placeholder="Add a comment..."
                          value={commentInputs[post._id] || ''}
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [post._id]: e.target.value })
                          }
                          aria-label="Add comment"
                        />
                        <button type="submit" className="btn btn-sm btn-primary">Post</button>
                      </form>

                      {/* Comments & Replies */}
                      {(expandedPosts[post._id] ? post.comments : post.comments.slice(0, 2)).map((c, i) => (
                        <div key={c._id || i} className="ps-3 border-start mt-2">
                          <small className="text-muted d-block">💬 {c.content}</small>
                          {c.replies?.map((r, j) => (
                            <div key={r._id || j} className="ps-3 border-start mt-1">
                              <small className="text-muted">↳ {r.content}</small>
                            </div>
                          ))}
                          <form onSubmit={(e) => handleReply(e, post._id, c._id)} className="d-flex mt-1">
                            <input
                              type="text"
                              className="form-control form-control-sm me-2"
                              placeholder="Reply..."
                              value={commentInputs[`reply-${post._id}-${c._id}`] || ''}
                              onChange={(e) =>
                                setCommentInputs({
                                  ...commentInputs,
                                  [`reply-${post._id}-${c._id}`]: e.target.value,
                                })
                              }
                              aria-label="Reply to comment"
                            />
                            <button className="btn btn-sm btn-secondary">Reply</button>
                          </form>
                        </div>
                      ))}

                      {/* View All Comments */}
                      {post.comments.length > 2 && !expandedPosts[post._id] && (
                        <div className="mt-2 text-start">
                          <button
                            className="btn btn-link btn-sm p-0"
                            onClick={() =>
                              setExpandedPosts({ ...expandedPosts, [post._id]: true })
                            }
                          >
                            View all {post.comments.length} comments
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ))
      )}

      {loading && (
        <div className="text-center my-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
