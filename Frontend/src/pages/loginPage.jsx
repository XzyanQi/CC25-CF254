import { yupResolver } from '@hookform/resolvers/yup';
import { Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { Link, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { login } from '../api/auth';
import mindfulnessLogo from '../assets/mindfulness.png';
import { useAuth } from '../provider/AuthProvider';

React
const schema = yup.object().shape({
    email: yup.string().email('Format email tidak valid').required('Email wajib diisi'),
    password: yup
        .string()
        .required('Password wajib diisi')
        .min(8, 'Minimal 8 karakter')
        .matches(/[0-9]/, 'Harus mengandung setidaknya satu angka')
        .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Harus mengandung setidaknya satu simbol'),
});

export default function LoginPage() {
    const navigate = useNavigate();
    const auth = useAuth();
    const [modalMessage, setModalMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        mode: 'onTouched',
    });

    const onSubmit = async (data) => {
        setIsSubmitting(true); 
        setModalMessage(''); 
        try {
            const response = await login(data); 
            
            if (response && response.data && response.data.data && response.data.data.token) {
                const token = response.data.data.token;
                const user = response.data.data.user; 

                auth.setLogin(user, token); 
                

                navigate('/home', { replace: true });
            } else {
                const errorMessage = response?.data?.message || 'Login gagal. Data token tidak ditemukan.';
                setModalMessage(errorMessage);
                const errorModal = document.getElementById('error-modal');
                if (errorModal) errorModal.checked = true;
            }
        } catch (error) {
            console.error("Login error:", error);
            const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat login. Silakan coba lagi.';
            setModalMessage(errorMessage);
            const errorModal = document.getElementById('error-modal');
            if (errorModal) errorModal.checked = true;
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="grid md:grid-cols-2 h-screen"> 
            {/* Kolom Kiri untuk Ilustrasi Profil  */}
            <div className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 h-full md:flex flex-col items-center justify-center p-8 lg:p-12 hidden text-white">
                <div 
                className="w-48 h-48 lg:w-56 lg:h-56 
                   bg-white/20 backdrop-blur-md border-2 border-white/30 
                   rounded-full flex items-center justify-center 
                   mb-8 shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                <Sparkles size={80} className="text-white opacity-90" strokeWidth={1.5} /> 
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-center leading-tight drop-shadow-md">
                WELCOME BACK! 
                </h1>
                <p className="text-center text-sm lg:text-base max-w-md text-purple-100/90 drop-shadow-sm">
                 Sometimes, sharing is the first step to healing. Chat with our mindfulness chatbot to express your thoughts and emotions in a safe, supportive space.
                </p>
            </div>
            {/* Kolom Kanan untuk Form Login */}
            <div className="bg-white h-full flex flex-col items-center justify-center p-6 sm:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center w-full max-w-sm">
                    <div className="mb-6 text-center">
                        <img 
                            src={mindfulnessLogo} 
                            alt="Mindfulness Logo" 
                            className="w-64 h-auto mx-auto mb-4" 
                        />
                        <p className="text-sm text-gray-500 mt-1">Selamat datang kembali! Silakan login.</p>
                    </div>

                    <fieldset className="fieldset mb-4">
                        <legend className="fieldset-legend font-normal text-gray-600">Email</legend>
                        <input
                            type="email"
                            placeholder="nama@domain.com" // semua email bisa
                            {...register('email')}
                            className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                        />
                        {errors.email && (
                            <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>
                        )}
                    </fieldset>

                    <fieldset className="fieldset mb-2 relative">
                        <legend className="fieldset-legend font-normal text-gray-600">Password</legend>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan password Anda"
                            {...register("password")}
                            className={`input input-bordered w-full pr-10 ${errors.password ? "input-error" : ""}`}
                        />
                        <span
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-1.5 cursor-pointer text-xl text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <PiEye /> : <PiEyeClosed />}
                        </span>
                        {errors.password && (
                            <span className="text-xs text-red-500 mt-1">{errors.password.message}</span>
                        )}
                    </fieldset>

                    <div className="text-right mb-6">
                        <span
                            className="text-xs text-blue-600 hover:underline cursor-pointer"
                            onClick={() => navigate('/forget')}
                        >
                            Lupa password?
                        </span>
                    </div>

                    <button 
                        className="btn btn-primary w-full mb-4 disabled:opacity-50"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            "Login"
                        )}
                    </button>

                    <p className="text-center text-sm text-gray-600">
                        Belum punya akun?{' '}
                        <Link to="/register" className="font-medium text-blue-600 hover:underline">
                            Daftar di sini
                        </Link>
                    </p>
                </form>
            </div>

            {/* Modal untuk Pesan Error */}
            <input type="checkbox" id="error-modal" className="modal-toggle" />
            <div className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg text-red-600">Login Gagal!</h3>
                    <p className="py-4">{modalMessage}</p>
                    <div className="modal-action">
                        <label htmlFor="error-modal" className="btn btn-outline">
                            Tutup
                        </label>
                    </div>
                </div>
            </div>
        </section>
    );
}
