import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface SuggestedUser {
  _id: string;
  username: string;
  email: string;
  followers: string[];
  following: string[];
  isActive: boolean;
}

const UserSuggestions = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await usersAPI.getAllUsers();
      const allUsers = response.data.filter((u: SuggestedUser) => u._id !== user?.id);
      
      // Get current user's following list
      const followingResponse = await usersAPI.getFollowing();
      const followingIds = followingResponse.data.map((f: any) => f._id);
      
      // Filter out users already being followed
      const notFollowed = allUsers.filter((u: SuggestedUser) => 
        !followingIds.includes(u._id)
      );
      
      setSuggestions(notFollowed.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await usersAPI.followUser(userId);
      setSuggestions(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  // const handleDismiss = (userId: string) => {
  //   setSuggestions(prev => prev.filter(u => u._id !== userId));
  // };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white w-full rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested for you</h3>
      
      <div className="space-y-4">
        {suggestions.map((suggestedUser) => (
          <div key={suggestedUser._id} className="flex items-center flex-wrap gap-2 justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {suggestedUser.username[0].toUpperCase()}
                </div>
                {suggestedUser.isActive && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {suggestedUser.username}
                </p>
                <p className="text-xs text-gray-500">
                  {suggestedUser.followers?.length || 0} followers
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFollow(suggestedUser._id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                <UserPlus size={14} />
                Follow
              </button>
              
              {/* <button
                onClick={() => handleDismiss(suggestedUser._id)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={14} />
              </button> */}
            </div>
          </div>
        ))}
      </div>
      
      <Link
        to="/users"
        className="block text-center text-sm text-blue-500 hover:text-blue-600 font-medium mt-4 py-2"
      >
        See all suggestions
      </Link>
    </div>
  );
};

export default UserSuggestions;