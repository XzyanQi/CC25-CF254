import React, { useEffect, useState } from "react";
import { PiEye, PiEyeClosed  } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object().shape({
    password: yup
        .string()
        .required('Password wajib diisi')
        .min(8, 'Minimal 8 karakter')
        .matches(/[0-9]/, 'Harus mengandung angka')
        .matches(/[!@#$%^&*]/, 'Harus mengandung simbol (!@#$%^&*)'),
    confirmPassword: yup
        .string()
        .required('Password wajib diisi')
        .min(8, 'Minimal 8 karakter')
        .matches(/[0-9]/, 'Harus mengandung angka')
        .oneOf([yup.ref('password'), null], 'Password tidak sama')
        .matches(/[!@#$%^&*]/, 'Harus mengandung simbol (!@#$%^&*)'),
});

export default function ResetPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const storedEmail = localStorage.getItem("email");
        if (!storedEmail) {
            navigate("/forget"); // Jika email tidak ditemukan
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
        const payload = {
            email,
            newPassword: data.password,
        };

        try {
            const response = await resetPassword(payload);
            if (response.status === 200) {
                localStorage.removeItem("email");
                setModalMessage("Password berhasil diubah.");
                document.getElementById("reset-modal").checked = true;
            } else {
                setModalMessage("Gagal mengubah password.");
                document.getElementById("reset-modal").checked = true;
            }
        } catch (error) {
            console.log(error);
            setModalMessage("Terjadi kesalahan saat mengubah password.");
            document.getElementById("reset-modal").checked = true;
        }
    };

    return (
        <section className="grid grid-cols-2">
            <div className="bg-primary h-screen flex items-center justify-center"></div>
            <div className="bg-white h-screen flex items-center justify-center">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center w-96">
                    <h2 className="text-2xl font-semibold">Reset Password</h2>
                    <p className="text-xs font-light pb-4">Masukkan password baru</p>

                    {/* Password */}
                    <fieldset className="fieldset mb-2 relative">
                        <legend className="fieldset-legend font-normal">Password baru</legend>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Type here"
                            {...register("password")}
                            className={`input input-sm w-full pr-10 ${errors.password ? "input-error" : ""}`}
                        />
                        <span
                            className="absolute right-3 top-3 cursor-pointer text-lg text-gray-500"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <PiEye /> : <PiEyeClosed />}
                        </span>
                        {errors.password && (
                            <span className="text-sm text-error">{errors.password.message}</span>
                        )}
                    </fieldset>

                    {/* Konfirmasi Password */}
                    <fieldset className="fieldset mb-2 relative">
                        <legend className="fieldset-legend font-normal">Validasi password baru</legend>
                        <input
                            type={showConfirm ? "text" : "password"}
                            placeholder="Type here"
                            {...register("confirmPassword")}
                            className={`input input-sm w-full pr-10 ${errors.confirmPassword ? "input-error" : ""
                                }`}
                        />
                        <span
                            className="absolute right-3 top-3 cursor-pointer text-lg text-gray-500"
                            onClick={() => setShowConfirm(!showConfirm)}
                        >
                            {showConfirm ? <PiEye /> : <PiEyeClosed />}
                        </span>
                        {errors.confirmPassword && (
                            <span className="text-sm text-error">{errors.confirmPassword.message}</span>
                        )}
                    </fieldset>

                    <div className="self-end pt-4">
                        <button type="submit" className="btn w-32">
                            Submit
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal */}
            <input type="checkbox" id="reset-modal" className="modal-toggle" />
            <div className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Informasi</h3>
                    <p className="py-4">{modalMessage}</p>
                    <div className="modal-action">
                        <label
                            htmlFor="reset-modal"
                            className="btn"
                            onClick={() => {
                                if (modalMessage.includes("berhasil")) navigate("/login");
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
