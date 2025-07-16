import axios from 'axios';

const API = axios.create({
  // baseURL: 'http://localhost:5000/api',
  baseURL: "https://mern-backend-s6eq.onrender.com/api" 
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
