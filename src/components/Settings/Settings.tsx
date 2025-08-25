import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Moon, Globe, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    sms: false
  });
  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showOnlineStatus: true,
    allowMessages: true
  });
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Edit Profile',
          action: () => navigate('/profile'),
          hasArrow: true
        },
        {
          icon: Shield,
          label: 'Privacy & Security',
          action: () => {},
          hasArrow: true
        }
      ]
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: Bell,
          label: 'Push Notifications',
          toggle: notifications.push,
          onToggle: (value: boolean) => setNotifications(prev => ({ ...prev, push: value }))
        },
        {
          icon: Bell,
          label: 'Email Notifications',
          toggle: notifications.email,
          onToggle: (value: boolean) => setNotifications(prev => ({ ...prev, email: value }))
        }
      ]
    },
    {
      title: 'Privacy',
      items: [
        {
          icon: Globe,
          label: 'Public Profile',
          toggle: privacy.profilePublic,
          onToggle: (value: boolean) => setPrivacy(prev => ({ ...prev, profilePublic: value }))
        },
        {
          icon: User,
          label: 'Show Online Status',
          toggle: privacy.showOnlineStatus,
          onToggle: (value: boolean) => setPrivacy(prev => ({ ...prev, showOnlineStatus: value }))
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Moon,
          label: 'Dark Mode',
          toggle: darkMode,
          onToggle: setDarkMode
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-5 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <SettingsIcon size={28} className="text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          </div>
          <p className="text-gray-600 mt-2">Manage your account and preferences</p>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{user?.username}</h3>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="divide-y divide-gray-100">
          {settingSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{section.title}</h2>
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <item.icon size={20} className="text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-800">{item.label}</span>
                    </div>
                    
                    {'hasArrow' in item && item.hasArrow && (
                      <button
                        onClick={item.action}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronRight size={20} className="text-gray-400" />
                      </button>
                    )}
                    
                    {'toggle' in item && item.toggle !== undefined && (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.toggle}
                          onChange={(e) => item.onToggle?.(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Section */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <LogOut size={20} className="text-red-600" />
            </div>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;