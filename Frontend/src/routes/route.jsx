import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../provider/AuthProvider";
import LoginPage from "../pages/loginPage";
import ForgetPage from "../pages/forgetPage";
import ResetPage from "../pages/resetPage";
import RegisterPage from "../pages/registerPage";

export default function Root() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forget" element={<ForgetPage />} />
                    <Route path="/reset" element={<ResetPage />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}