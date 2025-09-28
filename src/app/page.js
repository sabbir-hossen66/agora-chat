"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Send, 
  MessageSquare,
  Wifi,
  WifiOff,
  Edit3,
  Search,
  User
} from "lucide-react";
import AgoraChat from "agora-chat";
import ChatHeader from "@/components/ChatHeader";
import TypingIndicator from "@/components/TypingIndicator";
import LoginPanel from "@/components/LoginPanel";

const APP_KEY = "611402009#1605378";

export default function ChatPage() {
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [peerId, setPeerId] = useState("");
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [typingTimer, setTypingTimer] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const chatClient = useRef(null);

  const addLog = (log, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prevLogs) => [...prevLogs, { message: log, type, timestamp }]);
  };

  const handleLogin = async () => {
    if (!userId.trim() || !token.trim()) {
      addLog("Please enter both username and token", "error");
      return;
    }

    setIsConnecting(true);
    try {
      addLog(`Connecting as ${userId}...`, "info");
      
      await chatClient.current?.open({
        user: userId,
        accessToken: token,
      });
      
    } catch (error) {
      addLog(`Connection failed: ${error.message}`, "error");
      setIsConnecting(false);
    }
  };

  const handleTyping = async (value) => {
    setMessage(value);
    
    if (!peerId.trim() || !isLoggedIn) return;

    try {
      if (value.trim()) {
        const typingMsg = AgoraChat.message.create({
          type: "txt",
          to: peerId,
          msg: "%%TYPING_START%%",
          chatType: "singleChat",
        });
        await chatClient.current?.send(typingMsg);

        if (typingTimer) {
          clearTimeout(typingTimer);
        }

        const timer = setTimeout(async () => {
          try {
            const typingEndMsg = AgoraChat.message.create({
              type: "txt", 
              to: peerId,
              msg: "%%TYPING_END%%",
              chatType: "singleChat",
            });
            await chatClient.current?.send(typingEndMsg);
          } catch (error) {
            console.log("Typing end error:", error);
          }
        }, 3000);

        setTypingTimer(timer);
      }
    } catch (error) {
      console.log("Typing indicator error:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      addLog("Please enter a message", "error");
      return;
    }
    
    if (!peerId.trim()) {
      addLog("Please enter recipient username", "error");
      return;
    }

    try {
      // Clear typing indicator
      if (typingTimer) {
        clearTimeout(typingTimer);
        setTypingTimer(null);
        
        const typingEndMsg = AgoraChat.message.create({
          type: "txt",
          to: peerId,
          msg: "%%TYPING_END%%", 
          chatType: "singleChat",
        });
        await chatClient.current?.send(typingEndMsg);
      }

      const msg = AgoraChat.message.create({
        type: "txt",
        to: peerId,
        msg: message,
        chatType: "singleChat",
      });

      await chatClient.current?.send(msg);
      addLog(`To ${peerId}: ${message}`, "sent");
      
      // Update conversation list
      updateConversationList();
      
      setMessage("");
      
    } catch (error) {
      addLog(`Failed to send message: ${error.message}`, "error");
    }
  };

  const handleLogout = () => {
    if (typingTimer) {
      clearTimeout(typingTimer);
      setTypingTimer(null);
    }
    
    chatClient.current?.close();
    setIsLoggedIn(false);
    setUserId("");
    setToken("");
    setPeerId("");
    setMessage("");
    setTypingUsers(new Set());
    setConversations([]);
    addLog("Disconnected from chat", "info");
  };

  // Fetch and update conversation list
  const updateConversationList = async () => {
    if (!isLoggedIn || !chatClient.current) return;

    try {
      const convList = await chatClient.current.getConversationlist();
      const formattedConversations = await Promise.all(
        convList.map(async (conv) => {
          // Get last message for each conversation
          const messages = await chatClient.current.getHistoryMessages({
            targetId: conv.conversationId,
            chatType: conv.type,
            pageSize: 1,
            cursor: -1
          });

          const lastMessage = messages.messages && messages.messages.length > 0 
            ? messages.messages[0] 
            : null;

          return {
            id: conv.conversationId,
            username: conv.conversationId,
            unreadCount: conv.unreadMessageCount || 0,
            lastMessage: lastMessage ? {
              text: lastMessage.msg,
              time: lastMessage.time,
              type: lastMessage.direction
            } : null,
            timestamp: lastMessage?.time || Date.now()
          };
        })
      );

      // Sort by timestamp (newest first)
      formattedConversations.sort((a, b) => b.timestamp - a.timestamp);
      setConversations(formattedConversations);
    } catch (error) {
      console.error("Error updating conversation list:", error);
    }
  };

  // Handle conversation click
  const handleConversationClick = (username) => {
    setPeerId(username);
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!APP_KEY) {
      addLog("Missing APP_KEY configuration", "error");
      return;
    }

    // Initialize Agora Chat
    chatClient.current = new AgoraChat.connection({
      appKey: APP_KEY,
    });

    const eventHandlers = {
      onConnected: () => {
        setIsLoggedIn(true);
        setIsConnecting(false);
        addLog(`Successfully connected as ${userId}`, "success");
        
        // Load conversations after connection
        setTimeout(() => {
          updateConversationList();
        }, 1000);
      },
      
      onDisconnected: () => {
        setIsLoggedIn(false);
        setIsConnecting(false);
        addLog("Disconnected from chat server", "info");
      },
      
      onTextMessage: (msg) => {
        if (msg.msg === "%%TYPING_START%%") {
          setTypingUsers(prev => new Set([...prev, msg.from]));
          
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(msg.from);
              return newSet;
            });
          }, 5000);
          
        } else if (msg.msg === "%%TYPING_END%%") {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(msg.from);
            return newSet;
          });
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(msg.from);
            return newSet;
          });
          
          // Check if this might be a delivered offline message
          const currentTime = Date.now();
          const messageTime = msg.time || currentTime;
          const isOfflineMessage = (currentTime - messageTime) > 10000;
          
          if (isOfflineMessage) {
            addLog(`${msg.from} (offline): ${msg.msg}`, "received");
          } else {
            addLog(`${msg.from}: ${msg.msg}`, "received");
          }

          // Update conversation list when new message received
          updateConversationList();
        }
      },
      
      onError: (error) => {
        console.error("Chat error:", error);
        setIsConnecting(false);
        addLog(`Connection error: ${error.message || error}`, "error");
        
        if (error.type === 2) {
          addLog("Authentication failed - Check your credentials", "error");
        }
      },
      
      onTokenWillExpire: () => {
        addLog("Token will expire soon - Please refresh", "warning");
      },
      
      onTokenExpired: () => {
        addLog("Token expired - Please refresh", "error");
        setIsLoggedIn(false);
      },
    };

    // Add all event handlers
    chatClient.current.addEventHandler("connection&message", eventHandlers);

    return () => {
      // Cleanup event handlers
      chatClient.current?.removeEventHandler("connection&message");
    };
  }, [userId]);

  // Avatar component
  const MessageAvatar = ({ type, username, size = "md" }) => {
    const isReceived = type === 'received';
    const avatarColor = isReceived ? 'bg-purple-500' : 'bg-blue-500';
    const sizeClass = size === "sm" ? "w-8 h-8" : "w-10 h-10";
    const textSize = size === "sm" ? "text-sm" : "text-base";
    const initial = username ? username.charAt(0).toUpperCase() : (isReceived ? 'R' : 'Y');
    
    return (
      <div className={`${sizeClass} ${avatarColor} rounded-full flex items-center justify-center text-white ${textSize} font-medium flex-shrink-0`}>
        {initial}
      </div>
    );
  };

  // Format time for conversations
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <ChatHeader isLoggedIn={isLoggedIn} userId={userId} />
      
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Login & Conversations */}
          <div className="lg:col-span-1 space-y-6">
            {/* Login Panel */}
            <LoginPanel
              isLoggedIn={isLoggedIn}
              userId={userId}
              setUserId={setUserId}
              token={token}
              setToken={setToken}
              peerId={peerId}
              setPeerId={setPeerId}
              isConnecting={isConnecting}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />

            {/* Conversations List */}
            {isLoggedIn && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Conversations</h3>
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {conversations.length}
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Conversations */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs">Start a chat to see conversations here</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleConversationClick(conversation.username)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          peerId === conversation.username
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <MessageAvatar 
                            type="received" 
                            username={conversation.username} 
                            size="sm" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 truncate">
                                {conversation.username}
                              </h4>
                              {conversation.lastMessage && (
                                <span className="text-xs text-gray-500">
                                  {formatTime(conversation.lastMessage.time)}
                                </span>
                              )}
                            </div>
                            {conversation.lastMessage && (
                              <p className="text-sm text-gray-600 truncate">
                                {conversation.lastMessage.text}
                              </p>
                            )}
                            {conversation.unreadCount > 0 && (
                              <div className="flex justify-end">
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                  {conversation.unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {peerId ? (
                      <>
                        <MessageAvatar type="received" username={peerId} />
                        <div>
                          <h2 className="font-semibold text-gray-800">{peerId}</h2>
                          <p className="text-sm text-gray-500">
                            {typingUsers.has(peerId) ? "typing..." : "Online"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-800">Select a conversation</h2>
                          <p className="text-sm text-gray-500">Choose a user to start chatting</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isLoggedIn ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Wifi className="w-4 h-4" />
                        <span className="text-sm font-medium">Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-gray-500">
                        <WifiOff className="w-4 h-4" />
                        <span className="text-sm font-medium">Offline</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {logs.length === 0 && typingUsers.size === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Start a conversation to see messages here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log, idx) => {
                      if (log.type === 'sent' || log.type === 'received') {
                        const isReceived = log.type === 'received';
                        const messageParts = log.message.split(': ');
                        const username = isReceived ? messageParts[0] : userId;
                        const messageText = messageParts.length > 1 ? messageParts.slice(1).join(': ') : log.message;
                        
                        return (
                          <div 
                            key={idx} 
                            className={`flex w-full ${isReceived ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className={`flex items-start space-x-3 max-w-[70%] ${
                              isReceived ? 'flex-row' : 'flex-row-reverse space-x-reverse'
                            }`}>
                              <MessageAvatar type={log.type} username={username} />
                              <div className={`p-3 rounded-2xl ${
                                isReceived
                                  ? 'bg-white border border-gray-200 rounded-tl-sm'
                                  : 'bg-blue-500 text-white rounded-tr-sm'
                              }`}>
                                <p className={`text-sm ${
                                  isReceived ? 'text-gray-800' : 'text-white'
                                }`}>
                                  {messageText}
                                </p>
                                <p className={`text-xs mt-1 ${
                                  isReceived ? 'text-gray-500' : 'text-blue-200'
                                }`}>
                                  {log.timestamp}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={idx} className="flex justify-center">
                            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 max-w-md">
                              <p className={`text-xs font-medium ${
                                log.type === 'success' ? 'text-green-600' :
                                log.type === 'error' ? 'text-red-600' :
                                log.type === 'warning' ? 'text-yellow-600' :
                                'text-gray-600'
                              }`}>
                                {log.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {log.timestamp}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    })}
                    
                    {/* Typing Indicators */}
                    {Array.from(typingUsers).map((user) => (
                      <div key={user} className="flex justify-start">
                        <div className="flex items-start space-x-3 max-w-[70%]">
                          <MessageAvatar type="received" username={user} />
                          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-3">
                            <TypingIndicator />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              {isLoggedIn && peerId && (
                <div className="border-t border-gray-200 p-4">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => handleTyping(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-3 rounded-full transition-colors flex items-center justify-center w-12 h-12"
                      title="Send message"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  {message.trim() && (
                    <div className="flex items-center mt-2 text-xs text-blue-500">
                      <TypingIndicator showUser={false} size="small" className="text-blue-500" />
                      <span className="ml-2">You are typing...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}