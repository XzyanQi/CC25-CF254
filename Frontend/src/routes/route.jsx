import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AboutPage from "../pages/aboutPage";
import ChatbotPage from "../pages/chatbotPage";
import ForgetPage from "../pages/forgetPage";
import Homepage from "../pages/homepage";
import LoginPage from "../pages/loginPage";
import RegisterPage from "../pages/registerPage";
import ResetPage from "../pages/resetPage";
import { AuthProvider } from "../provider/AuthProvider";

React


export default function Root() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Default route - redirect to login */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    
                    {/* Auth routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forget" element={<ForgetPage />} />
                    <Route path="/reset" element={<ResetPage />} />
                    
                    {/* Main app routes */}
                    <Route path="/home" element={<Homepage />} />
                    <Route path="/chat" element={<ChatbotPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    
                    {/* Catch all - redirect to login */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}