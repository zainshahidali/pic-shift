'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import ImageConverter from '../components/ImageConverter';
import ImageResizer from '../components/ImageResizer';
import ImageToPdf from '../components/ImageToPdf';
import ImageToWord from '../components/ImageToWord';
import PrivacyPolicy from '../components/PrivacyPolicy';
import TermsOfService from '../components/TermsOfService';

export default function Home() {
  const [activeTab, setActiveTab] = useState('converter');

  const renderTool = () => {
    switch (activeTab) {
      case 'converter': return <ImageConverter />;
      case 'resizer': return <ImageResizer />;
      case 'pdf': return <ImageToPdf />;
      case 'word': return <ImageToWord />;
      case 'privacy': return <PrivacyPolicy />;
      case 'terms': return <TermsOfService />;
      default: return <ImageConverter />;
    }
  };

  return (
    <>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        {renderTool()}
      </main>

      <footer className="w-full mt-auto pt-12 pb-8 border-t border-white/5 text-slate-600 text-xs flex flex-col items-center gap-4">
        <div className="flex gap-8 font-bold uppercase tracking-[0.2em]">
          <button onClick={() => setActiveTab('privacy')} className="hover:text-emerald-400 transition-colors cursor-pointer">Privacy</button>
          <button onClick={() => setActiveTab('terms')} className="hover:text-teal-400 transition-colors cursor-pointer">Terms</button>
        </div>
        <p className="font-medium">© 2026 PicShift | All Rights Reserved. </p>
      </footer>
    </>
  );
}
