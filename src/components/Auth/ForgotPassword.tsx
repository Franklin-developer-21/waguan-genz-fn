import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { authAPI } from '../../services/api';

interface ForgotPasswordForm {
  email: string;
}

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await authAPI.forgotPassword(data.email);
      setIsLoading(false);
      setIsEmailSent(true);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Forgot password failed:', error.response?.data?.message || 'Failed to send reset email');
      alert(error.response?.data?.message || 'Failed to send reset email');
    }
  };

  if (isEmailSent) {
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Send size={40} color="white" />
          </div>
          
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#333',
            margin: '0 0 16px 0'
          }}>Check Your Email</h1>
          
          <p style={{
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.5',
            margin: '0 0 30px 0'
          }}>
            We've sent a password reset link to your email address. 
            Please check your inbox and follow the instructions.
          </p>

          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#667eea',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            <ArrowLeft size={20} />
            Back to Login
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
          }}>Forgot Password?</h1>
          <p style={{
            color: '#666',
            fontSize: '16px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            No worries! Enter your email address and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: '25px' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Mail size={20} style={{
                position: 'absolute',
                left: '15px',
                color: '#666',
                zIndex: 1
              }} />
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                placeholder="Enter your email address"
                style={{
                  width: '100%',
                  padding: '15px 15px 15px 50px',
                  border: errors.email ? '2px solid #ff4757' : '2px solid #f1f2f6',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = errors.email ? '#ff4757' : '#f1f2f6'}
              />
            </div>
            {errors.email && (
              <p style={{
                color: '#ff4757',
                fontSize: '14px',
                margin: '5px 0 0 0'
              }}>{errors.email.message}</p>
            )}
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
            {isLoading ? 'Sending...' : (
              <>
                Send Reset Link
                <Send size={20} />
              </>
            )}
          </button>

          <div style={{
            textAlign: 'center'
          }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;