import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
React
const UnprotectedRoute = ({ element }) => {
    const { isLoggedIn } = useAuth();
    
    return isLoggedIn? <Navigate to="/login" /> : element;
  };
  

export default UnprotectedRoute;