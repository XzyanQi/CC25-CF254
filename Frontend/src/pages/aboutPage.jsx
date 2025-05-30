import { User } from 'lucide-react';
import React from 'react';
import mindfulnessLogo from '../assets/mindfulness.png';
import heroBgAbout from '../assets/mt.jpg';

React
const teamMembers = [
  { name: "Sulistiani", role: "Machine Learning Engineer" },
  { name: "Faqih Muhammad Ihsan", role: "Machine Learning Engineer" },
  { name: "Revo Hendriansyah", role: "Machine Learning Engineer" },
  { name: "Andi Surya Priyadi", role: "Front End and Back End Developer" },
  { name: "Ibnu Fajar", role: "Front End and Back End Developer" },
  { name: "Anggreany Dwi Andiny", role: "Front End and Back End Developer" },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <img 
            src={mindfulnessLogo} 
            alt="Mindfulness Logo" 
            className="h-10 w-auto" 
          />
          <span className="font-semibold text-gray-800 text-xl">Mindfulness</span>
        </div>
        <nav className="hidden md:flex space-x-8">
          <a href="/home" className="text-gray-600 hover:text-purple-600 transition-colors">Home</a>
          <a href="#about-intro" className="text-gray-600 hover:text-purple-600 transition-colors">About Us</a>
          <a href="/chat" className="text-gray-600 hover:text-purple-600 transition-colors">Chatbot</a>
          <a href="#about-testimonials-info" className="text-gray-600 hover:text-purple-600 transition-colors">Testimoni</a>
        </nav>
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
          <User size={20} className="text-gray-700" />
        </div>
      </header>

      <section
        id="about-hero" 
        className="relative h-[40vh] md:h-[50vh] bg-cover bg-center flex items-center justify-center text-white scroll-mt-20"
        style={{ backgroundImage: `url(${heroBgAbout})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold">Tentang Mindfulness</h1>
        </div>
      </section>

      {/* Perkenalan*/}
      <section id="about-intro" className="px-6 py-16 text-center scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
            Mindfulness merupakan chatbot yang dapat membantu mahasiswa mengatasi masalah kesehatan mental mereka. Chatbot ini dibangun agar dapat jadi ruang aman dan privat bagi mahasiswa untuk bercerita mengenai masalah yang sedang dihadapi.
          </p>
        </div>
      </section>

      {/* Team */}
      <section id="our-team" className="px-6 py-16 bg-white/50 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Tim Kami</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{member.name}</h3>
                <p className="text-sm text-purple-700">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Info Chatbot */}
      <section id="about-chatbot-info" className="px-6 py-16 scroll-mt-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Tentang Chatbot Kami</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            Informasi mendalam mengenai bagaimana chatbot Mindfulness dirancang, teknologi yang digunakan, dan pendekatannya dalam membantu pengguna. Kami fokus pada interaksi yang empatik dan solusi berbasis mindfulness.
          </p>
        </div>
      </section>

      {/* Info Testimoni */}
      <section id="about-testimonials-info" className="px-6 py-16 bg-white/50 scroll-mt-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Makna Testimoni</h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            Di sini Anda dapat menjelaskan bagaimana testimoni dikumpulkan, mengapa penting bagi kami, dan bagaimana cerita pengguna lain dapat memberikan inspirasi dan dukungan bagi komunitas Mindfulness.
          </p>
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

export default AboutPage;