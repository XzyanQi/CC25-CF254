import { yupResolver } from "@hookform/resolvers/yup";
import { UserPlus } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { Link, useNavigate } from "react-router-dom";
import * as yup from "yup";
import { register as registerApi } from "../api/auth";
import mindfulnessLogo from '../assets/mindfulness.png';

React
const schema = yup.object().shape({
    name: yup.string().required("Nama wajib diisi"),
    email: yup.string().email("Format email tidak valid").required("Email wajib diisi"),
    password: yup
        .string()
        .required('Password wajib diisi')
        .min(8, 'Minimal 8 karakter')
        .matches(/[0-9]/, 'Harus mengandung setidaknya satu angka')
        .matches(/[!@#$%^&*?]/, 'Harus mengandung simbol (!@#$%^&*?)'), 
});

export default function RegisterPage() {
    const navigate = useNavigate();
    const [modalMessage, setModalMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); 

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        mode: "onTouched",
    });

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setModalMessage("");
        try {
            const response = await registerApi(data); 
            if (response.status === 201 || response.status === 200) { // Status 201 untuk 'Created'
                console.log("Berhasil daftar:", response.data);
                setModalMessage("Registrasi berhasil! Anda akan diarahkan ke halaman login dalam beberapa detik.");
                const successModal = document.getElementById("register-success-modal");
                if (successModal) successModal.checked = true;
                
                // setTimeout untuk navigasi
                setTimeout(() => {
                    const successModalToClose = document.getElementById("register-success-modal");
                    if (successModalToClose) successModalToClose.checked = false; // Tutup modal sebelum navigasi
                    navigate("/login");
                }, 3000); // 3000 (3 detik) delaynya
            } else {
                const errorMessage = response?.data?.message || "Pendaftaran gagal. Silakan periksa kembali data Anda.";
                setModalMessage(errorMessage);
                const errorModal = document.getElementById("register-error-modal");
                if (errorModal) errorModal.checked = true;
            }
        } catch (error) {
            console.error("Register error:", error);
            const errorMessage = error.response?.data?.message || "Terjadi kesalahan saat registrasi. Pastikan semua data valid dan coba lagi.";
            setModalMessage(errorMessage);
            const errorModal = document.getElementById("register-error-modal");
            if (errorModal) errorModal.checked = true;
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="grid md:grid-cols-2 h-screen">
            {/* Kolom Kiri untuk Ilustrasi dan Teks Deskripsi */}
            <div className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 h-full md:flex flex-col items-center justify-center p-8 lg:p-12 hidden text-white">
                <UserPlus size={100} className="mb-8 text-purple-300" />
                <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-center leading-tight">
                    BERGABUNG DENGAN KAMI
                </h1>
                <p className="text-center text-sm lg:text-base max-w-md text-purple-100">
                    Buat akun untuk memulai perjalanan mindfulness Anda dan dapatkan akses ke semua fitur yang menenangkan.
                </p>
            </div>

            {/* Kolom Kanan untuk Form Registrasi */}
            <div className="bg-white h-full flex flex-col items-center justify-center p-6 sm:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center w-full max-w-sm">
                    <div className="mb-6 text-center">
                        <img 
                            src={mindfulnessLogo} 
                            alt="Mindfulness Logo" 
                            className="w-40 h-auto mx-auto mb-4" 
                        />
                        <h2 className="text-3xl font-bold text-gray-800">Register</h2>
                        <p className="text-sm text-gray-500 mt-1">Silakan isi data diri Anda.</p>
                    </div>

                    <fieldset className="fieldset mb-4">
                        <legend className="fieldset-legend font-normal text-gray-600">Nama Lengkap</legend>
                        <input
                            type="text"
                            placeholder="Masukkan nama lengkap Anda"
                            {...register("name")}
                            className={`input input-bordered w-full ${errors.name ? "input-error" : ""}`}
                        />
                        {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name.message}</span>}
                    </fieldset>

                    <fieldset className="fieldset mb-4">
                        <legend className="fieldset-legend font-normal text-gray-600">Email</legend>
                        <input
                            type="email" 
                            placeholder="contoh@email.com"
                            {...register("email")}
                            className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
                        />
                        {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>}
                    </fieldset>

                    <fieldset className="fieldset mb-4 relative"> 
                        <legend className="fieldset-legend font-normal text-gray-600">Password</legend>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Buat password Anda"
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

                    <button 
                        type="submit" 
                        className="btn btn-primary w-full mb-4 disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            "Register"
                        )}
                    </button>
                    
                    <p className="text-center text-sm text-gray-600">
                        Sudah memiliki akun?{" "}
                        <Link to="/login" className="font-medium text-blue-600 hover:underline">
                            Login di sini
                        </Link>
                    </p>
                </form>
            </div>

            {/* Pesan Error Registrasi */}
            <input type="checkbox" id="register-error-modal" className="modal-toggle" />
            <div className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg text-red-600">Registrasi Gagal!</h3>
                    <p className="py-4">{modalMessage}</p>
                    <div className="modal-action">
                        <label htmlFor="register-error-modal" className="btn btn-outline">
                            Tutup
                        </label>
                    </div>
                </div>
            </div>

            {/* Pesan Sukses Registrasi */}
            <input type="checkbox" id="register-success-modal" className="modal-toggle" />
            <div className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg text-green-600">Registrasi Berhasil!</h3>
                    <p className="py-4">{modalMessage}</p>
                </div>
            </div>
        </section>
    );
}