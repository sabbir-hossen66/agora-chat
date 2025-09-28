// components/LoginPanel.jsx
import {
  LogOut,
  User,
  Key,
  CheckCircle,
  Users,
  Wifi,
  Plus,
} from "lucide-react";

const LoginPanel = ({
  isLoggedIn,
  userId,
  setUserId,
  token,
  setToken,
  peerId,
  setPeerId,
  isConnecting,
  onLogin,
  onLogout,
  onStartNewChat,
}) => {
  return (
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
            onClick={onLogin}
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
                <span className="font-medium text-green-800">
                  Connected as {userId}
                </span>
              </div>
            </div>
          </div>

          {/* Start New Chat Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <Plus className="w-4 h-4 mr-1" />
              Start New Chat
            </h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={peerId}
                onChange={(e) => setPeerId(e.target.value)}
                placeholder="Enter username"
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={onStartNewChat}
                disabled={!peerId.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg transition-colors flex items-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={onLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default LoginPanel;
