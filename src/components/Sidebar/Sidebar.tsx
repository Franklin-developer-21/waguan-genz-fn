import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Users, Bell, Settings, User, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { notificationsAPI } from '../../services/api';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (user) {
      fetchNotificationCount();
      fetchMessageCount();
    }
  }, [user]);

  const fetchNotificationCount = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      const unread = response.data.filter((n: any) => !n.read).length;
      setNotificationCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchMessageCount = async () => {
    try {
      // This would need to be implemented based on your message API
      // For now, setting a placeholder count
      setMessageCount(0); // Replace with actual unread message count
    } catch (error) {
      console.error('Failed to fetch message count:', error);
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/users', icon: Users, label: 'Discover' },
    { path: '/chat', icon: MessageCircle, label: 'Messages' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link to="/" className="text-2xl font-bold text-blue-500">
          ChatApp
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon size={24} />
              <span className="text-base">{item.label}</span>
              {item.path === '/notifications' && notificationCount > 0 && (
                <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-auto min-w-[20px] text-center">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </div>
              )}
              {item.path === '/chat' && messageCount > 0 && (
                <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-auto min-w-[20px] text-center">
                  {messageCount > 99 ? '99+' : messageCount}
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Create Post Button */}
        <Link
          to="/create-post"
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center gap-4 px-4 py-3 mt-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
        >
          <Plus size={24} />
          <span className="text-base font-semibold">Create Post</span>
        </Link>
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
        <Link
          to="/profile"
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          {user?.profile ? (
            <img 
              src={user.profile} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.username}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </Link>
      </div>
      </div>
      
      {/* Mobile Bottom Navigation - Instagram Style */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 safe-area-pb">
        <div className="flex justify-around items-center px-2 py-1">
          {/* Home */}
          <Link
            to="/"
            className="flex flex-col items-center justify-center p-3 transition-colors"
          >
            <Home 
              size={24} 
              className={isActive('/') ? 'text-black' : 'text-gray-400'}
              fill={isActive('/') ? 'currentColor' : 'none'}
            />
          </Link>
          
          {/* Discover */}
          <Link
            to="/users"
            className="flex flex-col items-center justify-center p-3 transition-colors"
          >
            <Users 
              size={24} 
              className={isActive('/users') ? 'text-black' : 'text-gray-400'}
              fill={isActive('/users') ? 'currentColor' : 'none'}
            />
          </Link>
          
          {/* Create Post */}
          <Link
            to="/create-post"
            className="flex flex-col items-center justify-center p-3 transition-colors"
          >
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
              isActive('/create-post') ? 'border-black' : 'border-gray-400'
            }`}>
              <Plus size={16} className={isActive('/create-post') ? 'text-black' : 'text-gray-400'} />
            </div>
          </Link>
          
          {/* Messages */}
          <Link
            to="/chat"
            className="flex flex-col items-center justify-center p-3 transition-colors relative"
          >
            <MessageCircle 
              size={24} 
              className={isActive('/chat') ? 'text-black' : 'text-gray-400'}
              fill={isActive('/chat') ? 'currentColor' : 'none'}
            />
            {messageCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {messageCount > 9 ? '9+' : messageCount}
              </div>
            )}
          </Link>
          
          {/* Profile */}
          <Link
            to="/profile"
            className="flex flex-col items-center justify-center p-3 transition-colors"
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
              isActive('/profile') 
                ? 'border-black bg-black text-white' 
                : 'border-gray-400 bg-gradient-to-br from-blue-500 to-blue-600 text-white'
            }`}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Sidebar;