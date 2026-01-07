import React, { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { Link, useNavigate } from "react-router-dom";
import * as yup from "yup";
import { register as registerApi } from "../api/auth";
import mindfulnessLogo from "../assets/mindfulness.png";

const schema = yup.object().shape({
  name: yup.string().required("Nama wajib diisi"),
  email: yup.string().email("Format email tidak valid").required("Email wajib diisi"),
  password: yup
    .string()
    .required("Password wajib diisi")
    .min(8, "Minimal 8 karakter")
    .matches(/[0-9]/, "Harus mengandung setidaknya satu angka")
    .matches(/[!@#$%^&*?]/, "Harus mengandung simbol (!@#$%^&*?)"),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [modalMessage, setModalMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setModalMessage("");
    try {
      const response = await registerApi(data);
      if (response.status === 201 || response.status === 200) {
        setModalMessage("Registrasi berhasil! Anda akan diarahkan ke halaman login dalam beberapa detik.");
        const successModal = document.getElementById("register-success-modal");
        if (successModal) successModal.checked = true;

        setTimeout(() => {
          const successModalToClose = document.getElementById("register-success-modal");
          if (successModalToClose) successModalToClose.checked = false;
          navigate("/login");
        }, 3000);
      } else {
        const errorMessage =
          response?.data?.message || "Pendaftaran gagal. Silakan periksa kembali data Anda.";
        setModalMessage(errorMessage);
        const errorModal = document.getElementById("register-error-modal");
        if (errorModal) errorModal.checked = true;
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Terjadi kesalahan saat registrasi. Pastikan semua data valid dan coba lagi.";
      setModalMessage(errorMessage);
      const errorModal = document.getElementById("register-error-modal");
      if (errorModal) errorModal.checked = true;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid md:grid-cols-2 min-h-screen">
      {/* Kiri (tebak) */}
      <div className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 md:flex hidden flex-col items-center justify-center p-8 lg:p-12 text-white">
        <UserPlus size={86} className="mb-6 text-purple-200" />
        <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-center leading-tight">
          BERGABUNG DENGAN KAMI
        </h1>
        <p className="text-center text-sm lg:text-base max-w-md text-purple-100">
          Buat akun untuk memulai perjalanan mindfulness Anda dan dapatkan akses ke semua fitur yang menenangkan.
        </p>
      </div>

      {/* Kanan */}
      <div className="bg-white flex items-center justify-center p-5 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md">
          <div className="mb-6 text-center">
            <img
              src={mindfulnessLogo}
              alt="Mindfulness Logo"
              className="w-48 sm:w-56 md:w-64 h-auto mx-auto mb-4"
            />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Register</h2>
            <p className="text-sm text-gray-500 mt-1">Silakan isi data diri Anda.</p>
          </div>

          <div className="space-y-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend font-normal text-gray-600">Nama Lengkap</legend>
              <input
                type="text"
                autoComplete="name"
                placeholder="Masukkan nama lengkap Anda"
                {...register("name")}
                className={`input input-bordered w-full ${errors.name ? "input-error" : ""}`}
              />
              {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend font-normal text-gray-600">Email</legend>
              <input
                type="email"
                autoComplete="email"
                placeholder="contoh@email.com"
                {...register("email")}
                className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
              />
              {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
            </fieldset>

            <fieldset className="fieldset relative">
              <legend className="fieldset-legend font-normal text-gray-600">Password</legend>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Buat password Anda"
                  {...register("password")}
                  className={`input input-bordered w-full pr-10 ${errors.password ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <PiEye /> : <PiEyeClosed />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
            </fieldset>

            <button type="submit" className="btn btn-primary w-full disabled:opacity-50" disabled={isSubmitting}>
              {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : "Register"}
            </button>

            <p className="text-center text-sm text-gray-600">
              Sudah memiliki akun?{" "}
              <Link to="/login" className="font-medium text-blue-600 hover:underline">
                Login di sini
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Modal Error */}
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

      {/* Modal Sukses */}
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
