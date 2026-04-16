'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeftRight, Maximize, FileText, FileType, Menu, X } from 'lucide-react';

const tabs = [
  { id: 'converter', label: 'Image Converter', icon: ArrowLeftRight },
  { id: 'resizer', label: 'Image Resizer', icon: Maximize },
  { id: 'pdf', label: 'Image to PDF', icon: FileText },
  { id: 'word', label: 'Image to Word', icon: FileType },
];

export default function Navbar({ activeTab, setActiveTab }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setActiveTab("converter")}
            className="flex items-center gap-3 group cursor-pointer shrink-0"
          >
            <div className="p-2.5 glass group-hover:scale-110 transition-transform duration-300">
              <img className='h-8' src="/Pic Shift Logo.png" alt="PicShift" />
            </div>
            <h1 className="text-2xl font-extrabold gradient-text tracking-tight font-display">PicShift</h1>
          </motion.div>

          {/* Desktop Tabs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center gap-1 ml-10"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </motion.div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X size={24} className="text-slate-400" />
            ) : (
              <Menu size={24} className="text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mobile-menu md:hidden"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileOpen(false);
                  }}
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
