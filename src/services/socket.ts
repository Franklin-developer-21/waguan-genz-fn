import io from 'socket.io-client';

const socket = io('https://waguan-genz-bn.onrender.com', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

export default socket;