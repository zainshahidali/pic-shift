import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ImageConverter from './components/ImageConverter';
import ImageResizer from './components/ImageResizer';
import ImageToPdf from './components/ImageToPdf';
import ImageToWord from './components/ImageToWord';

function App() {
  const [activeTab, setActiveTab] = useState('converter');

  const renderTool = () => {
    switch (activeTab) {
      case 'converter': return <ImageConverter />;
      case 'resizer': return <ImageResizer />;
      case 'pdf': return <ImageToPdf />;
      case 'word': return <ImageToWord />;
      default: return <ImageConverter />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background Ornaments */}
      <div className="fixed top-[-10%] left-[-5%] w-[45%] h-[45%] bg-emerald-600/10 blur-[130px] rounded-full -z-10 animate-pulse"></div>
      <div className="fixed bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-cyan-600/10 blur-[130px] rounded-full -z-10"></div>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        {renderTool()}
      </main>

      <footer className="w-full mt-auto pt-12 pb-8 border-t border-white/5 text-slate-600 text-xs flex flex-col items-center gap-4">
        <div className="flex gap-8 font-bold uppercase tracking-[0.2em]">
          <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">Github</a>
          <a href="#" className="hover:text-teal-400 transition-colors">Terms</a>
        </div>
        <p className="font-medium">© 2026 PicShift. No servers, local processing, peak performance.</p>
      </footer>
    </div>
  );
}

export default App;
