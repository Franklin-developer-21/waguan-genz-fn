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
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Only start timer for connected calls
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    // Initialize media stream and WebRTC
    if (callStatus === 'connected' || callStatus === 'incoming') {
      initializeMedia();
      setupPeerConnection();
    }

    // Socket event listeners for WebRTC signaling
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      if (timer) clearInterval(timer);
      // Cleanup media streams and peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [callStatus]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall ? { width: 1280, height: 720 } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current && isVideoCall) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Add stream to peer connection if it exists
      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }
    } catch (error) {
      console.error('Failed to access camera/microphone:', error);
      alert('Unable to access camera or microphone. Please check permissions.');
    }
  };

  const setupPeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    
    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && recipientId) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: recipientId
        });
      }
    };
    
    // Add local stream if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
      });
    }
  };
  
  const handleOffer = async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
    if (!peerConnectionRef.current) return;
    
    await peerConnectionRef.current.setRemoteDescription(data.offer);
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    
    socket.emit('answer', {
      answer,
      to: data.from
    });
  };
  
  const handleAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(data.answer);
  };
  
  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.addIceCandidate(data.candidate);
  };
  
  const createOffer = async () => {
    if (!peerConnectionRef.current || !recipientId) return;
    
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    
    socket.emit('offer', {
      offer,
      to: recipientId
    });
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
      }
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
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

  const handleAcceptCall = async () => {
    if (recipientId) {
      socket.emit('answerCall', { signal: null, to: recipientId });
      // Create WebRTC offer after accepting
      setTimeout(() => createOffer(), 1000);
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