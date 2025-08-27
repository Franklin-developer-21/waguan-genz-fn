import axios from 'axios';

const API_BASE_URL = 'https://waguan-genz-bn.onrender.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: { username: string; email: string; password: string; profileImage?: string; location?: string; phone?: string; bio?: string }) =>
    api.post('/auth/register', userData),
  
  logout: () =>
    api.post('/auth/logout'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.put(`/auth/reset-password/${token}`, { password }),
  
  getProfile: (id: string) =>
    api.get(`/auth/profile/${id}`),
  
  updateProfile: (profileData: { username?: string; profileImage?: string; location?: string; phoneNumber?: string; biography?: string }) =>
    api.put('/auth/profile', profileData),
};

// Posts API calls
export const postsAPI = {
  getPosts: () =>
    api.get('/posts'),
  
  createPost: (postData: { image: string; caption: string }) =>
    api.post('/posts', postData),
  
  likePost: (postId: string) =>
    api.post(`/posts/${postId}/like`),
  
  commentPost: (postId: string, text: string) =>
    api.post(`/posts/${postId}/comment`, { text }),
  
  replyToComment: (postId: string, commentId: string, text: string) =>
    api.post(`/posts/${postId}/comment/${commentId}/reply`, { text }),
};

// Messages API calls
export const messagesAPI = {
  getMessages: (chatId: string) =>
    api.get(`/messages/${chatId}`),
  
  createMessage: (chatId: string, text: string) =>
    api.post('/messages', { chatId, text }),
};

// Users API calls
export const usersAPI = {
  getAllUsers: () =>
    api.get('/users'),
  
  followUser: (userId: string) =>
    api.post(`/users/${userId}/follow`),
  
  followBack: (userId: string) =>
    api.post(`/users/${userId}/follow-back`),
  
  unfollowUser: (userId: string) =>
    api.post(`/users/${userId}/unfollow`),
  
  getFollowing: () =>
    api.get('/users/following'),
  
  checkFollowStatus: (userId: string) =>
    api.get(`/users/${userId}/follow-status`),
};

// Notifications API calls
export const notificationsAPI = {
  getNotifications: () =>
    api.get('/users/notifications'),
  
  markAsRead: (notificationId: string) =>
    api.put(`/users/notifications/${notificationId}/read`),
  
  markAllAsRead: () =>
    api.put('/notifications/mark-all-read'),
};

// Call API calls
export const callAPI = {
  initiateCall: (targetUserId: string, callType: 'video' | 'audio') =>
    api.post('/calls/initiate', { targetUserId, callType }),
};

export default api;