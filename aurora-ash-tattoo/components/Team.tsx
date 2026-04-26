"use client";

import { motion } from 'framer-motion';

const team = [
  { id: 1, name: 'Alex White North', role: 'Lead Artist / Blackwork', img: '/portfolio/alex.png' },
  { id: 2, name: 'Aurora', role: 'Fine Line / Ornamental', img: '/portfolio/aurora.png' },
  { id: 3, name: 'Julian', role: 'Minimalism / Dark Art', img: '/portfolio/julian.png' }
];

export default function Team() {
  return (
    <section id="team" className="py-24 bg-[#121212] text-[#D4AF37]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-5xl font-serif text-center mb-20 tracking-[0.2em] uppercase italic">The Artists</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {team.map((member) => (
            <motion.div 
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="relative h-[500px] overflow-hidden border border-[#D4AF37]/20 transition-all duration-500 group-hover:border-[#D4AF37] rounded-sm">
                <img 
                  src={member.img} 
                  alt={member.name} 
                  className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-80" />
              </div>
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-serif tracking-widest uppercase mb-2">{member.name}</h3>
                <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]/60 italic">{member.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
