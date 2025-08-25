import { useState, useEffect, useRef } from 'react';
import { Search, Send, Phone, Video, Smile, ArrowLeft } from 'lucide-react';
import { messagesAPI, usersAPI, callAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import VideoCall from '../VideoCall/VideoCall';
import CallModal from '../VideoCall/CallModal';
import socket from '../../services/socket';
import messageSound from '../../assets/sounds/messageSound.mp3';
import ringing from '../../assets/sounds/Ringing.mp3';

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: 'me' | 'other';
}

// Utility function to generate consistent chat ID
const generateChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

function Chat() {
  const { user } = useAuth();
  const [followedUsers, setFollowedUsers] = useState<ChatUser[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showCall, setShowCall] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [callModalType, setCallModalType] = useState<'incoming' | 'outgoing'>('outgoing');
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<{[key: string]: number}>({});
  const [lastMessages, setLastMessages] = useState<{[key: string]: string}>({});
  const [incomingCallData, setIncomingCallData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchFollowedUsers();
    
    // Handle window resize for responsive behavior
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowSidebar(!selectedChat);
      } else {
        setShowSidebar(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // When user connects, emit userOnline
    if (user) {
      socket.emit('userOnline', user.id);
      console.log('User online - User ID:', user.id, 'Socket ID:', socket.id);
    }
    
    if (selectedChat && user) {
      // Create consistent chat ID for both users
      const chatId = generateChatId(user.id, selectedChat.id);
      fetchMessages(chatId);
      socket.emit('joinChat', chatId);
      console.log('Joining chat room:', chatId);
      
      // Clear unread count for selected chat
      setUnreadCounts(prev => ({
        ...prev,
        [selectedChat.id]: 0
      }));
      
      // On mobile, hide sidebar when chat is selected
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    }

    socket.on('receiveMessage', (newMessage) => {
      console.log('Received message:', newMessage);
      
      // Only add messages from other users to prevent duplicates
      if (newMessage.userId !== user?.id) {
        setMessages(prev => {
          const messageExists = prev.some(msg => msg.id === newMessage._id);
          if (!messageExists) {
            const formattedMessage: Message = {
              id: newMessage._id || Date.now().toString(),
              text: newMessage.text,
              timestamp: new Date(newMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sender: 'other'
            };
            console.log('Adding message from other user:', formattedMessage);
            
            // Update unread count if not in current chat
            if (!selectedChat || selectedChat.id !== newMessage.userId) {
              setUnreadCounts(prev => ({
                ...prev,
                [newMessage.userId]: (prev[newMessage.userId] || 0) + 1
              }));
            }
            
            // Update last message for this user
            setLastMessages(prev => ({
              ...prev,
              [newMessage.userId]: newMessage.text
            }));
            
            return [...prev, formattedMessage];
          }
          return prev;
        });
      }
      
      // Play message sound for received messages (only from others)
      if (newMessage.userId !== user?.id) {
        const audio = new Audio(messageSound);
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            if (error.name !== 'AbortError') {
              console.error('Message sound failed:', error);
            }
          });
        }
      }
    });

    socket.on('callUser', (data) => {
      console.log('Received callUser event:', data);
      const { callType } = data;
      setIncomingCallData(data); // Store caller data
      setCallType(callType);
      setCallModalType('incoming');
      setShowCallModal(true);
      
      // Play ringing sound for incoming calls
      const audio = new Audio(ringing);
      audio.loop = true;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Ringing sound failed:', error);
          }
        });
      }
      setCurrentAudio(audio);
    });

    socket.on('callAccepted', (data) => {
      console.log('Received callAccepted event:', data);
      if (currentAudio) {
        try {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        } catch (error) {
          // Ignore errors when stopping audio
        }
        setCurrentAudio(null);
      }
      setShowCallModal(false);
      setShowCall(true);
    });

    socket.on('callRejected', () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }
      setShowCallModal(false);
    });

    socket.on('callEnded', () => {
      setShowCall(false);
    });

    socket.on('callFailed', ({ message }) => {
      console.log('Call failed:', message);
      setShowCallModal(false);
      alert(`Call failed: ${message}`);
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('callUser');
      socket.off('callAccepted');
      socket.off('callRejected');
      socket.off('callEnded');
      socket.off('callFailed');
    };
  }, [selectedChat, user]);

  const fetchFollowedUsers = async () => {
    console.log("last message",lastMessages)
    try {
      const response = await usersAPI.getFollowing();
      const chatUsers = response.data.map((u: any) => ({
        id: u._id,
        name: u.username,
        avatar: u.username.substring(0, 2).toUpperCase(),
        lastMessage: lastMessages[u._id] || 'Start a conversation',
        timestamp: 'now',
        unread: unreadCounts[u._id] || 0,
        online: u.isActive || false
      }));
      setFollowedUsers(chatUsers);
      if (chatUsers.length > 0 && !selectedChat) {
        setSelectedChat(chatUsers[0]);
      }
    } catch (error) {
      console.error('Failed to fetch followed users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    setLoading(true);
    try {
      // Try new format first
      let response = await messagesAPI.getMessages(chatId);
      // If no messages found with new format, try old formats (individual user IDs)
      if (response.data.length === 0 && selectedChat && user) {
        console.log('No messages with new format, trying old formats...');
        try {
          const response1 = await messagesAPI.getMessages(user.id);
          const response2 = await messagesAPI.getMessages(selectedChat.id);
          // Get all messages where either user is involved
          const allMessages = [...response1.data, ...response2.data];
          console.log('All messages from both queries:', allMessages);
          
          const combinedMessages = allMessages
            .filter((msg: any, index: number, array: any[]) => {
              // Remove duplicates based on _id
              const firstIndex = array.findIndex(m => m._id === msg._id);
              if (firstIndex !== index) return false;
              
              // Include messages between these two users
              const isConversationMessage = 
                (msg.userId === user.id && msg.chatId === selectedChat.id) ||
                (msg.userId === selectedChat.id && msg.chatId === user.id) ||
                (msg.chatId === user.id && msg.userId === selectedChat.id) ||
                (msg.chatId === selectedChat.id && msg.userId === user.id);
              
              return isConversationMessage;
            })
            .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          response = { 
            data: combinedMessages,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
          } as any;
          console.log('Found messages with old format:', combinedMessages);
        } catch (oldFormatError) {
          console.log('Old format also failed:', oldFormatError);
        }
      }
      
      const formattedMessages: Message[] = response.data.map((msg: any) => ({
        id: msg._id,
        text: msg.text,
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: msg.userId === user?.id ? 'me' as const : 'other' as const
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat || !user) return;
    
    try {
      // Create the message via API with consistent chat ID
      const chatId = generateChatId(user.id, selectedChat.id);
      const response = await messagesAPI.createMessage(chatId, message);
      
      // Add the message to the UI immediately from the API response
      const newMessage = {
        id: response.data._id,
        text: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: 'me' as const
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Update last message for this chat
      setLastMessages(prev => ({
        ...prev,
        [selectedChat.id]: message
      }));
      
      setMessage('');
      
      // Emit the socket event for other users
      socket.emit('sendMessage', {
        chatId: chatId,
        userId: user.id,
        text: message,
        timestamp: new Date()
      });
      console.log('Sending message to chat:', chatId);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const initiateCall = async (type: 'video' | 'audio') => {
    if (!selectedChat || !user) return;
    
    try {
      await callAPI.initiateCall(selectedChat.id, type);
      setCallType(type);
      setCallModalType('outgoing');
      setShowCallModal(true);
      
      socket.emit('callUser', {
        userToCall: selectedChat.id,
        signalData: null,
        from: user.id,
        name: user.username,
        callType: type
      });
      console.log('Emitting callUser event:', {
        userToCall: selectedChat.id,
        from: user.id,
        name: user.username,
        callType: type
      });
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleSelectChat = (chat: ChatUser) => {
    setSelectedChat(chat);
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleBackToChats = () => {
    setSelectedChat(null);
    if (window.innerWidth < 768) {
      setShowSidebar(true);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 relative overflow-hidden">
      {/* Chat Sidebar */}
      <div 
        className={`bg-white border-r border-gray-200 flex-col transition-all duration-300 ease-in-out
          ${showSidebar ? 'flex w-full md:w-80' : 'hidden md:flex md:w-80'} 
          absolute md:relative h-full z-10`}
      >
        {/* Search Header */}
        <div className="p-4 md:p-5 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Messages</h2>
            <button 
              onClick={toggleSidebar}
              className="md:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full py-2 md:py-3 pl-12 pr-4 border border-gray-200 rounded-full text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {usersLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-600">Loading chats...</div>
            </div>
          ) : followedUsers.length > 0 ? (
            followedUsers.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`p-3 md:p-4 border-b border-gray-100 cursor-pointer ${selectedChat?.id === chat.id ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'} flex items-center gap-3 transition-colors`}
            >
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm md:text-base">
                  {chat.avatar}
                </div>
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full border-2 border-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm md:text-base font-semibold text-gray-800 truncate">{chat.name}</h4>
                  <span className="text-xs text-gray-500">{chat.timestamp}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-xs md:text-sm text-gray-600 truncate flex-1">{chat.lastMessage}</p>
                  
                  {chat.unread > 0 && (
                    <div className="bg-blue-500 text-white rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-xs font-semibold ml-2">
                      {chat.unread}
                    </div>
                  )}
                </div>
              </div>
            </div>
            ))
          ) : (
            <div className="text-center py-8 md:py-12 px-4">
              <p className="text-gray-600 mb-2 md:mb-4">No conversations yet</p>
              <p className="text-xs md:text-sm text-gray-500">Follow people to start chatting with them</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex-col bg-white ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-3 md:p-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  onClick={handleBackToChats}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full mr-2"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm md:text-base">
                      {selectedChat.avatar}
                    </div>
                    {selectedChat.online && (
                      <div className="absolute bottom-0 right-0 w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-800">{selectedChat.name}</h3>
                    <p className={`text-xs md:text-sm ${selectedChat.online ? 'text-blue-500' : 'text-gray-500'}`}>
                      {selectedChat.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-1 md:gap-2">
                <button 
                  onClick={() => initiateCall('audio')}
                  className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Phone size={18} className="md:w-5 md:h-5" />
                </button>
                <button 
                  onClick={() => initiateCall('video')}
                  className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Video size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-3 md:p-5 overflow-y-auto bg-gray-50">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-gray-600">Loading messages...</div>
                </div>
              ) : messages.length > 0 ? (
                <>
                  {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} mb-3 md:mb-4`}
                  >
                    <div className={`max-w-xs md:max-w-xl px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-sm ${
                      msg.sender === 'me' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-800'
                    }`}>
                      <p className="text-sm leading-relaxed mb-1">{msg.text}</p>
                      <span className={`text-xs ${msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 p-4">
                    <div className="text-4xl md:text-6xl mb-2 md:mb-4">💬</div>
                    <p className="text-sm md:text-base font-medium mb-1 md:mb-2">No messages yet</p>
                    <p className="text-xs md:text-sm">Start a conversation with {selectedChat.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-3 md:p-5 pb-16 md:pb-5 border-t border-gray-200 bg-white safe-area-pb">
              <div className="flex items-center gap-2 md:gap-3 bg-gray-50 rounded-full px-3 md:px-4 py-2">
                <button className="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                  <Smile size={18} className="md:w-5 md:h-5" />
                </button>
                
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none outline-none text-sm py-1 md:py-2 min-w-0"
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors ${
                    message.trim() 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
            <div className="text-center">
              <div className="text-4xl md:text-6xl mb-2 md:mb-4">💬</div>
              <p className="text-sm md:text-lg font-medium mb-1 md:mb-2">Welcome to Messages</p>
              <p className="text-xs md:text-sm">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Call Modal */}
      {showCallModal && selectedChat && (
        <CallModal
          type={callModalType}
          isVideoCall={callType === 'video'}
          recipientName={selectedChat.name}
          onAccept={() => {
            if (currentAudio) {
              currentAudio.pause();
              currentAudio.currentTime = 0;
              setCurrentAudio(null);
            }
            // Use the caller's ID from incoming call data
            const callerId = incomingCallData?.from || selectedChat.id;
            socket.emit('answerCall', { signal: null, to: callerId });
            console.log('Emitting answerCall event to user ID:', callerId);
            console.log('My socket ID:', socket.id);
            setShowCallModal(false);
            setShowCall(true);
          }}
          onDecline={() => {
            if (currentAudio) {
              currentAudio.pause();
              currentAudio.currentTime = 0;
              setCurrentAudio(null);
            }
            // Use the caller's ID from incoming call data
            const callerId = incomingCallData?.from || selectedChat.id;
            socket.emit('rejectCall', { to: callerId });
            console.log('Rejecting call from:', callerId);
            setShowCallModal(false);
          }}
        />
      )}
      
      {/* Video/Audio Call */}
      {showCall && selectedChat && (
        <VideoCall
          isVideoCall={callType === 'video'}
          recipientName={selectedChat.name}
          recipientId={selectedChat.id}
          onEndCall={() => {
            // Emit endCall event to the other user
            const otherUserId = incomingCallData?.from || selectedChat.id;
            socket.emit('endCall', { to: otherUserId });
            console.log('Ending call with user:', otherUserId);
            setShowCall(false);
          }}
        />
      )}
    </div>
  );
}

export default Chat;