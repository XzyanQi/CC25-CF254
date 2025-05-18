import React, { useState } from "react";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { register as registerApi } from "../api/auth";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object().shape({
    name: yup.string().required("Nama wajib diisi"),
    email: yup.string().email("Format email tidak valid").required("Email wajib diisi"),
    password: yup
        .string()
        .required('Password wajib diisi')
        .min(8, 'Minimal 8 karakter')
        .matches(/[0-9]/, 'Harus mengandung angka')
        .matches(/[!@#$%^&*]/, 'Harus mengandung simbol (!@#$%^&*)'),
});

export default function RegisterPage() {
    const navigate = useNavigate();
    const [modalMessage, setModalMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        mode: "onTouched",
    });

    const onSubmit = async (data) => {
        try {
            const response = await registerApi(data);
            if (response.status === 201) {
                console.log("Berhasil daftar:", response.data);
                navigate("/login");
            } else {
                console.log("Gagal mendaftar");
                setModalMessage("Pendaftaran gagal. Silakan coba lagi.");
                document.getElementById("register-error-modal").checked = true;
            }
        } catch (error) {
            console.log(error);
            setModalMessage("Terjadi kesalahan saat registrasi.");
            document.getElementById("register-error-modal").checked = true;
        }
    };

    return (
        <section className="grid grid-cols-2">
            <div className="bg-primary h-screen flex items-center justify-center"></div>
            <div className="bg-white h-screen flex items-center justify-center">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center w-96">
                    <h2 className="text-2xl font-semibold">Register</h2>
                    <p className="text-xs font-light pb-4">Silahkan isi kolom di bawah untuk registrasi</p>

                    <fieldset className="fieldset mb-2">
                        <legend className="fieldset-legend font-normal">name</legend>
                        <input
                            type="text"
                            placeholder="Type here"
                            {...register("name")}
                            className={`input input-sm w-full ${errors.name ? "input-error" : ""}`}
                        />
                        {errors.name && <span className="text-sm text-error">{errors.name.message}</span>}
                    </fieldset>

                    <fieldset className="fieldset mb-2">
                        <legend className="fieldset-legend font-normal">email</legend>
                        <input
                            type="text"
                            placeholder="Type here"
                            {...register("email")}
                            className={`input input-sm w-full ${errors.email ? "input-error" : ""}`}
                        />
                        {errors.email && <span className="text-sm text-error">{errors.email.message}</span>}
                    </fieldset>

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

                    <u className="text-xs font-light cursor-pointer" onClick={() => navigate("/login")}>
                        Sudah memiliki akun?
                    </u>
                    <div className="self-end pt-4">
                        <button type="submit" className="btn w-32">
                            Next
                        </button>
                    </div>
                </form>
            </div>

            <input type="checkbox" id="register-error-modal" className="modal-toggle" />
            <div className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Terjadi Kesalahan</h3>
                    <p className="py-4">{modalMessage}</p>
                    <div className="modal-action">
                        <label htmlFor="register-error-modal" className="btn">
                            Tutup
                        </label>
                    </div>
                </div>
            </div>
        </section>
    );
}
