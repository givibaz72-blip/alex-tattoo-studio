"use client";
export default function Footer() {
  return (
    <footer className="bg-[#121212] text-[#D4AF37] py-4">
      <div className="max-w-7xl mx-auto flex justify-center space-x-6">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
          Instagram
        </a>
        <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="hover:underline">
          WhatsApp
        </a>
      </div>
    </footer>
  );
}
