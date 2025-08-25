import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Story {
  _id: string;
  user: {
    _id: string;
    username: string;
  };
  image: string;
  createdAt: string;
}

const Stories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    image: null as File | null,
    imagePreview: null as string | null
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = () => setUploadData(prev => ({ ...prev, imagePreview: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.image) return;
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Image = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(uploadData.image!);
      });
      
      // Create new story object
      const newStory: Story = {
        _id: Date.now().toString(),
        user: {
          _id: user?.id || '',
          username: user?.username || 'Unknown'
        },
        image: base64Image,
        createdAt: new Date().toISOString()
      };
      
      // Add to stories list
      setStories(prev => [newStory, ...prev]);
      
      // TODO: Add story API call
      // await storiesAPI.createStory({ image: base64Image });
      
      setShowUploadModal(false);
      setUploadData({ image: null, imagePreview: null });
    } catch (error) {
      console.error('Failed to upload story:', error);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {/* Add Story Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowUploadModal(true)}
              className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white hover:shadow-lg transition-all"
            >
              <Plus size={24} />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <Plus size={12} className="text-white" />
              </div>
            </button>
            <p className="text-xs text-center mt-2 text-gray-600">Your story</p>
          </div>

          {/* Stories */}
          {stories.map((story) => (
            <div key={story._id} className="flex-shrink-0">
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 p-0.5">
                <img
                  src={story.image}
                  alt={`${story.user.username}'s story`}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <p className="text-xs text-center mt-2 text-gray-600 truncate w-16">
                {story.user.username}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add to your story</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {uploadData.imagePreview ? (
                <div className="relative">
                  <img
                    src={uploadData.imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => setUploadData({ image: null, imagePreview: null })}
                    className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="block w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
                  <div className="flex flex-col items-center justify-center h-full">
                    <Plus size={48} className="text-gray-400 mb-2" />
                    <p className="text-gray-600">Click to upload image</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadData.image}
                  className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Stories;