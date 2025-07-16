import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { toast } from 'react-toastify';

const Register = () => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: ''
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await API.post('/auth/register', form);
      toast.success("Registration successful! Now login.");
      // alert('Registration successful! Now login.');
      navigate('/login');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        setError(errors.map((e) => e.msg).join(' | ')); 
      } else {
        setError(err.response?.data?.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light px-2">
      <div className="card shadow p-4 w-100" style={{ maxWidth: '500px' }}>
        <h2 className="text-center mb-4 text-primary">Create Account</h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="fullName"
              className="form-control"
              placeholder="Your full name"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="example@mail.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Register
          </button>
        </form>

        <p className="mt-3 text-center">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
