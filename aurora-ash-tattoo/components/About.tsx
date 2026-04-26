"use client";
import React from 'react';

const About = () => {
  return (
    <section className="bg-[#121212] text-[#D4AF37] py-32 px-8 border-t border-[#D4AF37]/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="uppercase tracking-[0.3em] text-[10px] opacity-60 mb-4 font-inter">The Philosophy</p>
          <h2 className="text-5xl font-serif mb-8 leading-tight tracking-tight">A CURATED SPACE FOR PERMANENT ART</h2>
          <p className="text-lg opacity-80 leading-relaxed font-light font-inter">
            We accept limited bookings per month to ensure every piece receives absolute focus. 
            Our studio operates as a private gallery where skin meets curated vision.
          </p>
        </div>
        <div className="border border-[#D4AF37]/20 aspect-[4/5] flex items-center justify-center bg-white/5 relative overflow-hidden">
          <span className="uppercase tracking-[0.4em] text-[9px] opacity-30">Studio Visual // 01</span>
        </div>
      </div>
    </section>
  );
};
export default About;
