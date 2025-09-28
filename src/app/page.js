"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Send, 
  MessageSquare,
  Wifi,
  WifiOff,
  Edit3
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
      const typingEndMsg = AgoraChat.message.create({
        type: "txt",
        to: peerId,
        msg: "%%TYPING_END%%", 
        chatType: "singleChat",
      });
      await chatClient.current?.send(typingEndMsg);

      setTimeout(async () => {
        const msg = AgoraChat.message.create({
          type: "txt",
          to: peerId,
          msg: message,
          chatType: "singleChat",
        });

        await chatClient.current?.send(msg);
        addLog(`To ${peerId}: ${message}`, "sent");
      }, 100);
      
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
    addLog("Disconnected from chat", "info");
  };

  useEffect(() => {
    if (!APP_KEY) {
      addLog("Missing APP_KEY configuration", "error");
      return;
    }

    chatClient.current = new AgoraChat.connection({ 
      appKey: APP_KEY,
      isHttpDNS: true,
    });

    chatClient.current.addEventHandler("connection&message", {
      onConnected: () => {
        setIsLoggedIn(true);
        setIsConnecting(false);
        addLog(`Successfully connected as ${userId}`, "success");
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
          addLog(`${msg.from}: ${msg.msg}`, "received");
        }
      },
      
      onError: (error) => {
        setIsConnecting(false);
        addLog(`Connection error: ${error.message || error}`, "error");
        
        if (error.type === 2) {
          addLog("Authentication failed - Check your credentials", "error");
        }
      },
      
      onTokenWillExpire: () => {
        addLog("Token will expire in 30 days - Please refresh", "warning");
      },
      
      onTokenExpired: () => {
        addLog("Token expired - Please refresh", "error");
        setIsLoggedIn(false);
      },
    });

    return () => {
      chatClient.current?.removeEventHandler("connection&message");
    };
  }, [userId]);

  // Avatar component for messages
  const MessageAvatar = ({ type, username }) => {
    const isReceived = type === 'received';
    const avatarColor = isReceived ? 'bg-purple-500' : 'bg-blue-500';
    const initial = username ? username.charAt(0).toUpperCase() : (isReceived ? 'R' : 'Y');
    
    return (
      <div className={`w-8 h-8 ${avatarColor} rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0`}>
        {initial}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Component */}
        <ChatHeader isLoggedIn={isLoggedIn} userId={userId} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Login/Chat Controls */}
          <div className="lg:col-span-1">
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
          </div>

          {/* Chat Logs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Chat Activity
                </h2>
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
                  <span className="text-sm text-gray-500">
                    {logs.length} events
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto mb-4">
                {logs.length === 0 && typingUsers.size === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-lg font-medium">No activity yet</p>
                    <p className="text-sm">Connect to start chatting!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log, idx) => {
                      if (log.type === 'sent' || log.type === 'received') {
                        // Extract username and message from log
                        const isReceived = log.type === 'received';
                        const messageParts = log.message.split(': ');
                        const username = isReceived ? messageParts[0] : userId;
                        const messageText = messageParts.length > 1 ? messageParts.slice(1).join(': ') : log.message;
                        
                        return (
                          <div 
                            key={idx} 
                            className={`flex w-full ${isReceived ? 'justify-start' : 'justify-end'} mb-3`}
                          >
                            <div className={`flex items-start space-x-3 max-w-[75%] ${
                              isReceived ? 'flex-row' : 'flex-row-reverse space-x-reverse'
                            }`}>
                              <MessageAvatar type={log.type} username={username} />
                              <div className={`p-3 rounded-lg ${
                                isReceived
                                  ? 'bg-purple-50 border border-purple-200 rounded-tl-sm'
                                  : 'bg-blue-500 text-white rounded-tr-sm'
                              }`}>
                                <div className="flex items-baseline space-x-2">
                                  <span className={`text-sm font-medium ${
                                    isReceived ? 'text-purple-700' : 'text-blue-100'
                                  }`}>
                                    {username}
                                  </span>
                                  <span className={`text-xs ${
                                    isReceived ? 'text-gray-500' : 'text-blue-200'
                                  }`}>
                                    {log.timestamp}
                                  </span>
                                </div>
                                <p className={`text-sm mt-1 ${
                                  isReceived ? 'text-purple-600' : 'text-white'
                                }`}>
                                  {messageText}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        // Other log types (connection, error, etc.)
                        return (
                          <div 
                            key={idx} 
                            className="flex justify-center mb-3"
                          >
                            <div className="flex items-start space-x-3 p-2 rounded-lg bg-white border border-gray-200 max-w-md">
                              <div className="flex-shrink-0 mt-0.5">
                                {log.type === 'success' && <div className="w-4 h-4 text-green-500">✓</div>}
                                {log.type === 'error' && <div className="w-4 h-4 text-red-500">✗</div>}
                                {log.type === 'warning' && <div className="w-4 h-4 text-yellow-500">!</div>}
                                {log.type === 'sent' && <Send className="w-4 h-4 text-blue-500" />}
                                {log.type === 'received' && <MessageSquare className="w-4 h-4 text-indigo-500" />}
                                {log.type === 'typing' && <Edit3 className="w-4 h-4 text-orange-500" />}
                                {!['success', 'error', 'warning', 'sent', 'received', 'typing'].includes(log.type) && 
                                  <MessageSquare className="w-4 h-4 text-gray-500" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium ${
                                  log.type === 'success' ? 'text-green-700' :
                                  log.type === 'error' ? 'text-red-700' :
                                  log.type === 'warning' ? 'text-yellow-700' :
                                  log.type === 'sent' ? 'text-blue-700' :
                                  log.type === 'received' ? 'text-indigo-700' :
                                  log.type === 'typing' ? 'text-orange-600 italic' :
                                  'text-gray-700'
                                }`}>
                                  {log.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {log.timestamp}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                    
                    {/* Show typing indicators for active users */}
                    {Array.from(typingUsers).map((user) => (
                      <div key={user} className="flex justify-start mb-3">
                        <div className="max-w-[75%]">
                          <TypingIndicator user={user} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Message Input - WhatsApp Style */}
              {isLoggedIn && (
                <div className="bg-white p-3 rounded-lg border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => handleTyping(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={!peerId.trim()}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || !peerId.trim()}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
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