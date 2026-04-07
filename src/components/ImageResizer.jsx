import React, { useState, useRef } from 'react';
import { Upload, Download, Trash2, Loader2, X, CheckCircle, Zap, DownloadCloud, Lock, Unlock, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resizeImage, getImageDimensions, formatSize } from '../utils/imageProcessor';
import JSZip from 'jszip';

const PRESETS = [
  { label: '1920 × 1080', w: 1920, h: 1080 },
  { label: '1280 × 720', w: 1280, h: 720 },
  { label: '1024 × 768', w: 1024, h: 768 },
  { label: '800 × 600', w: 800, h: 600 },
  { label: '500 × 500', w: 500, h: 500 },
  { label: '400 × 400', w: 400, h: 400 },
  { label: '200 × 200', w: 200, h: 200 },
];

export default function ImageResizer() {
  const [items, setItems] = useState([]);
  const [targetWidth, setTargetWidth] = useState(1920);
  const [targetHeight, setTargetHeight] = useState(1080);
  const [lockAspect, setLockAspect] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    addFiles(Array.from(e.target.files));
  };

  const addFiles = async (files) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const newItems = [];
    for (const file of imageFiles) {
      try {
        const dims = await getImageDimensions(file);
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          originalFile: file,
          status: 'pending',
          resizedFile: null,
          originalDims: dims,
        });
      } catch {
        // skip unreadable images
      }
    }
    setItems(prev => [...prev, ...newItems]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (id) => setItems(prev => prev.filter(item => item.id !== id));
  const clearAll = () => setItems([]);

  const handleWidthChange = (e) => {
    const w = parseInt(e.target.value) || 0;
    setTargetWidth(w);
    if (lockAspect && items.length > 0) {
      const ratio = items[0].originalDims.height / items[0].originalDims.width;
      setTargetHeight(Math.round(w * ratio));
    }
  };

  const handleHeightChange = (e) => {
    const h = parseInt(e.target.value) || 0;
    setTargetHeight(h);
    if (lockAspect && items.length > 0) {
      const ratio = items[0].originalDims.width / items[0].originalDims.height;
      setTargetWidth(Math.round(h * ratio));
    }
  };

  const applyPreset = (p) => {
    setTargetWidth(p.w);
    setTargetHeight(p.h);
  };

  const resizeFile = async (item) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'resizing' } : i));
    try {
      const resized = await resizeImage(item.originalFile, targetWidth, targetHeight, lockAspect);
      const dims = await getImageDimensions(resized);
      setItems(prev => prev.map(i => i.id === item.id ? {
        ...i,
        status: 'completed',
        resizedFile: resized,
        resizedDims: dims,
      } : i));
    } catch (error) {
      console.error(error);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
    }
  };

  const resizeAll = async () => {
    const pending = items.filter(i => i.status === 'pending');
    for (const item of pending) await resizeFile(item);
  };

  const downloadFile = (item) => {
    if (!item.resizedFile) return;
    const url = URL.createObjectURL(item.resizedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.resizedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    const completed = items.filter(i => i.status === 'completed');
    if (completed.length === 0) return;
    if (completed.length === 1) { downloadFile(completed[0]); return; }

    const zip = new JSZip();
    completed.forEach(item => zip.file(item.resizedFile.name, item.resizedFile));
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resized_images.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      {/* Options Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-center gap-3 mb-6"
      >
        <div className="option-pill">
          <Maximize size={16} className="text-slate-400" />
          <div className="flex flex-col">
            <label>Width (px)</label>
            <input type="number" value={targetWidth} onChange={handleWidthChange} min="1" max="10000" />
          </div>
        </div>

        <button
          onClick={() => setLockAspect(!lockAspect)}
          className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${lockAspect ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400'}`}
          title={lockAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
        >
          {lockAspect ? <Lock size={16} /> : <Unlock size={16} />}
        </button>

        <div className="option-pill">
          <Maximize size={16} className="text-slate-400" />
          <div className="flex flex-col">
            <label>Height (px)</label>
            <input type="number" value={targetHeight} onChange={handleHeightChange} min="1" max="10000" />
          </div>
        </div>

        {items.length > 0 && (
          <button onClick={clearAll} className="option-pill text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer">
            <Trash2 size={16} />
            <span className="text-sm font-bold">Clear</span>
          </button>
        )}
      </motion.div>

      {/* Presets */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-wrap items-center justify-center gap-2 mb-10"
      >
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mr-2">Presets:</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border
              ${targetWidth === p.w && targetHeight === p.h
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-300'}`}
          >
            {p.label}
          </button>
        ))}
      </motion.div>

      {items.length === 0 ? (
        <section className="text-center py-12 md:py-20 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.9] text-white">
              Resize Images <br />
              <span className="theme-gradient-text">Pixel Perfect</span>
            </h2>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              Resize images to exact dimensions with high-quality scaling.
              No quality loss, no uploads — everything stays in your browser.
            </p>
          </motion.div>

          <motion.div
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={`glass-card p-16 md:p-28 text-center border-dashed border-2 transition-all duration-500 cursor-pointer group relative overflow-hidden rounded-3xl
              ${isDragging ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]' : 'border-slate-800 hover:border-emerald-500/30'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <div className="flex flex-col items-center gap-6 relative z-10">
              <div className={`p-8 rounded-[3rem] transition-all duration-700 bg-slate-900/50 group-hover:bg-emerald-500/20 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]
                ${isDragging ? 'animate-bounce' : 'animate-float'}`}>
                <Upload className="text-emerald-400" size={56} />
              </div>
              <div>
                <p className="text-2xl font-bold mb-2 text-white">Drop your images</p>
                <p className="text-slate-400 text-lg font-medium">or click to browse files</p>
              </div>
            </div>
          </motion.div>
        </section>
      ) : (
        <div className="w-full">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 glass p-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-black tracking-tight text-white mb-1">{items.length} Images</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Resize to {targetWidth} × {targetHeight}px</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
              <button onClick={resizeAll} disabled={items.every(i => i.status === 'completed')} className="btn-primary w-full sm:w-auto shadow-emerald-500/20 shadow-xl py-3 px-6 group">
                <Zap size={18} className="group-hover:animate-pulse" /> Resize All
              </button>
              <button onClick={downloadAll} disabled={!items.some(i => i.status === 'completed')} className="btn-secondary w-full sm:w-auto py-3 px-6 border-slate-700 hover:border-slate-500 flex items-center gap-2">
                <DownloadCloud size={18} /> Export ZIP
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-20">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card p-4 group/card transition-all duration-300 hover:shadow-emerald-500/10 rounded-2xl"
                >
                  <div className="relative group/img overflow-hidden rounded-xl aspect-square mb-4 bg-slate-900/50 flex items-center justify-center border border-white/5">
                    <button onClick={() => removeFile(item.id)} className="absolute top-2 right-2 p-2 bg-slate-900/80 backdrop-blur-md rounded-xl text-slate-400 hover:text-rose-400 transition-all opacity-0 group-hover/img:opacity-100 z-20 hover:scale-110">
                      <X size={14} />
                    </button>
                    {item.originalFile && (
                      <img src={URL.createObjectURL(item.originalFile)} alt="preview" className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" />
                    )}
                    {item.status === 'resizing' && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-10">
                        <Loader2 size={28} className="text-emerald-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm truncate text-slate-200">{item.originalFile.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-500">
                        {item.originalDims.width} × {item.originalDims.height}px • {formatSize(item.originalFile.size)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        {item.status === 'pending' && (
                          <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</div>
                        )}
                        {item.status === 'completed' && (
                          <div className="flex flex-col">
                            <div className="text-[11px] font-black tracking-widest text-emerald-400 uppercase flex items-center gap-1.5 mb-1">
                              <CheckCircle size={10} /> Resized
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">
                              {item.resizedDims?.width} × {item.resizedDims?.height}px • {formatSize(item.resizedFile?.size || 0)}
                            </span>
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div className="px-3 py-1 bg-rose-900/30 rounded-lg text-[10px] font-bold text-rose-400 uppercase tracking-widest">Error</div>
                        )}
                      </div>

                      {item.status === 'completed' ? (
                        <button onClick={() => downloadFile(item)} className="p-2.5 glass bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border-emerald-500/10 hover:scale-110">
                          <Download size={16} />
                        </button>
                      ) : (
                        <button onClick={() => resizeFile(item)} disabled={item.status === 'resizing'} className="p-2.5 glass bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border-emerald-500/10 disabled:opacity-50 hover:scale-110">
                          <Zap size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              <motion.div
                layout onClick={() => fileInputRef.current.click()}
                className="glass p-5 min-h-[280px] flex flex-col items-center justify-center gap-4 border-dashed border-2 border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-all text-slate-500 hover:text-emerald-400 group/add rounded-2xl"
              >
                <div className="p-4 rounded-3xl bg-slate-900/50 group-hover/add:bg-emerald-500/10 transition-colors">
                  <Upload size={28} />
                </div>
                <span className="font-bold uppercase tracking-widest text-xs">Add More</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
