"use client";

import { useEffect, useState, useRef } from "react";
import { 
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
  Edit3,
  Check,
  CheckCheck
} from "lucide-react";
import AgoraChat from "agora-chat";
import ChatHeader from "@/components/ChatHeader";
import TypingIndicator from "@/components/TypingIndicator";

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
  const [messageStatuses, setMessageStatuses] = useState({}); // Track message status
  const [sentMessageIds, setSentMessageIds] = useState([]); // Track sent message IDs
  const chatClient = useRef(null);

  const addLog = (log, type = "info", messageId = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prevLogs) => [...prevLogs, { message: log, type, timestamp, messageId }]);
  };

  const updateMessageStatus = (messageId, status) => {
    setMessageStatuses(prev => ({
      ...prev,
      [messageId]: status
    }));
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
          // Enable delivery and read receipts properly
          deliverOnlineOnly: false,
          msgConfig: {
            allowGroupAck: true,
            // Request delivery receipt
            delivery: true,
          }
        });

        // Set message status to 'sent' initially
        updateMessageStatus(msg.id, 'sent');
        setSentMessageIds(prev => [...prev, msg.id]);

        const result = await chatClient.current?.send(msg);
        console.log("Message sent with ID:", msg.id);
        addLog(`To ${peerId}: ${message}`, "sent", msg.id);

        // Simulate delivery after message is sent successfully
        setTimeout(() => {
          console.log("Simulating delivery receipt for:", msg.id);
          updateMessageStatus(msg.id, 'delivered');
        }, 1000);

        // Request delivery receipt for this message
        try {
          // Send delivery request immediately after sending message
          setTimeout(() => {
            chatClient.current?.sendDeliveryRequest({
              to: peerId,
              id: msg.id,
            });
          }, 500);
        } catch (deliveryError) {
          console.log("Delivery receipt request error:", deliveryError);
        }
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
    setMessageStatuses({});
    setSentMessageIds([]);
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
      // Enable delivery receipts
      delivery: true,
      // Enable read receipts  
      enableReceipts: true,
    });

    chatClient.current.addEventHandler("connection&message", {
      onConnected: () => {
        setIsLoggedIn(true);
        setIsConnecting(false);
        addLog(`Successfully connected as ${userId}`, "success");
        
        // Enable delivery and read receipts after connection
        try {
          chatClient.current?.setDeliveryAck(true);
          chatClient.current?.enableDeliveryAck(true);
          console.log("✅ Delivery receipts enabled");
        } catch (error) {
          console.log("Failed to enable delivery receipts:", error);
        }
      },
      
      onDisconnected: () => {
        setIsLoggedIn(false);
        setIsConnecting(false);
        addLog("Disconnected from chat server", "info");
      },
      
      onTextMessage: (msg) => {
        // Check for custom read receipt notification
        if (msg.msg.startsWith("%%READ_RECEIPT_")) {
          const messageId = msg.msg.replace("%%READ_RECEIPT_", "").replace("%%", "");
          console.log("Custom read receipt received for message:", messageId);
          
          // Find and update the message status to read
          sentMessageIds.forEach(sentId => {
            if (sentId.includes(messageId.slice(-10)) || messageId.includes(sentId.slice(-10))) {
              updateMessageStatus(sentId, 'read');
              console.log(`Updated message ${sentId} to read status`);
            }
          });
          
          return; // Don't process this as a regular message
        }
        
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
          addLog(`${msg.from}: ${msg.msg}`, "received", msg.id);
          
          // Send delivery acknowledgment when receiving message
          try {
            chatClient.current?.sendDeliveryAck({
              to: msg.from,
              id: msg.id,
            });
            console.log("Delivery ack sent for:", msg.id);
          } catch (error) {
            console.log("Failed to send delivery ack:", error);
          }
          
          // Simulate read receipt after receiving message
          setTimeout(() => {
            try {
              // Send custom read notification
              const readNotification = AgoraChat.message.create({
                type: "txt",
                to: msg.from,
                msg: `%%READ_RECEIPT_${msg.id}%%`,
                chatType: "singleChat",
              });
              chatClient.current?.send(readNotification);
              console.log("Read notification sent for:", msg.id);
            } catch (error) {
              console.log("Failed to send read notification:", error);
            }
          }, 2000);
        }
      },

      // Handle delivery receipts - simpler approach
      onDeliveredMessage: (msg) => {
        console.log("Delivery receipt received:", msg);
        console.log("Currently tracked sent messages:", sentMessageIds);
        
        // Update the most recent sent message to delivered
        if (sentMessageIds.length > 0) {
          const lastSentId = sentMessageIds[sentMessageIds.length - 1];
          console.log(`Updating last sent message ${lastSentId} to delivered`);
          updateMessageStatus(lastSentId, 'delivered');
        }
      },

      // Handle read receipts - simpler approach
      onReadMessage: (msg) => {
        console.log("Read receipt received:", msg);
        
        // Update the most recent sent message to read
        if (sentMessageIds.length > 0) {
          const lastSentId = sentMessageIds[sentMessageIds.length - 1];
          console.log(`Updating last sent message ${lastSentId} to read`);
          updateMessageStatus(lastSentId, 'read');
        }
      },

      // Handle delivery acknowledgments
      onDeliveryMessage: (msg) => {
        console.log("📦 Delivery ack received:", msg);
        const messageId = msg.mid || msg.id || msg.messageId;
        if (messageId) {
          updateMessageStatus(messageId, 'delivered');
        }
      },

      // Handle read acknowledgments  
      onReadAckMessage: (msg) => {
        console.log("📖 Read ack received:", msg);
        const messageId = msg.mid || msg.id || msg.messageId;
        if (messageId) {
          updateMessageStatus(messageId, 'read');
        }
      },

      // Additional handler for delivery status
      onReceivedMessage: (msg) => {
        console.log("📨 Message received event:", msg);
        if (msg.type === 'delivery') {
          const messageId = msg.mid || msg.id || msg.messageId;
          if (messageId) {
            updateMessageStatus(messageId, 'delivered');
          }
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
  }, [userId,sentMessageIds]);

  const getLogIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "warning": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "sent": return <Send className="w-4 h-4 text-blue-500" />;
      case "received": return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case "typing": return <Edit3 className="w-4 h-4 text-orange-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
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

  // Message status indicator component - WhatsApp style
  const MessageStatus = ({ messageId, type }) => {
    if (type !== 'sent') return null;
    
    const status = messageStatuses[messageId] || 'sent';
    
    switch (status) {
      case 'sent':
        return (
          <div className="flex justify-end mt-1">
            <Check className="w-3 h-3 text-gray-400" title="Sent" />
          </div>
        );
      case 'delivered':
        return (
          <div className="flex justify-end mt-1">
            <div className="relative">
              <Check className="w-3 h-3 text-gray-500" />
              <Check className="w-3 h-3 text-gray-500 absolute -right-1 top-0" />
            </div>
          </div>
        );
      case 'read':
        return (
          <div className="flex justify-end mt-1">
            <div className="relative">
              <Check className="w-3 h-3 text-blue-500" />
              <Check className="w-3 h-3 text-blue-500 absolute -right-1 top-0" />
            </div>
          </div>
        );
      default:
        return (
          <div className="flex justify-end mt-1">
            <Clock className="w-3 h-3 text-gray-300" title="Sending..." />
          </div>
        );
    }
  };

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
                                {/* Message status indicator - only for sent messages */}
                                <MessageStatus messageId={log.messageId} type={log.type} />
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                     
                        return (
                          <div 
                            key={idx} 
                            className="flex justify-center mb-3"
                          >
                            <div className="flex items-start space-x-3 p-2 rounded-lg bg-white border border-gray-200 max-w-md">
                              <div className="flex-shrink-0 mt-0.5">
                                {getLogIcon(log.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium ${getLogTextColor(log.type)}`}>
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