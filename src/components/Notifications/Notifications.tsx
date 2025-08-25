import { useState, useEffect } from 'react';
import { Bell, UserPlus, Check, CheckCheck } from 'lucide-react';
import { notificationsAPI, usersAPI } from '../../services/api';
// import { useAuth } from '../../hooks/useAuth';
import socket from '../../services/socket';

interface Notification {
  _id: string;
  type: 'follow' | 'like' | 'comment' | 'reply' | 'post';
  followType:string;
  sender: {
    _id: string;
    username: string;
    email?: string;
  };
  message: string;
  read: boolean;
  createdAt: string;
  postId?: string;
  commentId?: string;
}

const Notifications = () => {
  // const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedBack, setFollowedBack] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchNotifications();
    
    // TODO: Enable when Socket.IO is properly configured
    socket.on('newNotification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      socket.off('newNotification');
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleFollowBack = async (userId: string, notificationId: string) => {
    try {
      await usersAPI.followBack(userId);
      await handleMarkAsRead(notificationId);
      setFollowedBack(prev => new Set(prev).add(userId));
    } catch (error) {
      console.error('Failed to follow back:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-5 bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading notifications...</div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto p-5 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell size={28} className="text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 rounded-xl border transition-colors ${
                  notification.read 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {notification.sender.username[0].toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        {notification.type === 'follow' && <UserPlus size={12} className="text-white" />}
                        {notification.type === 'like' && <span className="text-white text-xs">❤️</span>}
                        {notification.type === 'comment' && <span className="text-white text-xs">💬</span>}
                        {notification.type === 'reply' && <span className="text-white text-xs">↩️</span>}
                        {notification.type === 'post' && <span className="text-white text-xs">📝</span>}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">
                          {notification.sender.username}
                        </span>
                        <span className="text-gray-600">
                          {notification.type === 'follow' && 'started following you'}
                          {notification.type === 'like' && 'liked your post'}
                          {notification.type === 'comment' && 'commented on your post'}
                          {notification.type === 'reply' && 'replied to your comment'}
                          {notification.type === 'post' && 'shared a new post'}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        {formatTime(notification.createdAt)}
                      </p>
                      
                      <div className="flex gap-3">
                        {notification.type === 'follow' && (
                          notification.followType === 'following' ? (
                            <span className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                              <Check size={14} />
                              Already followed
                            </span>
                          ) : followedBack.has(notification.sender._id) ? (
                            <span className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                              <Check size={14} />
                              Following
                            </span>
                          ) : (
                            <button
                              onClick={() => handleFollowBack(notification.sender._id, notification._id)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                            >
                              <UserPlus size={14} />
                              Follow Back
                            </button>
                          )
                        )}
                        
                        {(notification.type === 'like' || notification.type === 'comment' || notification.type === 'reply') && notification.postId && (
                          <button
                            onClick={() => window.location.href = `/post/${notification.postId}`}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                          >
                            View Post
                          </button>
                        )}
                        
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                          >
                            <Check size={14} />
                            Mark as Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell size={64} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No notifications yet</p>
            <p className="text-gray-500">You'll see notifications when people follow you</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;