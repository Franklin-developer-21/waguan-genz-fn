import io from 'socket.io-client';

const socket = io(process.env.NODE_ENV === 'production' 
  ? 'https://waguan-genz-bn.onrender.com' 
  : 'http://localhost:3000', {
  withCredentials: true,
  transports: ['polling', 'websocket'],
  timeout: 20000,
  forceNew: true
});

// Debug socket connection
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

export default socket;