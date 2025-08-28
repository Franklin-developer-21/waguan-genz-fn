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
  const ringingAudioRef = useRef<HTMLAudioElement | null>(null);

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
      setupPeerConnection();
    }

    // Manage ringing sound (only if user has interacted with page)
    if (callStatus === 'outgoing') {
      // Start ringing sound for outgoing calls
      if (!ringingAudioRef.current) {
        try {
          ringingAudioRef.current = new Audio('/ringing.mp3');
          ringingAudioRef.current.loop = true;
          ringingAudioRef.current.volume = 0.5;
          // Only play if user has interacted with the page
          ringingAudioRef.current.play().catch(() => {
            // Silently fail if autoplay is blocked
            console.log('Ringing sound blocked by browser autoplay policy');
          });
        } catch (error) {
          console.log('Could not create ringing audio');
        }
      }
    } else {
      // Stop ringing sound for connected/incoming calls
      if (ringingAudioRef.current) {
        ringingAudioRef.current.pause();
        ringingAudioRef.current = null;
      }
    }

    // Socket event listeners for WebRTC signaling
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('callAccepted', () => {
      console.log('Call accepted, starting WebRTC connection');
      // Stop ringing and start WebRTC connection when call is accepted
      if (ringingAudioRef.current) {
        try {
          ringingAudioRef.current.pause();
        } catch (error) {
          console.log('Error stopping ringing sound');
        }
        ringingAudioRef.current = null;
      }
      // Change status to connected when call is accepted
      if (onAcceptCall) {
        onAcceptCall();
      }
      console.log('About to create offer in 500ms');
      setTimeout(() => {
        console.log('Creating offer now');
        createOffer();
      }, 500);
    });
    
    socket.on('callRejected', () => {
      // Handle when the other user rejects the call
      if (ringingAudioRef.current) {
        try {
          ringingAudioRef.current.pause();
        } catch (error) {
          console.log('Error stopping ringing sound');
        }
        ringingAudioRef.current = null;
      }
      // Reset component state
      setCallDuration(0);
      setIsVideoEnabled(isVideoCall);
      setIsAudioEnabled(true);
      onEndCall();
    });
    
    socket.on('callEnded', () => {
      // Handle when the other user ends the call
      // Reset component state
      setCallDuration(0);
      setIsVideoEnabled(isVideoCall);
      setIsAudioEnabled(true);
      onEndCall();
    });

    return () => {
      if (timer) clearInterval(timer);
      // Stop ringing sound
      if (ringingAudioRef.current) {
        ringingAudioRef.current.pause();
        ringingAudioRef.current = null;
      }
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
      socket.off('callAccepted');
      socket.off('callRejected');
      socket.off('callEnded');
    };
  }, [callStatus]);

  const initializeMedia = async () => {
    try {
      // Check if peer connection is still valid
      if (!peerConnectionRef.current || peerConnectionRef.current.connectionState === 'closed') {
        console.log('Peer connection is closed, skipping media initialization');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall ? { width: 1280, height: 720 } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current && isVideoCall) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Add stream to peer connection after it's created
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'closed') {
        stream.getTracks().forEach(track => {
          console.log('Adding local track:', track.kind, track.enabled, track.readyState);
          peerConnectionRef.current?.addTrack(track, stream);
        });
        console.log('Local stream tracks added to peer connection');
      }
    } catch (error) {
      console.error('Failed to access camera/microphone:', error);
      // Don't show alert if peer connection is closed (component unmounting)
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'closed') {
        alert('Unable to access camera or microphone. Please check permissions.');
      }
    }
  };

  const setupPeerConnection = async () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    // Debug connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnectionRef.current?.connectionState);
    };
    
    peerConnectionRef.current.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnectionRef.current?.iceConnectionState);
    };
    
    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote stream:', event.streams[0]);
      const remoteStream = event.streams[0];
      
      // Debug track info
      console.log('Remote stream tracks:', remoteStream.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted
      })));
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.volume = 1.0;
        remoteVideoRef.current.muted = false;
        
        // Ensure audio tracks are enabled
        remoteStream.getAudioTracks().forEach(track => {
          console.log('Remote audio track:', track.enabled, track.readyState);
          track.enabled = true;
        });
        
        // Force play for audio with user interaction
        setTimeout(() => {
          const playPromise = remoteVideoRef.current?.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('Remote audio playing successfully');
            }).catch(error => {
              console.log('Autoplay failed, trying to enable audio on user interaction:', error);
              // Try to play on next user interaction
              const enableAudio = () => {
                remoteVideoRef.current?.play();
                document.removeEventListener('click', enableAudio);
                document.removeEventListener('touchstart', enableAudio);
              };
              document.addEventListener('click', enableAudio);
              document.addEventListener('touchstart', enableAudio);
            });
          }
        }, 100);
      }
    };
    
    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && recipientId) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: recipientId,
          from: currentUser.id
        });
      }
    };
    
    // Initialize media first, then add to peer connection
    await initializeMedia();
  };
  
  const handleOffer = async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
    console.log('Received offer from:', data.from);
    if (!peerConnectionRef.current) return;
    
    await peerConnectionRef.current.setRemoteDescription(data.offer);
    console.log('Set remote description (offer)');
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    console.log('Created and set local description (answer)');
    
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    socket.emit('answer', {
      answer: peerConnectionRef.current.localDescription,
      to: data.from,
      from: currentUser.id
    });
    console.log('Sent answer to:', data.from);
  };
  
  const handleAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
    console.log('Received answer');
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(data.answer);
    console.log('Set remote description (answer)');
  };
  
  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
    console.log('Received ICE candidate');
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.addIceCandidate(data.candidate);
    console.log('Added ICE candidate');
  };
  
  const createOffer = async () => {
    console.log('Creating offer for recipient:', recipientId);
    if (!peerConnectionRef.current || !recipientId) return;
    
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    console.log('Created and set local description (offer)');
    
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    socket.emit('offer', {
      offer: peerConnectionRef.current.localDescription,
      to: recipientId,
      from: currentUser.id
    });
    console.log('Sent offer to:', recipientId);
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
    console.log('Accepting call, recipient ID:', recipientId);
    // Stop any ringing sound
    if (ringingAudioRef.current) {
      ringingAudioRef.current.pause();
      ringingAudioRef.current = null;
    }
    
    if (recipientId) {
      socket.emit('answerCall', { signal: null, to: recipientId });
      console.log('Emitted answerCall to:', recipientId);
    }
    if (onAcceptCall) {
      onAcceptCall();
    }
  };

  const handleRejectCall = () => {
    // Cleanup immediately to prevent further operations
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Reset component state
    setCallDuration(0);
    setIsVideoEnabled(isVideoCall);
    setIsAudioEnabled(true);
    
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
    // Cleanup media and peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Reset component state
    setCallDuration(0);
    setIsVideoEnabled(isVideoCall);
    setIsAudioEnabled(true);
    
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
          <>
            <audio
              ref={remoteVideoRef}
              autoPlay
              playsInline
              controls={false}
              preload="auto"
              style={{ display: 'none' }}
            />
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
          </>
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