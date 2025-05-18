import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import React from "react";

const UnprotectedRoute = ({ element }) => {
    const { isLoggedIn } = useAuth();
    
    return isLoggedIn? <Navigate to="/login" /> : element;
  };
  

export default UnprotectedRoute;