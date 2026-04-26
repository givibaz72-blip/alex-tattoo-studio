"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

export default function InquiryPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ artist: '', vision: '', placement: '', size: '', name: '', contact: '' });

  const artists = [
    { id: 'alex', name: 'Alex White North', style: 'Blackwork & Realism', img: '/portfolio/alex.png' },
    { id: 'aurora', name: 'Aurora White', style: 'Fine Line & Ornamental', img: '/portfolio/aurora.png' },
    { id: 'julian', name: 'Julian White', style: 'Minimalism & Dark Art', img: '/portfolio/julian.png' }
  ];

  return (
    <main className="min-h-screen bg-[#121212] text-[#D4AF37] p-6 md:p-10 flex flex-col items-center justify-center relative">
      <Link href="/" className="absolute top-6 right-6 md:top-10 md:right-10 text-4xl hover:scale-110 transition-transform z-50">✕</Link>
      <div className="mb-12 flex space-x-3 w-full max-w-md">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`h-1 flex-1 transition-all duration-500 ${step >= s ? 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]' : 'bg-white/10'}`} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div 
          key={step} 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-5xl flex flex-col items-center"
        >
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              {artists.map(a => (
                <div 
                  key={a.id} 
                  className={`group cursor-pointer border-2 rounded-xl overflow-hidden transition-all duration-500 ${formData.artist === a.id ? 'border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)] scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  onClick={() => setFormData(prev => ({ ...prev, artist: a.id }))}
                >
                  <div className="h-80 overflow-hidden">
                    <img src={a.img} alt={a.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className={`p-4 text-center transition-colors ${formData.artist === a.id ? 'bg-[#D4AF37] text-black' : 'bg-[#1a1a1a]'}`}> 
                    <h3 className="font-serif text-xl tracking-widest uppercase">{a.name}</h3>
                    <p className="text-xs mt-1 opacity-80 uppercase tracking-tighter">{a.style}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="w-full max-w-2xl text-center">
              <h2 className="text-3xl font-serif mb-8 tracking-widest uppercase italic">Your Vision</h2>
              <textarea 
                name="vision" 
                value={formData.vision} 
                onChange={(e) => setFormData(p => ({...p, vision: e.target.value}))}
                placeholder="Describe the story or symbols you want to carry on your skin..." 
                className="w-full h-48 bg-transparent border-b border-[#D4AF37]/30 focus:border-[#D4AF37] focus:outline-none text-[#D4AF37] text-xl p-4 transition-colors resize-none"
              />
            </div>
          )}
          {step === 3 && (
            <div className="w-full max-w-xl space-y-12">
              <div className="flex flex-col items-center">
                <label className="text-sm uppercase tracking-[0.3em] mb-4 opacity-60">Placement</label>
                <input type="text" placeholder="Forearm, ribs, spine..." value={formData.placement} onChange={(e) => setFormData(p => ({...p, placement: e.target.value}))} className="w-full bg-transparent border-b border-[#D4AF37]/30 text-center text-2xl focus:border-[#D4AF37] focus:outline-none py-2" />
              </div>
              <div className="flex flex-col items-center">
                <label className="text-sm uppercase tracking-[0.3em] mb-4 opacity-60">Approximate Size (cm)</label>
                <input type="text" placeholder="e.g. 15x10" value={formData.size} onChange={(e) => setFormData(p => ({...p, size: e.target.value}))} className="w-full bg-transparent border-b border-[#D4AF37]/30 text-center text-2xl focus:border-[#D4AF37] focus:outline-none py-2" />
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="w-full max-w-xl space-y-10 flex flex-col items-center">
              <h2 className="text-2xl font-serif mb-4 tracking-widest uppercase">Contact Details</h2>
              <input type="text" placeholder="YOUR FULL NAME" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} className="w-full bg-transparent border-b border-[#D4AF37]/30 text-center text-2xl focus:border-[#D4AF37] focus:outline-none py-4" />
              <input type="text" placeholder="TELEGRAM OR EMAIL" value={formData.contact} onChange={(e) => setFormData(p => ({...p, contact: e.target.value}))} className="w-full bg-transparent border-b border-[#D4AF37]/30 text-center text-2xl focus:border-[#D4AF37] focus:outline-none py-4" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="mt-16 flex space-x-12 items-center">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors uppercase tracking-[0.2em] text-sm">Back</button>
        )}
        <button 
          onClick={() => step < 4 ? setStep(step + 1) : alert('The Portal has received your request.')} 
          disabled={step === 1 && !formData.artist}
          className={`px-12 py-3 border border-[#D4AF37] uppercase tracking-[0.3em] text-sm transition-all duration-300 ${step === 1 && !formData.artist ? 'opacity-20 cursor-not-allowed' : 'hover:bg-[#D4AF37] hover:text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]'}`}
        >
          {step === 4 ? 'Submit' : 'Next'}
        </button>
      </div>
    </main>
  );
}
