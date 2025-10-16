import { createContext, useContext, useEffect, useState } from "react";
import { getAuthUser } from "../lib/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getAuthUser()
      .then((data) => setAuthUser(data?.user || null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}