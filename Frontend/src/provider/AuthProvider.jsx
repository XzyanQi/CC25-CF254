import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

React

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({});

  useEffect(() => {
    const token = document.cookie;

    if (token) {
      setIsLoggedIn(true);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const setLogin = () => {
    setIsLoggedIn(true);
    setIsLoading(false);
  }

  const setLogout = () => {
    setIsLoggedIn(false);
    // document.cookie = `token=`;
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, setUser, setLogin, setLogout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);