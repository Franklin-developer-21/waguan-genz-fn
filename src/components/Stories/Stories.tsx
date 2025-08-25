import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        handleUpload(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (file: File, base64Image: string) => {
    console.log('Uploading story:', file.name)
    try {
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
              onClick={() => fileInputRef.current?.click()}
              className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white hover:shadow-lg transition-all"
            >
              <Plus size={24} />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <Plus size={12} className="text-white" />
              </div>
            </button>
            <p className="text-xs text-center mt-2 text-gray-600">Your story</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
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


    </>
  );
};

export default Stories;