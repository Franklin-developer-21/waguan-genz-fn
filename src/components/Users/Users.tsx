import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Users as UsersIcon } from 'lucide-react';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface User {
  _id: string;
  username: string;
  email: string;
  followers: string[];
  following: string[];
  isActive: boolean;
}

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAllUsers();
      const allUsers = response.data.filter((u: User) => u._id !== user?.id);
      setUsers(allUsers);
      
      // Set initially following users
      const following = new Set<string>(
        allUsers
          .filter((u: User) => u.followers && u.followers.includes(user?.id || ''))
          .map((u: User) => u._id)
      );
      setFollowingUsers(following);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await usersAPI.followUser(userId);
      setFollowingUsers(prev => new Set([...prev, userId]));
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await usersAPI.unfollowUser(userId);
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to unfollow user:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-5 bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-5 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <UsersIcon size={28} className="text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-800">Discover People</h1>
        </div>

        {users.length > 0 ? (
          <div className="grid gap-4">
            {users.map((userItem) => (
              <div
                key={userItem._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {userItem.username[0].toUpperCase()}
                    </div>
                    {userItem.isActive && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {userItem.username}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${userItem.isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {userItem.isActive ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>{userItem.followers?.length || 0} followers</span>
                      <span>{userItem.following?.length || 0} following</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => 
                    followingUsers.has(userItem._id) 
                      ? handleUnfollow(userItem._id)
                      : handleFollow(userItem._id)
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    followingUsers.has(userItem._id)
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {followingUsers.has(userItem._id) ? (
                    <>
                      <UserMinus size={16} />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Follow
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <UsersIcon size={64} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;