import { yupResolver } from "@hookform/resolvers/yup";
import { ShieldCheck } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { resetPassword as resetPasswordApi } from "../api/auth";
import mindfulnessLogo from '../assets/mindfulness.png';

React

const schema = yup.object().shape({
    password: yup
        .string()
        .required('Password wajib diisi')
        .min(8, 'Minimal 8 karakter')
        .matches(/[0-9]/, 'Harus mengandung angka')
        .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Harus mengandung simbol'), 
    confirmPassword: yup
        .string()
        .required('Konfirmasi password wajib diisi') //
        .oneOf([yup.ref('password'), null], 'Password tidak sama'), 
});

export default function ResetPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const storedEmail = localStorage.getItem("email");
        if (!storedEmail) {
            console.warn("Tidak ada email di localStorage, mengarahkan ke /forget");
            navigate("/forget"); 
        } else {
            setEmail(storedEmail);
        }
    }, [navigate]);

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
        const payload = {
            email,
            newPassword: data.password,
        };

        try {
            const response = await resetPasswordApi(payload);
            if (response.status === 200) {
                localStorage.removeItem("email"); 
                setModalMessage("Password berhasil diubah! Anda akan diarahkan ke halaman login.");
                const modal = document.getElementById("reset-modal");
                if (modal) modal.checked = true;
    
            } else {
                setModalMessage(response?.data?.message || "Gagal mengubah password. Silakan coba lagi.");
                const modal = document.getElementById("reset-modal");
                if (modal) modal.checked = true;
            }
        } catch (error) {
            console.error("Reset Password error:", error);
            setModalMessage(error.response?.data?.message || "Terjadi kesalahan saat mengubah password.");
            const modal = document.getElementById("reset-modal");
            if (modal) modal.checked = true;
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!email && !localStorage.getItem("email")) {
        return <div className="flex h-screen items-center justify-center">Memuat atau mengalihkan...</div>;
    }

    return (
        <section className="grid md:grid-cols-2 h-screen">
            {/* Kolom Kiri untuk Ilustrasi */}
            <div className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 h-full md:flex flex-col items-center justify-center p-8 lg:p-12 hidden text-white">
                <ShieldCheck size={100} className="mb-8 text-purple-300" />
                <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-center leading-tight">
                    ATUR ULANG PASSWORD
                </h1>
                <p className="text-center text-sm lg:text-base max-w-md text-purple-100">
                    Buat password baru yang kuat dan mudah Anda ingat untuk keamanan akun Anda.
                </p>
            </div>

            <div className="bg-white h-full flex flex-col items-center justify-center p-6 sm:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center w-full max-w-sm">
                    <div className="mb-6 text-center">
                        <img 
                            src={mindfulnessLogo} 
                            alt="Mindfulness Logo" 
                            className="w-64 h-auto mx-auto mb-4"
                        />
                        <h2 className="text-3xl font-bold text-gray-800">Reset Password</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Masukkan password baru untuk akun <span className="font-medium">{email}</span>.
                        </p>
                    </div>

                    <fieldset className="fieldset mb-4 relative">
                        <legend className="fieldset-legend font-normal text-gray-600">Password Baru</legend>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan password baru"
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

                    <fieldset className="fieldset mb-6 relative">
                        <legend className="fieldset-legend font-normal text-gray-600">Konfirmasi Password Baru</legend>
                        <input
                            type={showConfirm ? "text" : "password"}
                            placeholder="Ketik ulang password baru"
                            {...register("confirmPassword")}
                            className={`input input-bordered w-full pr-10 ${errors.confirmPassword ? "input-error" : ""}`}
                        />
                        <span
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-1.5 cursor-pointer text-xl text-gray-400 hover:text-gray-600"
                            onClick={() => setShowConfirm(!showConfirm)}
                        >
                            {showConfirm ? <PiEye /> : <PiEyeClosed />}
                        </span>
                        {errors.confirmPassword && (
                            <span className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</span>
                        )}
                    </fieldset>

                    <button 
                        type="submit" 
                        className="btn btn-primary w-full disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            "Reset Password"
                        )}
                    </button>
                </form>
            </div>

            {/* Modal untuk Pesan (Sukses atau Error) */}
            <input type="checkbox" id="reset-modal" className="modal-toggle" />
            <div className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className={`font-bold text-lg ${modalMessage.includes("berhasil") ? "text-green-600" : "text-red-600"}`}>
                        {modalMessage.includes("berhasil") ? "Sukses!" : "Terjadi Kesalahan"}
                    </h3>
                    <p className="py-4">{modalMessage}</p>
                    <div className="modal-action">
                        <label
                            htmlFor="reset-modal"
                            className="btn btn-outline"
                            onClick={() => {
                                if (modalMessage.toLowerCase().includes("berhasil")) {
                                    navigate("/login");
                                }
                            }}
                        >
                            OK
                        </label>
                    </div>
                </div>
            </div>
        </section>
    );
}
