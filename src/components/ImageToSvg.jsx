'use client';

import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Settings, 
  Image as ImageIcon, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle, 
  Zap, 
  Loader2, 
  X, 
  DownloadCloud, 
  Eye, 
  EyeOff, 
  Sliders, 
  Paintbrush 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { traceImageToSvg, embedImageToSvg } from '../utils/svgConverter';
import { formatSize } from '../utils/imageProcessor';
import JSZip from 'jszip';
import CustomDropdown from './CustomDropdown';

const MODES = [
  { value: 'monochrome', label: 'Monochrome Trace' },
  { value: 'color', label: 'Color Trace' },
  { value: 'embed', label: 'Embed Original' },
];

const QUALITIES = [
  { value: 'high', label: 'High Fidelity' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low (Smooth)' },
];

const CHANNELS = [
  { value: 'luminance', label: 'Luminance' },
  { value: 'alpha', label: 'Alpha Mask' },
];

const RESOLUTIONS = [
  { value: 0, label: 'Original Size' },
  { value: 2048, label: 'Ultra (2K)' },
  { value: 1024, label: 'High (1024px)' },
  { value: 800, label: 'Medium (800px)' },
];

const COLOR_PRESETS = [
  { value: '#000000', label: 'Black' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#f43f5e', label: 'Rose' },
  { value: '#8b5cf6', label: 'Violet' },
];

const BG_PRESETS = [
  { value: 'transparent', label: 'Transparent' },
  { value: '#ffffff', label: 'White' },
  { value: '#000000', label: 'Black' },
  { value: '#0f172a', label: 'Slate Dark' },
];

export default function ImageToSvg() {
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState('monochrome');
  const [quality, setQuality] = useState('medium');
  const [traceChannel, setTraceChannel] = useState('luminance');
  const [maxDimension, setMaxDimension] = useState(0); // 0 = Original Size for maximum quality by default
  const [threshold, setThreshold] = useState(128);
  const [colors, setColors] = useState(8);
  const [fillColor, setFillColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('transparent');
  const [blur, setBlur] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    const newItems = files.filter(file => file.type.startsWith('image/')).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      originalFile: file,
      status: 'pending',
      convertedBlob: null,
      convertedUrl: null,
      showOriginal: false,
    }));
    setItems(prev => [...prev, ...newItems]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (id) => {
    setItems(prev => {
      const target = prev.find(item => item.id === id);
      if (target?.convertedUrl) {
        URL.revokeObjectURL(target.convertedUrl);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach(item => {
      if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    });
    setItems([]);
  };

  const convertFile = async (item) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'converting' } : i));
    try {
      let converted;
      if (mode === 'embed') {
        converted = await embedImageToSvg(item.originalFile);
      } else {
        converted = await traceImageToSvg(item.originalFile, {
          mode,
          threshold,
          colors,
          quality,
          fillColor,
          bgColor,
          maxDimension,
          traceChannel,
          blur,
        });
      }

      const convertedUrl = URL.createObjectURL(converted);
      
      setItems(prev => prev.map(i => i.id === item.id ? {
        ...i,
        status: 'completed',
        convertedBlob: converted,
        convertedUrl: convertedUrl,
        originalSize: item.originalFile.size,
        convertedSize: converted.size
      } : i));
    } catch (error) {
      console.error(error);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
    }
  };

  const convertAll = async () => {
    const pending = items.filter(i => i.status === 'pending');
    for (const item of pending) await convertFile(item);
  };

  const downloadFile = (item) => {
    if (!item.convertedBlob) return;
    const url = item.convertedUrl || URL.createObjectURL(item.convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    const originalName = item.originalFile.name.replace(/\.[^/.]+$/, '');
    a.download = `${originalName}_vector.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = async () => {
    const completed = items.filter(i => i.status === 'completed');
    if (completed.length === 0) return;
    if (completed.length === 1) { downloadFile(completed[0]); return; }

    const zip = new JSZip();
    completed.forEach(item => {
      const originalName = item.originalFile.name.replace(/\.[^/.]+$/, '');
      zip.file(`${originalName}_vector.svg`, item.convertedBlob);
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vectorized_svg_icons.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const togglePreview = (id) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, showOriginal: !item.showOriginal } : item));
  };

  return (
    <div className="w-full">
      {/* Options Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-center gap-3 mb-10"
      >
        {/* Mode Selector */}
        <div className="option-pill">
          <Sparkles size={16} className="text-slate-400" />
          <div className="flex flex-col min-w-[120px]">
            <label>Vector Mode</label>
            <CustomDropdown value={mode} onChange={setMode} options={MODES} />
          </div>
        </div>

        {/* Quality preset (for tracing modes) */}
        {mode !== 'embed' && (
          <div className="option-pill">
            <Settings size={16} className="text-slate-400" />
            <div className="flex flex-col min-w-[100px]">
              <label>Fidelity</label>
              <CustomDropdown value={quality} onChange={setQuality} options={QUALITIES} />
            </div>
          </div>
        )}

        {/* Trace Channel Selector */}
        {mode === 'monochrome' && (
          <div className="option-pill">
            <Sliders size={16} className="text-slate-400" />
            <div className="flex flex-col min-w-[110px]">
              <label>Trace Channel</label>
              <CustomDropdown value={traceChannel} onChange={setTraceChannel} options={CHANNELS} />
            </div>
          </div>
        )}

        {/* Resolution Limit Selector */}
        {mode !== 'embed' && (
          <div className="option-pill">
            <ImageIcon size={16} className="text-slate-400" />
            <div className="flex flex-col min-w-[110px]">
              <label>Resolution</label>
              <CustomDropdown value={maxDimension} onChange={setMaxDimension} options={RESOLUTIONS} />
            </div>
          </div>
        )}

        {/* Threshold Slider (Monochrome only) */}
        {mode === 'monochrome' && (
          <div className="option-pill">
            <Sliders size={16} className="text-slate-400" />
            <div className="flex flex-col">
              <label>Threshold ({threshold})</label>
              <input
                type="range" min="10" max="240" value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="accent-emerald-500 w-24 h-1.5 rounded-lg appearance-none bg-slate-800 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Smoothness/Blur Slider (Monochrome & Color modes) */}
        {mode !== 'embed' && (
          <div className="option-pill">
            <Sliders size={16} className="text-slate-400" />
            <div className="flex flex-col">
              <label>Smoothness ({blur}px)</label>
              <input
                type="range" min="0" max="8" step="0.5" value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="accent-emerald-500 w-24 h-1.5 rounded-lg appearance-none bg-slate-800 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Colors Selector (Color Trace only) */}
        {mode === 'color' && (
          <div className="option-pill">
            <Sliders size={16} className="text-slate-400" />
            <div className="flex flex-col">
              <label>Colors ({colors})</label>
              <input
                type="range" min="2" max="16" value={colors}
                onChange={(e) => setColors(Number(e.target.value))}
                className="accent-emerald-500 w-24 h-1.5 rounded-lg appearance-none bg-slate-800 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Fill Color Picker (Monochrome only) */}
        {mode === 'monochrome' && (
          <div className="option-pill">
            <Paintbrush size={16} className="text-slate-400" />
            <div className="flex flex-col">
              <label>Fill Color</label>
              <div className="flex items-center gap-1.5 mt-0.5">
                <input 
                  type="color" 
                  value={fillColor} 
                  onChange={(e) => setFillColor(e.target.value)} 
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <select 
                  value={fillColor} 
                  onChange={(e) => setFillColor(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-emerald-300 outline-none cursor-pointer p-0 border-0"
                >
                  <option value={fillColor}>Custom</option>
                  {COLOR_PRESETS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Background Color Picker (Monochrome & Color modes) */}
        {mode !== 'embed' && (
          <div className="option-pill">
            <Paintbrush size={16} className="text-slate-400" />
            <div className="flex flex-col">
              <label>Background</label>
              <div className="flex items-center gap-1.5 mt-0.5">
                <input 
                  type="color" 
                  value={bgColor === 'transparent' ? '#ffffff' : bgColor} 
                  disabled={bgColor === 'transparent'}
                  onChange={(e) => setBgColor(e.target.value)} 
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent disabled:opacity-30"
                />
                <select 
                  value={bgColor} 
                  onChange={(e) => setBgColor(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-emerald-300 outline-none cursor-pointer p-0 border-0"
                >
                  {bgColor !== 'transparent' && !BG_PRESETS.find(p => p.value === bgColor) && (
                    <option value={bgColor}>Custom</option>
                  )}
                  {BG_PRESETS.map(bg => (
                    <option key={bg.value} value={bg.value}>{bg.label}</option>
                  ))}
                  {bgColor === 'transparent' && <option value="transparent">Transparent</option>}
                  <option value="#custom_picker" onClick={() => setBgColor('#ffffff')}>Pick Color...</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <button onClick={clearAll} className="option-pill text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer">
            <Trash2 size={16} />
            <span className="text-sm font-bold">Clear All</span>
          </button>
        )}
      </motion.div>

      {items.length === 0 ? (
        <section className="text-center py-12 md:py-20 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.9] text-white">
              Convert Images <br />
              <span className="theme-gradient-text">To SVG Icons</span>
            </h2>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              Transform raster images into scalable, resolution-independent SVG icons.
              Secure vectorization processed locally in your browser.
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
              <div className="flex gap-3 mt-2">
                {MODES.map(m => (
                  <div key={m.value} className="px-4 py-2 glass rounded-2xl text-[10px] sm:text-xs font-bold text-slate-500 tracking-widest uppercase">{m.label}</div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      ) : (
        <div className="w-full">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 glass p-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-black tracking-tight text-white mb-1">{items.length} Images</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                Converting with {MODES.find(m => m.value === mode)?.label}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
              <button onClick={convertAll} disabled={items.every(i => i.status === 'completed')} className="btn-primary w-full sm:w-auto shadow-emerald-500/20 shadow-xl py-3 px-6 group">
                <Zap size={18} className="group-hover:animate-pulse" /> Vectorize All
              </button>
              <button onClick={downloadAll} disabled={!items.some(i => i.status === 'completed')} className="btn-secondary w-full sm:w-auto py-3 px-6 border-slate-700 hover:border-slate-500 flex items-center gap-2">
                <DownloadCloud size={18} /> Export SVGs ZIP
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
                    {/* Delete button */}
                    <button onClick={() => removeFile(item.id)} className="absolute top-2 right-2 p-2 bg-slate-900/80 backdrop-blur-md rounded-xl text-slate-400 hover:text-rose-400 transition-all opacity-0 group-hover/img:opacity-100 z-20 hover:scale-110">
                      <X size={14} />
                    </button>
                    
                    {/* Toggle original/vector button */}
                    {item.status === 'completed' && (
                      <button 
                        onClick={() => togglePreview(item.id)} 
                        title={item.showOriginal ? "View Vectorized SVG" : "View Original Raster"}
                        className="absolute bottom-2 left-2 p-2 bg-slate-900/80 backdrop-blur-md rounded-xl text-emerald-400 hover:text-emerald-300 transition-all z-20 hover:scale-110 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                      >
                        {item.showOriginal ? <Eye size={12} /> : <EyeOff size={12} />}
                        {item.showOriginal ? "Original" : "Vector SVG"}
                      </button>
                    )}

                    {/* Previews */}
                    {(!item.convertedUrl || item.showOriginal) ? (
                      <img src={URL.createObjectURL(item.originalFile)} alt="preview" className="w-full h-full object-contain p-2 transition-transform duration-700 group-hover/card:scale-105" />
                    ) : (
                      <div className="w-full h-full p-2 flex items-center justify-center bg-checkered rounded-lg overflow-hidden">
                        <img 
                          src={item.convertedUrl} 
                          alt="vectorized svg" 
                          className="w-full h-full object-contain transition-transform duration-700 group-hover/card:scale-105"
                          style={{
                            backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor
                          }}
                        />
                      </div>
                    )}

                    {item.status === 'converting' && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 size={28} className="text-emerald-400 animate-spin" />
                          <span className="text-xs font-bold text-slate-300 tracking-wider">Vectorizing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm truncate text-slate-200">{item.originalFile.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-500">
                        {formatSize(item.originalFile.size)}
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
                              <CheckCircle size={10} /> Done
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">
                              SVG • {formatSize(item.convertedSize)}
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
                        <button onClick={() => convertFile(item)} disabled={item.status === 'converting'} className="p-2.5 glass bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border-emerald-500/10 disabled:opacity-50 hover:scale-110">
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
