"use client";
import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="h-screen flex flex-col items-center justify-center bg-[#121212] text-[#D4AF37] px-4 text-center">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        className="text-6xl md:text-8xl font-serif tracking-tight mb-4"
      >
        AURORA <span className="font-serif italic text-4xl md:text-6xl">&</span> ASH
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="text-xl md:text-2xl font-inter uppercase tracking-[0.4em] mb-12"
      >
        WE FEEL IT
      </motion.p>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="text-[10px] uppercase tracking-[0.5em] opacity-40 absolute bottom-12"
      >
        EST. 2026 — BY APPOINTMENT ONLY
      </motion.p>
    </section>
  );
};
export default Hero;
