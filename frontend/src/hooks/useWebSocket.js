import { useEffect, useRef, useState } from "react";

const useWebSocket = (channelId) => {
    console.log("Channel ID:", channelId);
  const socketRef = useRef(null);
  const [airesponse, setAiresponse] = useState(null); // State to store received messages

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost/ai/ws/${channelId}`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      const data = JSON.parse(event.data);
      setAiresponse(data); // Update state with the received data
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, [channelId]);

  return { airesponse }; 
};

export default useWebSocket;
