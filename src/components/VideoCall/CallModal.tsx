import { useState, useEffect, useRef } from 'react';
import { Phone, Video, X } from 'lucide-react';
import ringing from '../../assets/sounds/Ringing.mp3';
import callingSound from '../../assets/sounds/videocall.mp3';

interface CallModalProps {
  type: 'incoming' | 'outgoing';
  isVideoCall: boolean;
  recipientName: string;
  onAccept: () => void;
  onDecline: () => void;
}

const CallModal = ({ type, isVideoCall, recipientName, onAccept, onDecline }: CallModalProps) => {
  const [dots, setDots] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Animate dots for calling state
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Auto-reject timer for incoming calls
    let rejectTimer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;
   
    if (type === 'incoming') {
      countdownInterval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onDecline();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
     
      rejectTimer = setTimeout(() => {
        onDecline();
      }, 30000);
    }

    // Play sound with proper error handling
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Audio play failed:', error);
          }
        });
      }
    }

    return () => {
      clearInterval(dotsInterval);
      clearInterval(countdownInterval);
      clearTimeout(rejectTimer);
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch (error) {
          // Ignore errors when stopping audio
        }
      }
    };
  }, [type, onDecline]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm mx-4 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">
            {recipientName[0].toUpperCase()}
          </span>
        </div>
       
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {recipientName}
        </h3>
       
        <p className="text-gray-600 mb-2">
          {type === 'incoming'
            ? `Incoming ${isVideoCall ? 'video' : 'voice'} call...`
            : `${isVideoCall ? 'Video' : 'Voice'} calling${dots}`
          }
        </p>
       
        {type === 'incoming' && (
          <p className="text-sm text-gray-500 mb-4">
            Auto-reject in {timeLeft}s
          </p>
        )}
        
        <audio ref={audioRef} loop>
          <source src={type === 'incoming' ? ringing : callingSound} type="audio/mpeg" />
        </audio>
       
        <div className="flex justify-center gap-4">
          {type === 'incoming' ? (
            <>
              <button
                onClick={onDecline}
                className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
              >
                <X size={24} />
              </button>
              <button
                onClick={onAccept}
                className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
              >
                {isVideoCall ? <Video size={24} /> : <Phone size={24} />}
              </button>
            </>
          ) : (
            <button
              onClick={onDecline}
              className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;