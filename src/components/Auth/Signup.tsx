import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { authAPI } from '../../services/api';

interface SignupForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Signup = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignupForm>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const password = watch('password');

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      await authAPI.register(data.username, data.email, data.password);
      setIsLoading(false);
      alert('Account created successfully! Please login.');
      navigate('/login');
    } catch (error: any) {
      setIsLoading(false);
      console.error('Signup failed:', error.response?.data?.message || 'Signup failed');
      alert(error.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600 text-base">Join our community today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-5">
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
                className={`w-full py-4 pl-12 pr-4 border-2 ${errors.username ? 'border-red-500' : 'border-gray-200'} rounded-xl text-base outline-none focus:border-blue-500 transition-colors`}
              />
            </div>
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>

          <div className="mb-5">
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
                className={`w-full py-4 pl-12 pr-4 border-2 ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl text-base outline-none focus:border-blue-500 transition-colors`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
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

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:-translate-y-1 hover:shadow-lg cursor-pointer'} text-white border-none rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all mb-5`}
          >
            {isLoading ? 'Creating Account...' : (
              <>
                Create Account
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <div className="text-center text-gray-600 text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-500 no-underline font-semibold hover:text-blue-600 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;