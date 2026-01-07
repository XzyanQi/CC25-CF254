import React, { useEffect, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { resetPassword as resetPasswordApi } from "../api/auth";
import mindfulnessLogo from "../assets/mindfulness.png";

const schema = yup.object().shape({
  password: yup
    .string()
    .required("Password wajib diisi")
    .min(8, "Minimal 8 karakter")
    .matches(/[0-9]/, "Harus mengandung angka")
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Harus mengandung simbol"),
  confirmPassword: yup
    .string()
    .required("Konfirmasi password wajib diisi")
    .oneOf([yup.ref("password")], "Password tidak sama"),
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
      navigate("/forget");
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setModalMessage("");

    const payload = { email, newPassword: data.password };

    try {
      const response = await resetPasswordApi(payload);
      if (response.status === 200) {
        localStorage.removeItem("email");
        setModalMessage("Password berhasil diubah! Anda akan diarahkan ke halaman login.");
      } else {
        setModalMessage(response?.data?.message || "Gagal mengubah password. Silakan coba lagi.");
      }
    } catch (error) {
      setModalMessage(error.response?.data?.message || "Terjadi kesalahan saat mengubah password.");
    } finally {
      const modal = document.getElementById("reset-modal");
      if (modal) modal.checked = true;
      setIsSubmitting(false);
    }
  };

  if (!email && !localStorage.getItem("email")) {
    return <div className="flex min-h-screen items-center justify-center px-6">Memuat atau mengalihkan...</div>;
  }

  return (
    <section className="grid md:grid-cols-2 min-h-screen">
      <div className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 md:flex hidden flex-col items-center justify-center p-8 lg:p-12 text-white">
        <ShieldCheck size={86} className="mb-6 text-purple-200" />
        <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-center leading-tight">ATUR ULANG PASSWORD</h1>
        <p className="text-center text-sm lg:text-base max-w-md text-purple-100">
          Buat password baru yang kuat dan mudah Anda ingat untuk keamanan akun Anda.
        </p>
      </div>

      <div className="bg-white flex items-center justify-center p-5 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md">
          <div className="mb-6 text-center">
            <img src={mindfulnessLogo} alt="Mindfulness Logo" className="w-48 sm:w-56 md:w-64 h-auto mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Reset Password</h2>
            <p className="text-sm text-gray-500 mt-1">
              Masukkan password baru untuk akun <span className="font-medium break-all">{email}</span>.
            </p>
          </div>

          <div className="space-y-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend font-normal text-gray-600">Password Baru</legend>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Masukkan password baru"
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

            <fieldset className="fieldset">
              <legend className="fieldset-legend font-normal text-gray-600">Konfirmasi Password Baru</legend>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Ketik ulang password baru"
                  {...register("confirmPassword")}
                  className={`input input-bordered w-full pr-10 ${errors.confirmPassword ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? <PiEye /> : <PiEyeClosed />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>
              )}
            </fieldset>

            <button type="submit" className="btn btn-primary w-full disabled:opacity-50" disabled={isSubmitting}>
              {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : "Reset Password"}
            </button>
          </div>
        </form>
      </div>

      <input type="checkbox" id="reset-modal" className="modal-toggle" />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className={`font-bold text-lg ${modalMessage.toLowerCase().includes("berhasil") ? "text-green-600" : "text-red-600"}`}>
            {modalMessage.toLowerCase().includes("berhasil") ? "Sukses!" : "Terjadi Kesalahan"}
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
