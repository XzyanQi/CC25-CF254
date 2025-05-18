import React, { useState } from 'react';
import { PiEye, PiEyeClosed  } from "react-icons/pi";
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
    email: yup.string().email('Format email tidak valid').required('Email wajib diisi'),
    password: yup
        .string()
        .required('Password wajib diisi')
        .min(8, 'Minimal 8 karakter')
        .matches(/[0-9]/, 'Harus mengandung angka')
        .matches(/[!@#$%^&*]/, 'Harus mengandung simbol (!@#$%^&*)'),
});

export default function LoginPage() {
    const navigate = useNavigate();
    const [modalMessage, setModalMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        mode: 'onTouched',
    });

    const onSubmit = async (data) => {
        try {
            const response = await login(data);
            if (response.status === 200) {
                document.cookie = `token=${response.data.data.token}; path=/;`;
            } else {
                setModalMessage('Login gagal. Silakan periksa email atau password Anda.');
                document.getElementById('error-modal').checked = true;
            }
        } catch (error) {
            console.error(error);
            setModalMessage('Terjadi kesalahan saat login.');
            document.getElementById('error-modal').checked = true;
        }
    };

    return (
        <section className="grid grid-cols-2">
            <div className="bg-primary h-screen flex items-center justify-center"></div>
            <div className="bg-white h-screen flex items-center justify-center">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center w-96">
                    <h2 className="text-2xl font-semibold">Login</h2>
                    <p className="text-xs font-light pb-4">Selamat datang kembali!, silahkan login</p>

                    <fieldset className="fieldset mb-2">
                        <legend className="fieldset-legend font-normal">email</legend>
                        <input
                            type="text"
                            placeholder="Email"
                            {...register('email')}
                            className={`input input-sm w-full ${errors.email ? 'input-error' : ''}`}
                        />
                        {errors.email && (
                            <span className="text-sm text-error mt-1">{errors.email.message}</span>
                        )}
                    </fieldset>

                    <fieldset className="fieldset mb-2 relative">
                        <legend className="fieldset-legend font-normal">Password</legend>
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

                    <u
                        className="text-xs font-light cursor-pointer mb-4"
                        onClick={() => navigate('/forget')}
                    >
                        Lupa password?
                    </u>

                    <div className="self-end">
                        <button className="btn btn-primary w-full" type="submit">
                            Login
                        </button>
                    </div>
                </form>
            </div>

            <input type="checkbox" id="error-modal" className="modal-toggle" />
            <div className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Login Gagal</h3>
                    <p className="py-4">{modalMessage}</p>
                    <div className="modal-action">
                        <label htmlFor="error-modal" className="btn">
                            Tutup
                        </label>
                    </div>
                </div>
            </div>
        </section>
    );
}
