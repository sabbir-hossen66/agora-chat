// hooks/useAgoraChat.js
import { createAgoraChat } from 'agora-chat';

export const useAgoraChat = () => {
  const [messages, setMessages] = useState([]);
  const [chatClient, setChatClient] = useState(null);
  
  useEffect(() => {
    const initAgoraChat = async () => {
      const client = createAgoraChat({
        appKey: 'your-agora-app-key'
      });
      
      await client.login({
        user: currentUser.id,
        token: 'agora-rtm-token'
      });
      
      setChatClient(client);
    };
    
    initAgoraChat();
  }, []);
  
  return { messages, setMessages, chatClient };
};