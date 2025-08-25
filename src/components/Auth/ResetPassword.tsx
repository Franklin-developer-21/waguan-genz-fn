import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { authAPI } from '../../services/api';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const ResetPassword = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordForm>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const password = watch('password');
  const token = searchParams.get('token');

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      await authAPI.resetPassword(token!, data.password);
      setIsLoading(false);
      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Reset password failed:', error.response?.data?.message || 'Failed to reset password');
      alert(error.response?.data?.message || 'Failed to reset password');
    }
  };

  if (isSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#2ed573',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <CheckCircle size={40} color="white" />
          </div>
          
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#333',
            margin: '0 0 16px 0'
          }}>Password Reset Successful!</h1>
          
          <p style={{
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.5',
            margin: '0 0 30px 0'
          }}>
            Your password has been successfully reset. 
            You will be redirected to the login page in a few seconds.
          </p>

          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textDecoration: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Go to Login
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#333',
            margin: '0 0 8px 0'
          }}>Reset Password</h1>
          <p style={{
            color: '#666',
            fontSize: '16px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Lock size={20} style={{
                position: 'absolute',
                left: '15px',
                color: '#666',
                zIndex: 1
              }} />
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase and number'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                style={{
                  width: '100%',
                  padding: '15px 50px 15px 50px',
                  border: errors.password ? '2px solid #ff4757' : '2px solid #f1f2f6',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = errors.password ? '#ff4757' : '#f1f2f6'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p style={{
                color: '#ff4757',
                fontSize: '14px',
                margin: '5px 0 0 0'
              }}>{errors.password.message}</p>
            )}
          </div>

          <div style={{ marginBottom: '25px' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Lock size={20} style={{
                position: 'absolute',
                left: '15px',
                color: '#666',
                zIndex: 1
              }} />
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                style={{
                  width: '100%',
                  padding: '15px 50px 15px 50px',
                  border: errors.confirmPassword ? '2px solid #ff4757' : '2px solid #f1f2f6',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = errors.confirmPassword ? '#ff4757' : '#f1f2f6'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p style={{
                color: '#ff4757',
                fontSize: '14px',
                margin: '5px 0 0 0'
              }}>{errors.confirmPassword.message}</p>
            )}
          </div>

          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '25px'
          }}>
            <p style={{
              fontSize: '12px',
              color: '#666',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Password must contain:
            </p>
            <ul style={{
              fontSize: '12px',
              color: '#666',
              margin: '5px 0 0 0',
              paddingLeft: '20px'
            }}>
              <li>At least 8 characters</li>
              <li>One uppercase letter</li>
              <li>One lowercase letter</li>
              <li>One number</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '15px',
              background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.2s',
              marginBottom: '20px'
            }}
                onMouseEnter={(e) => !isLoading && ((e.target as HTMLElement).style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.transform = 'translateY(0)')}
          >
            {isLoading ? 'Resetting Password...' : (
              <>
                Reset Password
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <div style={{
            textAlign: 'center'
          }}>
            <Link
              to="/login"
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;