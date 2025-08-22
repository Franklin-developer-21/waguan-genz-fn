export interface User {
  id: string;
  username: string;
  email?: string;
}

export interface Post {
  _id: string;
  userId: User | string;
  imageUrl: string;
  caption: string;
  likes: string[];
  comments: { userId: string; text: string; timestamp: Date }[];
  timestamp: Date;
}

export interface Message {
  _id: string;
  chatId: string;
  userId: string;
  text: string;
  timestamp: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}