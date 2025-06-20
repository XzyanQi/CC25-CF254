import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";

import { KeyRound } from "lucide-react";
import { getUserByEmail } from "../api/user";
import mindfulnessLogo from '../assets/mindfulness.png';

React
const schema = yup.object().shape({
  email: yup.string().email("Format email tidak valid").required("Email wajib diisi"),
});

export default function ForgetPage() {
  const navigate = useNavigate();
  const [modalMessage, setModalMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = async ({ email }) => {
    setIsSubmitting(true);
    setModalMessage("");
    try {
      const response = await getUserByEmail(email); 
      console.log("Forget Password Response:", response);
      
      if (response && response.status === 200 && response.data) { 
       
        
        localStorage.setItem("email", email); 
        navigate("/reset");
      } else {
        setModalMessage(response?.data?.message || "Email tidak terdaftar atau terjadi kesalahan.");
        const errorModal = document.getElementById("forget-error-modal");
        if (errorModal) errorModal.checked = true;
      }
    } catch (error) {
      console.error("Forget Password error:", error);
      const errorMessage = error.response?.data?.message || "Email tidak ditemukan atau terjadi kesalahan server.";
      setModalMessage(errorMessage);
      const errorModal = document.getElementById("forget-error-modal");
      if (errorModal) errorModal.checked = true;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid md:grid-cols-2 h-screen">
      {/* Kolom Kiri untuk Ilustrasi dan Teks Deskripsi */}
      <div className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 h-full md:flex flex-col items-center justify-center p-8 lg:p-12 hidden text-white">
        <KeyRound size={100} className="mb-8 text-purple-300" />
        <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-center leading-tight">
          LUPA EMAIL ANDA?
        </h1>
        <p className="text-center text-sm lg:text-base max-w-md text-purple-100">
          Jangan khawatir! Masukkan email Anda dan kami akan bantu proses pemulihan password.
        </p>
      </div>

      {/* Kolom Kanan untuk Form Lupa Email */}
      <div className="bg-white h-full flex flex-col items-center justify-center p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center w-full max-w-sm">
          <div className="mb-6 text-center">
            <img 
              src={mindfulnessLogo} 
              alt="Mindfulness Logo" 
              className="w-64 h-auto mx-auto mb-4"
            />
            <h2 className="text-3xl font-bold text-gray-800">Lupa Email</h2>
            <p className="text-sm text-gray-500 mt-1">
              Masukkan email akun Anda yang terdaftar.
            </p>
          </div>

          <fieldset className="fieldset mb-6"> 
            <legend className="fieldset-legend font-normal text-gray-600">Email</legend>
            <input
              type="email" 
              placeholder="contoh@email.com"
              {...register("email")}
              className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
            />
            {errors.email && (
              <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>
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
              "Selanjutnya" 
            )}
          </button>
        </form>
      </div>

      {/* Modal untuk Pesan Error */}
      <input type="checkbox" id="forget-error-modal" className="modal-toggle" />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-red-600">Terjadi Kesalahan</h3>
          <p className="py-4">{modalMessage}</p>
          <div className="modal-action">
            <label htmlFor="forget-error-modal" className="btn btn-outline">
              Tutup
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
