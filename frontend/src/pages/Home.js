import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useRef } from 'react';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [likes, setLikes] = useState({});
  const [showCommentBox, setShowCommentBox] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [mediaFile, setMediaFile] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.userId);
    }
  }, []);

  const fetchPosts = async (pageNum = 1) => {
    try {
      const res = await API.get(`/posts?page=${pageNum}`);
      setPosts(res.data.posts);
      setPage(2); // because first fetch is page 1
      // setPage(pageNum
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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


  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() && !mediaFile) return;

    const formData = new FormData();
    formData.append("content", newPost);
    if (mediaFile) {
      formData.append("media", mediaFile);
    }

    console.log('Submitting post:', { content: newPost, mediaFile });

    try {
      await API.post('/posts', formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success("Post created successfully!");

      // Reset state and file input field
      setNewPost('');
      setMediaFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }

      fetchPosts(); // Refresh post list
    } catch (err) {
      toast.error("Failed to post");
      console.error(err);
    }
  };

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


  const handleEdit = (post) => {
    setEditingPostId(post._id);
    setEditedContent(post.content);
  };

  const handleUpdate = async () => {
    try {
      await API.put(`/posts/${editingPostId}`, { content: editedContent });
      toast.success("Post updated!");
      setEditingPostId(null);
      setEditedContent('');
      fetchPosts();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const [likeLoadingPostId, setLikeLoadingPostId] = useState(null);
  const handleLike = async (postId) => {
    if (likeLoadingPostId === postId) return; // already processing this post

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

  const characterLimit = 200; // Limit to 200 characters

  const isTruncated = (content) => content.length > characterLimit;

  const getDisplayContent = (content, postId) => {
    if (expandedPosts[postId] || !isTruncated(content)) {
      return content;
    }
    return content.slice(0, characterLimit) + '...';
  };

  const toggleExpanded = (postId) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const loadMorePosts = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/posts?page=${page}&limit=10`);
      const newPosts = res.data.posts;

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prevPosts) => {
          const existingIds = new Set(prevPosts.map((p) => p._id));
          const filteredPosts = newPosts.filter((p) => !existingIds.has(p._id));
          return [...prevPosts, ...filteredPosts];
        });
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error loading more posts", error);
    } finally {
      setLoading(false);
    }
  };

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
              ></textarea>
              <label>What's on your mind?</label>
            </div>
            <input
              type="file"
              className="form-control mb-3"
              ref={fileInputRef}
              onChange={(e) => setMediaFile(e.target.files[0])}
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
                      alt="avatar"
                      className="rounded-circle me-3"
                      width="50"
                      height="50"
                    />
                    <div className="flex-grow-1">
                      <strong>{post.author?.fullName} ({post.author?.username})</strong>
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
                          src={`http://localhost:5000/api/posts/media/${post._id}`}
                          alt="Post"
                          className="img-fluid rounded"
                          style={{ maxHeight: "300px", objectFit: "cover" }}
                        />
                      ) : post.media.contentType.startsWith("video") ? (
                        <video controls className="w-100 rounded" style={{ maxHeight: "300px" }}>
                          <source
                            src={`http://localhost:5000/api/posts/media/${post._id}`}
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
                        />
                        <button type="submit" className="btn btn-sm btn-primary">Post</button>
                      </form>

                      {/* Comments & Replies */}
                      {(expandedPosts[post._id] ? post.comments : post.comments.slice(0, 2)).map((c, i) => (
                        <div key={i} className="ps-3 border-start mt-2">
                          <small className="text-muted d-block">💬 {c.content}</small>
                          {c.replies?.map((r, j) => (
                            <div key={j} className="ps-3 border-start mt-1">
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

      {/* Pagination */}
      {/* <div className="d-flex justify-content-center align-items-center gap-3 my-4">
        <button
          className="btn btn-outline-secondary"
          disabled={page === 1}
          onClick={() => fetchPosts(page - 1)}
        >
          ⬅ Previous
        </button>
        <span className="fw-bold">Page {page}</span>
        <button
          className="btn btn-outline-secondary"
          disabled={posts.length < 10}
          onClick={() => fetchPosts(page + 1)}
        >
          Next ➡
        </button>
      </div> */}
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
