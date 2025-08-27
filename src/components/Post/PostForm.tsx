import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X } from 'lucide-react';
import { postsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const PostForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!image || !caption.trim() || !user) return;

    setIsLoading(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Image = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(image);
      });

      const postData = {
        image: base64Image,
        caption: caption.trim()
      };

      console.log('Sending post data:', { ...postData, imageUrl: 'base64_data_truncated' });
      const response = await postsAPI.createPost(postData);
      console.log('Post created successfully:', response.data);
      navigate('/');
    } catch (error: any) {
      console.error('Failed to create post:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create post';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-5 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Post</h1>
        
        <form onSubmit={handleSubmit}>
          {/* Image Upload */}
          <div className="mb-6">
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-64 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera size={48} className="text-gray-400 mb-4" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> an image
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* Caption */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="w-full p-3 border border-gray-300 rounded-xl resize-none outline-none focus:border-blue-500 transition-colors"
              rows={4}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!image || !caption.trim() || isLoading}
            className={`w-full py-3 px-6 rounded-xl text-white font-semibold transition-all ${
              !image || !caption.trim() || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            {isLoading ? 'Creating Post...' : 'Share Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostForm;