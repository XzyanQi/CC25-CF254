import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserByEmail } from "../api/user";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object().shape({
  email: yup.string().email("Format email tidak valid").required("Email wajib diisi"),
});

export default function ForgetPage() {
  const navigate = useNavigate();
  const [modalMessage, setModalMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = async ({ email }) => {
    try {
      const response = await getUserByEmail(email);
      console.log(response);
      
      if (response.status === 200) {
        localStorage.setItem("email", email);
        navigate("/reset");
      } else {
        setModalMessage("Email tidak ditemukan.");
        document.getElementById("forget-error-modal").checked = true;
      }
    } catch (error) {
        console.error(error, "tes");
      setModalMessage("Email tidak ditemukan atau terjadi kesalahan.");
      document.getElementById("forget-error-modal").checked = true;
    }
  };

  return (
    <section className="grid grid-cols-2">
      <div className="bg-primary h-screen flex items-center justify-center"></div>
      <div className="bg-white h-screen flex items-center justify-center">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center w-96">
          <h2 className="text-2xl font-semibold">Forget Password?</h2>
          <p className="text-xs font-light pb-4">
            Masukan email yang ingin dirubah passwordnya
          </p>

          {/* Email */}
          <fieldset className="fieldset mb-2">
            <legend className="fieldset-legend font-normal">email</legend>
            <input
              type="text"
              placeholder="Type here"
              {...register("email")}
              className={`input input-sm w-full ${errors.email ? "input-error" : ""}`}
            />
            {errors.email && (
              <span className="text-sm text-error mt-1">{errors.email.message}</span>
            )}
          </fieldset>

          <div className="self-end pt-4">
            <button className="btn w-32" type="submit">
              Next
            </button>
          </div>
        </form>
      </div>

      {/* Modal error */}
      <input type="checkbox" id="forget-error-modal" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Terjadi Kesalahan</h3>
          <p className="py-4">{modalMessage}</p>
          <div className="modal-action">
            <label htmlFor="forget-error-modal" className="btn">
              Tutup
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
