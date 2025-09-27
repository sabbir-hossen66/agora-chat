import { MessageCircle, Wifi, WifiOff, User } from "lucide-react";

const ChatHeader = ({ isLoggedIn, userId }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500 rounded-full">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Agora Chat</h1>
            <p className="text-gray-600">
              Real-time messaging with read receipts
            </p>
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
  );
};

export default ChatHeader;
