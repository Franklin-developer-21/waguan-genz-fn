import { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import socket from '../../services/socket';

interface VideoCallProps {
  isVideoCall: boolean;
  recipientName: string;
  recipientId?: string;
  callStatus?: 'incoming' | 'outgoing' | 'connected';
  onEndCall: () => void;
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
}

const VideoCall = ({ 
  isVideoCall, 
  recipientName, 
  recipientId, 
  callStatus = 'connected',
  onEndCall,
  onAcceptCall,
  onRejectCall 
}: VideoCallProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Only start timer for connected calls
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    // Initialize media stream
    if (callStatus === 'connected' || callStatus === 'incoming') {
      initializeMedia();
    }

    return () => {
      if (timer) clearInterval(timer);
      // Cleanup media streams
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [callStatus]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall ? { width: 1280, height: 720 } : false,
        audio: true
      });
      
      if (localVideoRef.current && isVideoCall) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to access camera/microphone:', error);
      alert('Unable to access camera or microphone. Please check permissions.');
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
      }
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
      }
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAcceptCall = () => {
    if (recipientId) {
      socket.emit('answerCall', { signal: null, to: recipientId });
    }
    if (onAcceptCall) {
      onAcceptCall();
    }
  };

  const handleRejectCall = () => {
    if (recipientId) {
      socket.emit('rejectCall', { to: recipientId });
    }
    if (onRejectCall) {
      onRejectCall();
    } else {
      onEndCall();
    }
  };

  const handleEndCall = () => {
    if (recipientId) {
      socket.emit('endCall', { to: recipientId });
    }
    onEndCall();
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'incoming':
        return 'Incoming call...';
      case 'outgoing':
        return 'Calling...';
      case 'connected':
        return formatDuration(callDuration);
      default:
        return formatDuration(callDuration);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 text-white">
        <div>
          <h2 className="text-lg font-semibold">{recipientName}</h2>
          <p className="text-sm opacity-75">
            {getStatusText()}
          </p>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {isVideoCall ? (
          <>
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            
            {/* Local Video */}
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            </div>

            {/* Incoming call overlay for video calls */}
            {callStatus === 'incoming' && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-32 h-32 rounded-full bg-white bg-opacity-20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-bold">
                      {recipientName[0].toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">{recipientName}</h2>
                  <p className="text-lg opacity-75">Incoming video call...</p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Audio Call UI */
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-indigo-500 to-purple-600">
            <div className="text-center text-white">
              <div className="w-32 h-32 rounded-full bg-white bg-opacity-20 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl font-bold">
                  {recipientName[0].toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">{recipientName}</h2>
              <p className="text-lg opacity-75">
                {getStatusText()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 p-6 bg-black bg-opacity-50">
        {callStatus === 'incoming' ? (
          /* Incoming call controls */
          <>
            <button
              onClick={handleRejectCall}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={handleAcceptCall}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow-lg"
            >
              {isVideoCall ? <Video size={24} /> : <Phone size={24} />}
            </button>
          </>
        ) : (
          /* Connected/Outgoing call controls */
          <>
            {isVideoCall && callStatus === 'connected' && (
              <button
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isVideoEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'
                } text-white transition-colors shadow-lg`}
              >
                {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
            )}
            
            {callStatus === 'connected' && (
              <button
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isAudioEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'
                } text-white transition-colors shadow-lg`}
              >
                {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
            )}
            
            <button
              onClick={callStatus === 'outgoing' ? handleRejectCall : handleEndCall}
              className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
            >
              <PhoneOff size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoCall;