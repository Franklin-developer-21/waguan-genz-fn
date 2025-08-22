import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Post from '../Post/Post';
import Sidebar from '../Sidebar/Sidebar';
import UserSuggestions from '../UserSuggestions/UserSuggestions';
import Stories from '../Stories/Stories';
import { postsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type{ Post as PostType } from '../../types';

const Feed = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await postsAPI.getPosts();
        setPosts(response.data);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        {isAuthenticated && (
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        )}
        <div className={`flex-1 ${isAuthenticated ? 'lg:ml-64' : ''} ${!isAuthenticated ? 'pt-18' : ''}`}>
          <div className="max-w-2xl mx-auto p-5">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-gray-600">Loading posts...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar for desktop */}
      {isAuthenticated && (
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      )}
      
      {/* Mobile navbar for small screens */}
      {isAuthenticated && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
          {/* Your existing mobile navbar can go here */}
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 ${isAuthenticated ? 'lg:ml-64 lg:mr-80' : 'pt-18'}`}>
        <div className="max-w-2xl mx-auto p-5">
               {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isAuthenticated ? 'Home' : 'Discover'}
            </h1>
            <p className="text-gray-600">
              {isAuthenticated 
                ? 'Stay updated with the latest posts from people you follow'
                : 'Explore amazing content from our community'
              }
            </p>
          </div>
          {/* Stories Section */}
          {isAuthenticated && <Stories />}
       

          {/* Posts */}
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => <Post key={post._id} post={post} />)
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">Be the first to share something amazing!</p>
                {isAuthenticated && (
                  <Link
                    to="/create-post"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    <Plus size={20} />
                    Create Post
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar with suggestions */}
      {isAuthenticated && (
        <div className="hidden lg:block fixed right-0 top-0 w-96 h-full p-5 overflow-y-auto">
          <div className="pt-20 space-y-6">
            <UserSuggestions />
            
            {/* Trending Topics */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending</h3>
              <div className="space-y-3">
                {['#ReactJS', '#WebDev', '#JavaScript', '#TailwindCSS'].map((tag, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{tag}</span>
                    <span className="text-xs text-gray-500">{Math.floor(Math.random() * 100)}K posts</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <a href="#" className="hover:text-gray-700">About</a>
                  <a href="#" className="hover:text-gray-700">Help</a>
                  <a href="#" className="hover:text-gray-700">Privacy</a>
                  <a href="#" className="hover:text-gray-700">Terms</a>
                </div>
                <p>© 2024 ChatApp. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;