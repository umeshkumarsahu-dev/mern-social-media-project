import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [commentInputs, setCommentInputs] = useState({});
  const [likes, setLikes] = useState({});
  const [showCommentBox, setShowCommentBox] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});

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
      setPage(pageNum);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      await API.post('/posts', { content: newPost });
      toast.success("Post created successfully!");
      setNewPost('');
      fetchPosts();
    } catch (err) {
      console.error("Post creation failed:", err);
      toast.error("Post creation failed.");
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


  return (
    <div className="container mt-5">
      <h2 className="text-primary text-center mb-4">📝 Share a Post</h2>

      <form onSubmit={handlePostSubmit} className="mb-4">
        <div className="form-floating">
          <textarea
            className="form-control"
            placeholder="What's on your mind?"
            id="postContent"
            style={{ height: '100px' }}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          ></textarea>
          <label htmlFor="postContent">What's on your mind?</label>
        </div>
        <div className="text-end mt-2">
          <button type="submit" className="btn btn-primary">Post</button>
        </div>
      </form>

      <hr />

      <h3 className="text-center mb-3">📢 Recent Posts</h3>

      {posts.length === 0 ? (
        <p className="text-muted text-center">No posts yet.</p>
      ) : (
        posts.map((post) => (
          <div key={post._id} className="card mb-3 shadow-sm">
            <div className="card-body">
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
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="card-text mb-1">{post.content}</p>
                      <p className="text-muted small mb-0">
                        <strong>By:</strong> {post.author.fullName} ({post.author.username})<br />
                        <strong>At:</strong> {new Date(post.createdAt).toLocaleString()}
                        {post.edited && <span className="ms-2 text-warning">(edited)</span>}
                      </p>
                    </div>

                    {post.author._id === userId && (
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-outline-secondary dropdown-toggle"
                          type="button"
                          id={`dropdownMenuButton-${post._id}`}
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          ⋯
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`dropdownMenuButton-${post._id}`}>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleEdit(post)}
                            >
                              ✏️ Edit
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item text-danger"
                              onClick={() => handleDelete(post._id)}
                            >
                              🗑️ Delete
                            </button>
                          </li>
                        </ul>
                      </div>

                    )}
                  </div>



                  <div className="d-flex justify-content-between text-muted small mb-2">
                    <span>❤️ {post.likes.length} Likes</span>
                    <span>💬 {post.comments.length} Comments</span>
                  </div>

                  <hr></hr>
                  <div className="d-flex justify-content-around mb-2">
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

                  {showCommentBox[post._id] && (
                    <>
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

                      {(expandedPosts[post._id] ? post.comments : post.comments.slice(0, 2)).map((c, i) => (
                        <div key={i} className="ps-3 border-start mt-2">
                          <small className="text-muted d-block">💬 {c.content}</small>

                          {c.replies?.map((r, j) => (
                            <div key={j} className="ps-3 border-start mt-1">
                              <small className="text-muted">↳ {r.content}</small>
                            </div>
                          ))}

                          <form
                            onSubmit={(e) => handleReply(e, post._id, c._id)}
                            className="d-flex mt-1"
                          >
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

                      {post.comments.length > 2 && !expandedPosts[post._id] && (
                        <div className="mt-1">
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

                  {/* {post.author._id === userId && (
                    <div className="text-end mt-2">
                      <button
                        className="btn btn-outline-primary btn-sm me-2"
                        onClick={() => handleEdit(post)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(post._id)}
                      >
                        Delete
                      </button>

                    </div>
                  )} */}
                </>
              )}
            </div>
          </div>
        ))
      )}

      <div className="d-flex justify-content-between align-items-center my-4">
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
      </div>
    </div>
  );
};

export default Home;
