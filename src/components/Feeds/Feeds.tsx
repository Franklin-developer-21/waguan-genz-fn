import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, Menu } from 'lucide-react';
import Post from '../Post/Post';
import Sidebar from '../Sidebar/Sidebar';
import UserSuggestions from '../UserSuggestions/UserSuggestions';
import Stories from '../Stories/Stories';
import { postsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Post as PostType } from '../../types';

const Feed = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <div className={`flex-1 ${isAuthenticated ? 'lg:ml-6' : ''} ${!isAuthenticated ? 'pt-16' : ''}`}>
          <div className="w-full mx-auto p-5">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-gray-600">Loading posts...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen relative">
      {/* Sidebar for desktop */}
      {isAuthenticated && (
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isAuthenticated && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-white shadow-lg h-full">
            <Sidebar />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Mobile navbar */}
      {isAuthenticated && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={24} className="text-gray-700" />
          </button>
          <h1 className="font-bold text-lg text-blue-500">ChatApp</h1>
          <X size={20} className="opacity-0" /> {/* Placeholder for balance */}
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 ${isAuthenticated ? 'lg:ml-64 lg:mr-80' : 'pt-16'}`}>
        <div className="max-w-2xl mx-auto p-5">
          {/* Header */}
          <div className="mb-8 flex justify-between bg-blue-600/15 p-3 rounded-lg mt-12 lg:mt-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-blue-500 mb-2">
                {isAuthenticated ? 'Home' : 'Discover'}
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                {isAuthenticated
                  ? 'Stay updated with the latest posts from people you follow'
                  : 'Explore amazing content from our community'}
              </p>
            </div>
            <X size={18} className="text-blue-500 hidden sm:block" />
          </div>

          {/* Stories */}
          {isAuthenticated && <Stories />}

          {/* Posts */}
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => <Post key={post._id} post={post} />)
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6 text-sm md:text-base">Be the first to share something amazing!</p>
                {isAuthenticated && (
                  <Link
                    to="/create-post"
                    className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all text-sm md:text-base"
                  >
                    <Plus size={18} />
                    Create Post
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar (desktop only) */}
      {isAuthenticated && (
        <div className="hidden lg:block fixed right-0 top-0 w-80 xl:w-96 h-full p-5 overflow-y-auto">
          <div className="pt-20 space-y-6">
            <UserSuggestions />

            {/* Trending */}
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
