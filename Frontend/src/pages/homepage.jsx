import React, { useEffect, useMemo, useState } from "react";
import { Menu, Play, Star, User } from "lucide-react";
import mindfulnessLogo from "../assets/mindfulness.png";
import { useAuth } from "../provider/AuthProvider";

import mt1Jpg from "../assets/mt1.jpg";
import mt2Jpg from "../assets/mt2.jpg";
import mtJpg from "../assets/mt3.jpg";

const Homepage = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const auth = useAuth();

  const imagesForSlideshow = useMemo(() => [mtJpg, mt1Jpg, mt2Jpg], []);
  const testimonials = useMemo(
    () => [
      {
        name: "Sarah",
        role: "Mahasiswa",
        rating: 5,
        text: "Mindfulness sangat membantu saya dalam mengelola stres dan kecemasan.",
      },
      {
        name: "Yosua",
        role: "Mahasiswa",
        rating: 5,
        text: "Sangat menenangkan dan memberikan perspektif baru.",
      },
      {
        name: "San",
        role: "Mahasiswa",
        rating: 5,
        text: "Bagus sarannya untuk mengatasi kecemasan, merasa lebih baik.",
      },
    ],
    []
  );

  useEffect(() => {
    if (!imagesForSlideshow.length) return;
    const id = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagesForSlideshow.length);
    }, 5000);
    return () => clearInterval(id);
  }, [imagesForSlideshow.length]);

  useEffect(() => {
    if (!testimonials.length) return;
    const id = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(id);
  }, [testimonials.length]);

  const handleLogout = () => {
    if (auth && typeof auth.setLogout === "function") {
      auth.setLogout();
      window.location.href = "/login";
    } else {
      console.error("Fungsi setLogout tidak ditemukan pada context.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-6 py-2 bg-white/80 backdrop-blur-sm shadow-sm h-[72px]">
        <div className="flex items-center h-full">
          <div className="h-full flex items-center overflow-hidden">
            <img
              src={mindfulnessLogo}
              alt="Mindfulness Logo"
              className="h-full max-h-[56px] sm:max-h-[60px] w-auto object-contain"
            />
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-8">
          <a href="#home" className="text-gray-600 hover:text-purple-600 transition-colors">
            Home
          </a>
          <a href="/about" className="text-gray-600 hover:text-purple-600 transition-colors">
            About
          </a>
          <a href="/chat" className="text-gray-600 hover:text-purple-600 transition-colors">
            Chatbot
          </a>
          <a href="#testimoni-section" className="text-gray-600 hover:text-purple-600 transition-colors">
            Testimoni
          </a>
        </nav>

        {/* Mobile menu + Logout */}
        <div className="flex items-center gap-2">
          <div className="dropdown dropdown-end md:hidden">
            <button type="button" className="btn btn-ghost btn-circle" aria-label="Menu">
              <Menu className="text-gray-700" size={22} />
            </button>
            <ul className="menu dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a href="#home">Home</a>
              </li>
              <li>
                <a href="/about">About</a>
              </li>
              <li>
                <a href="/chat">Chatbot</a>
              </li>
              <li>
                <a href="#testimoni-section">Testimoni</a>
              </li>
            </ul>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <User size={20} className="text-gray-700" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="px-4 sm:px-6 py-10 sm:py-12 text-center relative scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-3xl opacity-50"></div>
            <div className="relative z-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Dengan Mindfulness
              </h1>
              <p className="text-gray-700 text-base sm:text-lg mb-2">
                Kita bisa belajar cara menghadapi emosi
              </p>
              <p className="text-gray-700 text-base sm:text-lg mb-8">
                dan pikiran kita dengan lebih baik
              </p>
              <a
                href="/chat"
                className="inline-flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white px-7 sm:px-8 py-3 rounded-full font-semibold transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Mulai Chat
              </a>
            </div>
          </div>
        </div>
        <div className="absolute top-16 left-6 sm:left-10 w-24 sm:w-32 h-24 sm:h-32 bg-purple-200/30 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-16 right-6 sm:right-10 w-20 sm:w-24 h-20 sm:h-24 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
      </section>

      {/* Klasifikasi */}
      <section id="about" className="px-4 sm:px-6 py-10 sm:py-12 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-10 sm:mb-12">
            Sistem Klasifikasi
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 ring-4 ring-purple-200/50">
                <div className="w-6 h-6 bg-purple-600 rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-800 text-lg mb-2">Anxiety Call</h3>
              <p className="text-gray-600 text-sm">
                Mengenali dan mengatasi gejala kecemasan dengan teknik mindfulness yang terbukti efektif.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 ring-4 ring-blue-200/50">
                <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-800 text-lg mb-2">Stressful Stress</h3>
              <p className="text-gray-600 text-sm">
                Panduan lengkap untuk mengelola stres harian dengan pendekatan mindfulness.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1 sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 ring-4 ring-green-200/50">
                <div className="w-6 h-6 bg-green-600 rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-800 text-lg mb-2">Depression</h3>
              <p className="text-gray-600 text-sm">
                Dukungan dan teknik mindfulness untuk membantu mengatasi perasaan depresi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur Unggulan */}
      <section className="px-4 sm:px-6 py-10 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-10 sm:mb-12">
            Fitur Unggulan
          </h2>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="group text-center p-6 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-orange-200/50 group-hover:ring-orange-300 transition-all">
                <User className="text-orange-600 group-hover:text-orange-700 transition-colors" size={36} />
              </div>
              <h3 className="font-semibold text-gray-800 text-lg mb-2 group-hover:text-orange-700 transition-colors">
                Asisten Virtual
              </h3>
              <p className="text-gray-600 text-sm">Dapatkan bantuan 24/7 dari asisten mindfulness.</p>
            </div>

            <a
              href="http://www.youtube.com/playlist?list=PLEOV_YgMmlPPzeMvkmqP1UbRNoGYG0bV8"
              target="_blank"
              rel="noopener noreferrer"
              className="group text-center block p-6 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-purple-200/50 group-hover:ring-purple-300 transition-all">
                <Play className="text-purple-600 group-hover:text-purple-700 transition-colors" size={36} />
              </div>
              <h3 className="font-semibold text-gray-800 text-lg mb-2 group-hover:text-purple-700 transition-colors">
                Guided Sessions
              </h3>
              <p className="text-gray-600 text-sm">Sesi meditasi terpandu untuk pemula hingga ahli.</p>
            </a>
          </div>
        </div>
      </section>

      {/* Galeri Slideshow */}
      <section className="px-4 sm:px-6 py-10 sm:py-12 scroll-mt-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-10 sm:mb-12">
            Galeri Inspirasi Mindfulness
          </h2>
          <div className="relative w-full bg-gray-200 rounded-xl shadow-xl overflow-hidden mx-auto">
            <div className="aspect-[16/10] sm:aspect-[16/9] md:aspect-[16/8]">
              <img
                key={currentImageIndex}
                src={imagesForSlideshow[currentImageIndex]}
                alt={`Inspirasi Mindfulness ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimoni */}
      <section id="testimoni-section" className="px-4 sm:px-6 py-10 sm:py-12 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-10 sm:mb-12">
            Testimoni
          </h2>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden min-h-[280px] sm:min-h-[300px] flex items-center justify-center">
            <div className="text-center px-2 sm:px-6 w-full">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center ring-4 ring-purple-200/50">
                <User className="text-purple-600" size={28} />
              </div>
              <h3 className="font-semibold text-gray-800 text-lg sm:text-xl mb-1">
                {testimonials[currentTestimonial].name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">{testimonials[currentTestimonial].role}</p>

              <div className="flex justify-center mb-4 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < testimonials[currentTestimonial].rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>

              <p className="text-gray-700 italic text-sm sm:text-base leading-relaxed">
                "{testimonials[currentTestimonial].text}"
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-6 sm:mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                aria-label={`Pindah ke testimoni ${index + 1}`}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial ? "bg-purple-600 scale-125" : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10 px-4 sm:px-6 mt-10 sm:mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Mindfulness. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
