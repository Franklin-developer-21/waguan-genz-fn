import io from 'socket.io-client';

// const socket = io(process.env.NODE_ENV === 'production' 
//   ? 'https://waguan-genz-bn.onrender.com' 
//   : 'http://localhost:3000', {
//   withCredentials: process.env.NODE_ENV !== 'production',
//   transports: ['polling', 'websocket'],
//   timeout: 20000,
//   autoConnect: true,
//   reconnection: true,
//   reconnectionAttempts: 5,
//   reconnectionDelay: 1000
// });
const socket = io('https://waguan-genz-bn.onrender.com', {
  transports: ['websocket', 'polling']
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