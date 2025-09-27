"use client";

import { useEffect, useState, useRef } from "react";
import { 
  MessageCircle, 
  Send, 
  LogOut, 
  User, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  MessageSquare,
  Users,
  Wifi,
  WifiOff,
  Edit3
} from "lucide-react";
import AgoraChat from "agora-chat";
import TypingIndicator from "@/components/TypingIndicator";

const APP_KEY = "611402009#1605378";

// TypingIndicator Component (move this to separate file later)
// (Removed duplicate TypingIndicator definition to fix parsing error)

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

  const getLogIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "warning": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "sent": return <Send className="w-4 h-4 text-blue-500" />;
      case "received": return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case "typing": return <Edit3 className="w-4 h-4 text-orange-500" />;
      default: return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogTextColor = (type) => {
    switch (type) {
      case "success": return "text-green-700";
      case "error": return "text-red-700";
      case "warning": return "text-yellow-700";
      case "sent": return "text-blue-700";
      case "received": return "text-indigo-700";
      case "typing": return "text-orange-600 italic";
      default: return "text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-full">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Agora Chat</h1>
                <p className="text-gray-600">Real-time messaging with typing indicators</p>
              </div>
            </div>
            
            {isLoggedIn && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 font-medium">Connected</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700 font-medium">{userId}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Login/Chat Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                {isLoggedIn ? "Chat Controls" : "Connect to Chat"}
              </h2>

              {!isLoggedIn ? (
                <div className="space-y-4">
                  {/* Username Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Username
                    </label>
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isConnecting}
                    />
                  </div>

                  {/* Token Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Key className="w-4 h-4 inline mr-1" />
                      Access Token
                    </label>
                    <textarea
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your chat token here"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={isConnecting}
                    />
                  </div>

                  {/* Connect Button */}
                  <button
                    onClick={handleLogin}
                    disabled={isConnecting || !userId.trim() || !token.trim()}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isConnecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4 mr-2" />
                        Connect to Chat
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span className="font-medium text-green-800">Connected as {userId}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Disconnect"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Recipient Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Send to Username
                    </label>
                    <input
                      type="text"
                      value={peerId}
                      onChange={(e) => setPeerId(e.target.value)}
                      placeholder="Enter recipient username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Message Input with Typing Indicator */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MessageCircle className="w-4 h-4 inline mr-1" />
                      Message
                      {message.trim() && (
                        <span className="ml-2 text-xs text-blue-500 italic">
                          <TypingIndicator showUser={false} size="small" className="text-blue-500" />
                        </span>
                      )}
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => handleTyping(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || !peerId.trim()}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                        title="Send message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Disconnect Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
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

              <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                {logs.length === 0 && typingUsers.size === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-lg font-medium">No activity yet</p>
                    <p className="text-sm">Connect to start chatting!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-start space-x-3 p-3 rounded-lg ${
                          log.type === 'sent' 
                            ? 'bg-blue-50 border border-blue-200' 
                            : log.type === 'received'
                            ? 'bg-indigo-50 border border-indigo-200'
                            : log.type === 'typing'
                            ? 'bg-orange-50 border border-orange-200 animate-pulse'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getLogIcon(log.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${getLogTextColor(log.type)}`}>
                            {log.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {log.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show typing indicators for active users */}
                    {Array.from(typingUsers).map((user) => (
                      <TypingIndicator key={user} user={user} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}