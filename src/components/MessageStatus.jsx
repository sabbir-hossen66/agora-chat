import { Check, CheckCheck, Clock } from "lucide-react";

const MessageStatus = ({ status, timestamp }) => {
  const getStatusIcon = () => {
    switch (status) {
      case "sent":
        return <Check className="w-3 h-3 text-gray-600" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-gray-600" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-600" />;
      case "sending":
        return <Clock className="w-3 h-3 text-gray-400" />;
      default:
        return <Check className="w-3 h-3 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "sent":
        return "Sent";
      case "delivered":
        return "Delivered";
      case "read":
        return "Read";
      case "sending":
        return "Sending";
      default:
        return "Sent";
    }
  };

  return (
    <div className="flex items-center space-x-1 mt-1">
      {getStatusIcon()}
      <span className="text-xs text-gray-600">
        {timestamp} • {getStatusText()}
      </span>
    </div>
  );
};

export default MessageStatus;
