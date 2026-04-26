"use client";
import React from 'react';
import Link from 'next/link';

const NavBar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 py-6 px-8 flex justify-center items-center bg-[#121212]/80 backdrop-blur-md border-b border-[#D4AF37]/10">
      <div className="flex gap-8 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] opacity-80">
        <Link href="/" className="hover:opacity-100 transition-opacity">Home</Link>
        <Link href="#about" className="hover:opacity-100 transition-opacity">About</Link>
        <Link href="#team" className="hover:opacity-100 transition-opacity">Team</Link>
        <Link href="#shop" className="hover:opacity-100 transition-opacity">Shop</Link>
        <Link href="/inquiry" className="font-bold border-b border-[#D4AF37]/40 pb-1">Inquiry</Link>
      </div>
    </nav>
  );
};

export default NavBar;
