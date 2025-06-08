import { Play, Star, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import mindfulnessLogo from '../assets/mindfulness.png';
import { useAuth } from '../provider/AuthProvider';

import mt1Jpg from '../assets/mt1.jpg';
import mt2Jpg from '../assets/mt2.jpg';
import mtJpg from '../assets/mt3.jpg';

React
const Homepage = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const imagesForSlideshow = [mtJpg, mt1Jpg, mt2Jpg];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const auth = useAuth(); 

  const testimonials = [
    {
      name: "Sarah",
      role: "Mahasiswa",
      rating: 5,
      text: "Mindfulness sangat membantu saya dalam mengelola stres dan kecemasan."
    },
    {
      name: "Yosua",
      role: "Mahasiswa",
      rating: 5,
      text: "Sangat menenangkan dan memberikan perspektif baru."
    },
    {
      name: "San",
      role: "Mahasiswa",
      rating: 5,
      text: "Bagus sarannya untuk mengatasi kecemasan, merasa lebih baik."
    }
  ];

  useEffect(() => {
    const imageTimer = setTimeout(() => {
      if (imagesForSlideshow && imagesForSlideshow.length > 0) {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imagesForSlideshow.length);
      }
    }, 5000); 
    return () => clearTimeout(imageTimer);
  }, [currentImageIndex, imagesForSlideshow]);

  useEffect(() => {
    const testimonialAutoPlayTimer = setTimeout(() => {
      if (testimonials && testimonials.length > 0) {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }
    }, 7000); 

    return () => clearTimeout(testimonialAutoPlayTimer);
  }, [currentTestimonial, testimonials]);

  const handleLogout = () => {
    if (auth && typeof auth.setLogout === 'function') {
      auth.setLogout();
      window.location.href = '/login'; 
    } else {
      console.error("Fungsi setLogout tidak ditemukan pada context atau auth context tidak tersedia.");
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-sm shadow-sm">
    <div className="flex items-center">
    <img 
      src={mindfulnessLogo} 
      alt="Mindfulness Logo" 
      className="h-14 w-auto object-contain" 
    />
    </div>
    <nav className="hidden md:flex space-x-8">
    <a href="#home" className="text-gray-600 hover:text-purple-600 transition-colors">Home</a>
    <a href="/about" className="text-gray-600 hover:text-purple-600 transition-colors">About</a>
    <a href="/chat" className="text-gray-600 hover:text-purple-600 transition-colors">Chatbot</a>
    <a href="#testimoni-section" className="text-gray-600 hover:text-purple-600 transition-colors">Testimoni</a>
    </nav>
    <button
    onClick={handleLogout}
    title="Logout"
    className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
    >
    <User size={20} className="text-gray-700" />
    </button>
    </header>

      {/* Mindfulness*/}
      <section id="home" className="px-6 py-12 text-center relative pt-24 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-3xl opacity-50"></div>
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Dengan Mindfulness
              </h1>
              <p className="text-gray-700 text-lg mb-2">
                Kita bisa belajar cara menghadapi emosi
              </p>
              <p className="text-gray-700 text-lg mb-8">
                dan pikiran kita dengan lebih baik
              </p>
              <a href="/chat" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-semibold transition-colors shadow-lg hover:shadow-xl transform hover:scale-105">
                Mulai Chat
              </a>
            </div>
          </div>
        </div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-blue-200/30 rounded-full blur-xl animate-pulse-slow delay-1000"></div>
      </section>

      {/* Klasifikasi */}
      <section id="about" className="px-6 py-12 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Sistem Klasifikasi</h2>
          <div className="grid md:grid-cols-3 gap-8">
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
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
      <section className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Fitur Unggulan</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="group text-center p-6 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-orange-200/50 group-hover:ring-orange-300 transition-all">
                <User className="text-orange-600 group-hover:text-orange-700 transition-colors" size={36} />
              </div>
              <h3 className="font-semibold text-gray-800 text-lg mb-2 group-hover:text-orange-700 transition-colors">Asisten Virtual</h3>
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
              <h3 className="font-semibold text-gray-800 text-lg mb-2 group-hover:text-purple-700 transition-colors">Guided Sessions</h3>
              <p className="text-gray-600 text-sm">Sesi meditasi terpandu untuk pemula hingga ahli.</p>
            </a>
          </div>
        </div>
      </section>

      {/* Galeri Inspirasi Mindfulness (Slideshow) */}
      <section className="px-6 py-12 scroll-mt-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Galeri Inspirasi Mindfulness</h2>
          <div className="relative w-full h-80 md:h-[500px] bg-gray-200 rounded-xl shadow-xl overflow-hidden mx-auto group">
            <img
              key={currentImageIndex}
              src={imagesForSlideshow[currentImageIndex]}
              alt={`Inspirasi Mindfulness ${currentImageIndex + 1}`}
              className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            />
          </div>
        </div>
      </section>

      {/* Testimoni */}
      <section id="testimoni-section" className="px-6 py-12 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Testimoni</h2>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 relative overflow-hidden min-h-[300px] flex items-center justify-center">
            <div className="text-center px-4 md:px-8 w-full">
              <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center ring-4 ring-purple-200/50">
                <User className="text-purple-600" size={32} />
              </div>
              <h3 className="font-semibold text-gray-800 text-xl mb-1">
                {testimonials[currentTestimonial].name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {testimonials[currentTestimonial].role}
              </p>
              <div className="flex justify-center mb-4 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < testimonials[currentTestimonial].rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                  />
                ))}
              </div>
              <p className="text-gray-700 italic text-base leading-relaxed">
                "{testimonials[currentTestimonial].text}"
              </p>
            </div>
          </div>
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                aria-label={`Pindah ke testimoni ${index + 1}`}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial ? 'bg-purple-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10 px-6 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Mindfulness. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
