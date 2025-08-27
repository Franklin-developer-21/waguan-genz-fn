import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Camera, MapPin, FileText } from 'lucide-react';
import { authAPI } from '../../services/api';
import { getUserLocationFromIP, getLocationSuggestions, getCountryFlag } from '../../utils/location';

interface SignupForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  profileImage?: File;
  location?: string;
  phone?: string;
  bio?: string;
}

const Signup = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignupForm>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [countryData, setCountryData] = useState({ dialCode: '', flag: '', countryCode: '' });
  const [locationValue, setLocationValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const password = watch('password');

  useEffect(() => {
    // Get user location from IP on component mount
    const detectLocation = async () => {
      const locationData = await getUserLocationFromIP();
      if (locationData) {
        setLocationValue(locationData.location);
        setCountryData({
          dialCode: locationData.dialCode,
          flag: getCountryFlag(locationData.countryCode),
          countryCode: locationData.countryCode
        });
      }
    };
    detectLocation();
  }, []);

  const onSubmit = async (data: SignupForm) => {
    if (currentStep !== 3) {
      return; // Prevent submission if not on final step
    }
    setIsLoading(true);
    try {
      let profileImageBase64 = '';
      if (selectedFile) {
        const reader = new FileReader();
        profileImageBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
      }
      
      const userData = {
        username: data.username,
        email: data.email,
        password: data.password,
        ...(profileImageBase64 && { profileImage: profileImageBase64 }),
        ...(locationValue && { location: locationValue }),
        ...(phoneValue && { phoneNumber: `${countryData.dialCode}${phoneValue}` }),
        ...(data.bio && { biography: data.bio })
      };
      
      console.log('Sending user data:', { ...userData, profileImage: profileImageBase64 ? 'base64_data' : 'none' });
      await authAPI.register(userData);
      setIsLoading(false);
      alert('Account created successfully! Please login.');
      navigate('/login');
    } catch (error: any) {
      setIsLoading(false);
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Signup failed. Please try again.';
      
      console.error('Signup failed:', errorMessage);
      alert(`Signup failed: ${errorMessage}`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setProfileImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLocationChange = async (value: string) => {
    setLocationValue(value);
    if (value.length >= 3) {
      const suggestions = await getLocationSuggestions(value);
      setLocationSuggestions(suggestions);
      setShowLocationSuggestions(true);
    } else {
      setShowLocationSuggestions(false);
    }
  };

  const selectLocationSuggestion = (suggestion: any) => {
    setLocationValue(suggestion.description);
    setShowLocationSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center p-5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse delay-300"></div>
      </div>
      
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20 relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600 text-sm">Step {currentStep} of 3</p>
          <div className="flex gap-2 justify-center mt-3">
            <div className={`w-6 h-1 rounded ${currentStep >= 1 ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
            <div className={`w-6 h-1 rounded ${currentStep >= 2 ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
            <div className={`w-6 h-1 rounded ${currentStep >= 3 ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
          </div>
        </div>

        <div>
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="mb-4">
                <div className="relative flex items-center">
                  <User size={20} className="absolute left-4 text-gray-500 z-10" />
                  <input
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Username must be at least 3 characters'
                      }
                    })}
                    type="text"
                    placeholder="Enter your username"
                    className={`w-full py-3 pl-12 pr-4 border-2 ${errors.username ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors`}
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
                )}
              </div>



              <div className="mb-4">
                <div className="relative flex items-center">
                  <Mail size={20} className="absolute left-4 text-gray-500 z-10" />
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    placeholder="Enter your email"
                    className={`w-full py-3 pl-12 pr-4 border-2 ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>


            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="mb-4">
                <div className="relative flex items-center">
                  <Lock size={20} className="absolute left-4 text-gray-500 z-10" />
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={`w-full py-3 pl-12 pr-12 border-2 ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 bg-transparent border-none cursor-pointer text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="mb-4">
                <div className="relative flex items-center">
                  <Lock size={20} className="absolute left-4 text-gray-500 z-10" />
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className={`w-full py-3 pl-12 pr-12 border-2 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 bg-transparent border-none cursor-pointer text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Profile Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture (Optional)
                </label>
                <div className="flex items-center gap-3">
                  {profileImagePreview ? (
                    <img 
                      src={profileImagePreview} 
                      alt="Profile preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <User size={24} className="text-gray-400" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                    <Camera size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-600">Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

          <div className="mb-4 relative">
            <div className="relative flex items-center">
              <MapPin size={20} className="absolute left-4 text-gray-500 z-10" />
              <input
                {...register('location')}
                type="text"
                value={locationValue}
                onChange={(e) => handleLocationChange(e.target.value)}
                placeholder="Location (Optional)"
                className="w-full py-4 pl-12 pr-4 border-2 border-gray-200 rounded-xl text-base outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                {locationSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => selectLocationSuggestion(suggestion)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm text-gray-800">{suggestion.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-5">
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center gap-2 z-10">
                {countryData.flag && (
                  <img src={countryData.flag} alt="flag" className="w-5 h-4" />
                )}
                <span className="text-gray-500 text-sm">{countryData.dialCode}</span>
              </div>
              <input
                {...register('phone')}
                type="tel"
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                placeholder="Phone Number (Optional)"
                className="w-full py-4 pl-20 pr-4 border-2 border-gray-200 rounded-xl text-base outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="mb-5">
            <div className="relative">
              <FileText size={20} className="absolute left-4 top-4 text-gray-500 z-10" />
              <textarea
                {...register('bio')}
                placeholder="Tell us about yourself (Optional)"
                rows={3}
                className="w-full py-4 pl-12 pr-4 border-2 border-gray-200 rounded-xl text-base outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="mb-5">
            <div className="relative flex items-center">
              <Lock size={20} className="absolute left-4 text-gray-500 z-10" />
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className={`w-full py-4 pl-12 pr-12 border-2 ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-xl text-base outline-none focus:border-blue-500 transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 bg-transparent border-none cursor-pointer text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="mb-6">
            <div className="relative flex items-center">
              <Lock size={20} className="absolute left-4 text-gray-500 z-10" />
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                className={`w-full py-4 pl-12 pr-12 border-2 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} rounded-xl text-base outline-none focus:border-blue-500 transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 bg-transparent border-none cursor-pointer text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
            </div>
          )}

          {currentStep < 3 ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-500 hover:-translate-y-1 hover:shadow-xl text-white border-none rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                Next Step
                <ArrowRight size={18} />
              </button>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 border-none rounded-xl text-sm font-medium transition-all"
                >
                  Back
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
                className={`w-full py-3 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-500 hover:-translate-y-1 hover:shadow-xl cursor-pointer'} text-white border-none rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all`}
              >
                {isLoading ? 'Creating Account...' : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 border-none rounded-xl text-sm font-medium transition-all"
              >
                Back
              </button>
            </div>
          )}

          <div className="text-center text-gray-600 text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-500 no-underline font-semibold hover:text-blue-600 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;