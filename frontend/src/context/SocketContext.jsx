import { createContext, useContext, useMemo } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const sockets = useMemo(() => {
    return {
      authSocket: io(BACKEND_URL, {
        withCredentials: true,
        path: "/auth/socket.io",
      }),
      userSocket: io(BACKEND_URL, {
        withCredentials: true,
        path: "/users/socket.io",
      }),
      chatSocket: io(BACKEND_URL, {
        withCredentials: true,
        path: "/chat/socket.io",
      }),
    };
  }, []);

  return (
    <SocketContext.Provider value={sockets}>{children}</SocketContext.Provider>
  );
}

export function useSockets() {
  return useContext(SocketContext);
}
