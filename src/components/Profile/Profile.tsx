import { useState, useEffect } from 'react';
import { Camera, Edit3, MapPin, Calendar, Mail, Phone, Plus, X, Image } from 'lucide-react';
import { postsAPI, authAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    image: null as File | null,
    caption: '',
    imagePreview: null as string | null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    location: '',
    joinDate: 'January 2024',
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
    profileImage: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile(user!.id);
      const userData = response.data;
      setProfile({
        username: userData.username || user!.username,
        email: userData.email || user!.email,
        phone: userData.phoneNumber || '',
        bio: userData.biography || '',
        location: userData.location || '',
        joinDate: new Date(userData.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        postsCount: userData.postsCount || 0,
        followersCount: userData.followers?.length || 0,
        followingCount: userData.following?.length || 0,
        profileImage: userData.profileImage || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const profileData = {
        username: profile.username,
        location: profile.location,
        phoneNumber: profile.phone,
        biography: profile.bio
      };
      
      const response = await authAPI.updateProfile(profileData);
      console.log('Profile updated:', response.data);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

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
    if (!uploadData.image || !uploadData.caption.trim()) return;
    
    setIsUploading(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Image = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(uploadData.image!);
      });
      
      const postData = {
        image: base64Image,
        caption: uploadData.caption.trim()
      };
      
      console.log('Uploading post from profile...');
      const response = await postsAPI.createPost(postData);
      console.log('Post uploaded successfully:', response.data);
      setShowUploadModal(false);
      setUploadData({ image: null, caption: '', imagePreview: null });
      alert('Post uploaded successfully!');
    } catch (error: any) {
      console.error('Failed to upload post:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload post';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setShowUploadModal(false);
    setUploadData({ image: null, caption: '', imagePreview: null });
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      const base64Image = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      const response = await authAPI.updateProfile({ profileImage: base64Image });
      setProfile(prev => ({ ...prev, profileImage: response.data.user.profileImage }));
      alert('Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile picture:', error);
      alert(error.response?.data?.message || 'Failed to update profile picture');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-5 bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-5 bg-gray-50 min-h-screen">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-10 mb-5 shadow-lg text-center">
        <div className="relative inline-block mb-5">
          {profile.profileImage ? (
            <img 
              src={profile.profileImage} 
              alt="Profile" 
              className="w-30 h-30 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-30 h-30 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-5xl font-semibold mx-auto">
              {profile.username[0]?.toUpperCase()}
            </div>
          )}
          <label className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-blue-500 border-3 border-white text-white cursor-pointer flex items-center justify-center hover:bg-blue-600 transition-colors">
            <Camera size={16} />
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="hidden"
            />
          </label>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-gray-800">
          @{profile.username}
        </h1>

        {profile.bio && (
          <p className="mb-5 text-gray-600 text-base leading-relaxed">
            {profile.bio}
          </p>
        )}

        <div className="flex justify-center gap-8 mb-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{profile.postsCount}</div>
            <div className="text-sm text-gray-600">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{profile.followersCount}</div>
            <div className="text-sm text-gray-600">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{profile.followingCount}</div>
            <div className="text-sm text-gray-600">Following</div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-6 py-3 ${isEditing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-colors`}
          >
            <Edit3 size={18} />
            {isEditing ? 'Save Profile' : 'Edit Profile'}
          </button>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-colors"
          >
            <Plus size={18} />
            New Post
          </button>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <h2 className="mb-6 text-xl font-semibold text-gray-800">
          Profile Information
        </h2>

        <div className="grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-5">
          {/* Email */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <Mail size={20} className="text-blue-500" />
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">Email</div>
              {isEditing ? (
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  className="border-none bg-white p-2 rounded-lg text-base w-full outline-none"
                />
              ) : (
                <div className="text-base text-gray-800 font-medium">
                  {profile.email}
                </div>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <Phone size={20} className="text-blue-500" />
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">Phone</div>
              {isEditing ? (
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  className="border-none bg-white p-2 rounded-lg text-base w-full outline-none"
                />
              ) : (
                <div className="text-base text-gray-800 font-medium">
                  {profile.phone}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <MapPin size={20} className="text-blue-500" />
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">Location</div>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({...profile, location: e.target.value})}
                  className="border-none bg-white p-2 rounded-lg text-base w-full outline-none"
                />
              ) : (
                <div className="text-base text-gray-800 font-medium">
                  {profile.location}
                </div>
              )}
            </div>
          </div>

          {/* Join Date */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <Calendar size={20} className="text-blue-500" />
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">Member Since</div>
              <div className="text-base text-gray-800 font-medium">
                {profile.joinDate}
              </div>
            </div>
          </div>

          {/* Bio */}
          {/* <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-sm text-gray-600 mb-2">Bio</div>
            {isEditing ? (
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                className="border-none bg-white p-3 rounded-lg text-base w-full min-h-20 outline-none resize-y font-inherit"
              />
            ) : (
              <div className="text-base text-gray-800 leading-relaxed">
                {profile.bio}
              </div>
            )}
          </div> */}
        </div>

        {isEditing && (
          <div className="flex gap-4 mt-6 justify-end">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 bg-gray-100 text-gray-600 border-none rounded-xl text-base font-medium cursor-pointer hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-500 text-white border-none rounded-xl text-base font-semibold cursor-pointer hover:bg-blue-600 transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Post</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              {uploadData.imagePreview ? (
                <div className="relative">
                  <img 
                    src={uploadData.imagePreview} 
                    alt="Preview" 
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => setUploadData(prev => ({ ...prev, image: null, imagePreview: null }))}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Image size={48} className="text-gray-400 mb-4" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> an image
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>

            {/* Caption */}
            <div className="mb-6">
              <textarea
                value={uploadData.caption}
                onChange={(e) => setUploadData(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="Write a caption..."
                className="w-full p-3 border border-gray-300 rounded-xl resize-none outline-none focus:border-blue-500 transition-colors"
                rows={3}
              />
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!uploadData.image || !uploadData.caption.trim() || isUploading}
              className={`w-full py-3 px-6 rounded-xl text-white font-semibold transition-all ${
                !uploadData.image || !uploadData.caption.trim() || isUploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Share Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;