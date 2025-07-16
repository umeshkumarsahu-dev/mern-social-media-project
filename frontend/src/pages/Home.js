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
                  <p className="card-text">{post.content}</p>
                  <p className="text-muted small">
                    <strong>By:</strong> {post.author.fullName} ({post.author.username}) <br />
                    <strong>At:</strong> {new Date(post.createdAt).toLocaleString()}
                    {post.edited && <span className="ms-2 text-warning">(edited)</span>}
                  </p>

                  {post.author._id === userId && (
                    <div className="text-end">
                      <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleEdit(post)}>Edit</button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(post._id)}>Delete</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))
      )}

      <div className="d-flex justify-content-between align-items-center mt-4">
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
