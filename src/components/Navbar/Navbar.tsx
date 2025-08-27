import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, User, Settings, LogOut, Bell, Search, Users, Plus } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { requestNotificationPermission } from '../../utils/notifications';
// import socket from '../../services/socket';

interface NavbarProps {
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    email?: string;
  } | null;
  onLogout: () => void;
}

const Navbar = ({ isAuthenticated, user, onLogout }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotificationCount();
      requestNotificationPermission();
      
      // TODO: Enable when Socket.IO is properly configured
      // socket.on('newNotification', (notification) => {
      //   setUnreadCount(prev => prev + 1);
      //   showGeneralNotification('New Notification', notification.message);
      // });

      // return () => {
      //   socket.off('newNotification');
      // };
    }
  }, [isAuthenticated]);

  const fetchNotificationCount = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      const unread = response.data.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
    setShowProfileMenu(false);
  };

  if (!isAuthenticated) {
    return (
      <nav className="bg-white border-b border-gray-200 px-3 md:px-5 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 md:h-18">
          <Link
            to="/"
            className="text-2xl font-bold text-blue-500 no-underline"
          >
            ChatApp
          </Link>

          <div className="flex gap-4">
            <Link
              to="/login"
              className="px-3 md:px-5 py-2 text-blue-500 no-underline font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm md:text-base"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-3 md:px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white no-underline font-medium rounded-lg hover:shadow-lg transition-all text-sm md:text-base"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 px-3 md:px-5 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 md:h-18">
        <Link
          to="/"
          className="text-2xl font-bold text-blue-500 no-underline"
        >
          ChatApp
        </Link>

        <div className="hidden md:block relative flex-1 max-w-md mx-6 lg:mx-10">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full py-2 pl-10 pr-4 border border-gray-200 rounded-full text-sm outline-none bg-gray-50 focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Mobile search button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Search size={20} />
        </button>

        <div className="hidden md:flex items-center gap-3 lg:gap-5">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 lg:px-4 py-2 ${isActive('/') ? 'text-blue-500 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'} no-underline rounded-lg transition-all font-medium text-sm lg:text-base`}
          >
            <Home size={18} className="lg:w-5 lg:h-5" />
            <span className="hidden lg:block">Home</span>
          </Link>

          <Link
            to="/users"
            className={`flex items-center gap-2 px-3 lg:px-4 py-2 ${isActive('/users') ? 'text-blue-500 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'} no-underline rounded-lg transition-all font-medium text-sm lg:text-base`}
          >
            <Users size={18} className="lg:w-5 lg:h-5" />
            <span className="hidden lg:block">People</span>
          </Link>

          <Link
            to="/chat"
            className={`flex items-center gap-2 px-3 lg:px-4 py-2 ${isActive('/chat') ? 'text-blue-500 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'} no-underline rounded-lg transition-all font-medium relative text-sm lg:text-base`}
          >
            <MessageCircle size={18} className="lg:w-5 lg:h-5" />
            <span className="hidden lg:block">Messages</span>
            <div className="absolute top-1 right-1 lg:right-2 w-2 h-2 bg-red-500 rounded-full" />
          </Link>

          <Link
            to="/notifications"
            className={`p-2 rounded-full cursor-pointer relative hover:bg-gray-100 transition-colors ${isActive('/notifications') ? 'text-blue-500 bg-blue-50' : 'text-gray-600'}`}
          >
            <Bell size={18} className="lg:w-5 lg:h-5" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="bg-none border-none cursor-pointer flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs lg:text-sm">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="hidden lg:block text-gray-800 font-medium text-sm">
                {user?.username || 'User'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 min-w-50 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100">
                  <div className="font-semibold text-gray-800 text-sm">
                    {user?.username}
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    {user?.email}
                  </div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-800 no-underline hover:bg-gray-50 transition-colors text-sm"
                >
                  <User size={16} />
                  Profile
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-800 no-underline hover:bg-gray-50 transition-colors text-sm"
                >
                  <Settings size={16} />
                  Settings
                </Link>

                <div className="border-t border-gray-100 mt-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-500 bg-none border-none cursor-pointer w-full text-left hover:bg-red-50 transition-colors text-sm"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Menu */}
        {showMobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <div className="px-3 py-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full py-2 pl-10 pr-4 border border-gray-200 rounded-full text-sm outline-none bg-gray-50 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Bottom Navigation - Instagram Style */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 pb-safe">
        <div className="flex justify-around items-center px-2 py-2">
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
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
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
          
          {/* Settings */}
          <Link
            to="/settings"
            className="flex flex-col items-center justify-center p-3 transition-colors"
          >
            <Settings 
              size={24} 
              className={isActive('/settings') ? 'text-black' : 'text-gray-400'}
              fill={isActive('/settings') ? 'currentColor' : 'none'}
            />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;