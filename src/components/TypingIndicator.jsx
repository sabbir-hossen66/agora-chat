import { Edit3 } from "lucide-react";

const TypingIndicator = ({
  user,
  showUser = true,
  size = "normal",
  className = "",
}) => {
  const dotSize = size === "small" ? "w-1 h-1" : "w-2 h-2";
  const textSize = size === "small" ? "text-xs" : "text-sm";

  if (!showUser && size === "small") {
    // For inline typing indicator (like in message input label)
    return (
      <span className={`flex items-center space-x-1 ${className}`}>
        <Edit3 className="w-3 h-3" />
        <div className="flex space-x-1">
          <div
            className={`${dotSize} bg-current rounded-full animate-bounce`}
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className={`${dotSize} bg-current rounded-full animate-bounce`}
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className={`${dotSize} bg-current rounded-full animate-bounce`}
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </span>
    );
  }

  // For chat message typing indicator
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
      <div className="flex-shrink-0 mt-0.5">
        <Edit3 className="w-4 h-4 text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          {showUser && (
            <span className={`${textSize} font-medium text-orange-600`}>
              {user}
            </span>
          )}
          <div className="flex space-x-1">
            <div
              className={`${dotSize} bg-orange-500 rounded-full animate-bounce`}
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className={`${dotSize} bg-orange-500 rounded-full animate-bounce`}
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className={`${dotSize} bg-orange-500 rounded-full animate-bounce`}
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default TypingIndicator;
