import React, { useState, useRef } from 'react';
import { Settings, Image as ImageIcon, Download, Upload, Trash2, CheckCircle, Zap, Loader2, X, DownloadCloud, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, formatSize } from './utils/imageProcessor';
import JSZip from 'jszip';

function App() {
  const [items, setItems] = useState([]);
  const [quality, setQuality] = useState(100);
  const [maxWidth, setMaxWidth] = useState(0);
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
      convertedFile: null,
      progress: 0,
    }));
    setItems(prev => [...prev, ...newItems]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const removeFile = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    setItems([]);
  };

  const convertFile = async (item) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'converting' } : i));
    try {
      const options = {
        fileType: 'image/webp',
        initialQuality: quality / 100,
        alwaysKeepResolution: maxWidth === 0,
        useWebWorker: true,
      };
      if (maxWidth > 0) {
        options.maxWidthOrHeight = maxWidth;
      }
      
      const compressedBlob = await compressImage(item.originalFile, options);
      // Ensure the generated file has the correct .webp extension
      const newName = item.originalFile.name.replace(/\.[^/.]+$/, "") + ".webp";
      const converted = new File([compressedBlob], newName, { type: 'image/webp' });

      setItems(prev => prev.map(i => i.id === item.id ? {
        ...i,
        status: 'completed',
        convertedFile: converted,
        originalSize: item.originalFile.size,
        convertedSize: converted.size
      } : i));
    } catch (error) {
      console.error(error);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
    }
  };

  const convertAll = async () => {
    const pendingItems = items.filter(i => i.status === 'pending');
    for (const item of pendingItems) {
      await convertFile(item);
    }
  };

  const downloadFile = (item) => {
    if (!item.convertedFile) return;
    const url = URL.createObjectURL(item.convertedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.convertedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    const completedItems = items.filter(i => i.status === 'completed');
    if (completedItems.length === 0) return;

    if (completedItems.length === 1) {
      downloadFile(completedItems[0]);
      return;
    }

    const zip = new JSZip();
    completedItems.forEach(item => {
      zip.file(item.convertedFile.name, item.convertedFile);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = "converted_images.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-4 md:p-12 flex flex-col items-center">
      {/* Background Ornaments */}
      <div className="fixed top-[-10%] left-[-5%] w-[45%] h-[45%] bg-emerald-600/10 blur-[130px] rounded-full -z-10 animate-pulse"></div>
      <div className="fixed bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-cyan-600/10 blur-[130px] rounded-full -z-10"></div>

      <header className="w-full max-w-6xl flex justify-between items-center mb-16 px-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 group cursor-default">
          <div className="p-3.5 glass group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="text-emerald-400 group-hover:text-emerald-300" size={26} />
          </div>
          <h1 className="text-3xl font-extrabold gradient-text tracking-tight font-display">PicShift</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 md:gap-8">
          <div className="hidden sm:flex items-center gap-4 glass px-6 py-3">
            <Settings size={18} className="text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Color Fidelity</span>
              <span className="text-sm font-semibold text-emerald-300">{quality === 100 ? 'Original (Max)' : quality + '% Quality'}</span>
            </div>
            <input
              type="range" min="1" max="100" value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="accent-emerald-500 w-24 h-1.5 rounded-lg appearance-none bg-slate-800 cursor-pointer hidden md:block"
            />
          </div>
          
          <div className="hidden sm:flex items-center gap-4 glass px-6 py-3">
            <ImageIcon size={18} className="text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Max Size</span>
              <select 
                value={maxWidth} 
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                className="bg-transparent text-sm font-semibold text-emerald-300 outline-none cursor-pointer appearance-none"
              >
                <option value={0} className="bg-slate-800">Original Size</option>
                <option value={3840} className="bg-slate-800">4K (3840px)</option>
                <option value={1920} className="bg-slate-800">FHD (1920px)</option>
                <option value={1280} className="bg-slate-800">HD (1280px)</option>
                <option value={800} className="bg-slate-800">Web (800px)</option>
                <option value={400} className="bg-slate-800">Thumbnail (400px)</option>
              </select>
            </div>
          </div>

          {items.length > 0 && (
            <button onClick={clearAll} className="p-3 sm:px-4 sm:py-3 glass text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex items-center gap-2 text-sm font-bold">
              <Trash2 size={18} /> <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </motion.div>
      </header>

      <main className="w-full max-w-6xl px-4 flex-grow">
        {items.length === 0 ? (
          <section className="text-center py-16 md:py-24 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9] text-white">
                Convert Images <br />
                <span className="theme-gradient-text">Better. Faster.</span>
              </h2>
              <p className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto mb-16 leading-relaxed font-medium">
                Professional-grade image conversion to WebP with smart compression.
                Private, secure, and entirely browser-based.
              </p>
            </motion.div>

            <motion.div
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`glass-card p-16 md:p-32 text-center border-dashed border-2 transition-all duration-500 cursor-pointer group relative overflow-hidden
                ${isDragging ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]' : 'border-slate-800 hover:border-emerald-500/30'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <div className="flex flex-col items-center gap-8 relative z-10">
                <div className={`p-10 rounded-[3rem] transition-all duration-700 bg-slate-900/50 group-hover:bg-emerald-500/20 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]
                  ${isDragging ? 'animate-bounce' : 'animate-float'}`}>
                  <Upload className="text-emerald-400" size={64} />
                </div>
                <div>
                  <p className="text-3xl font-bold mb-3 text-white">Drop your images</p>
                  <p className="text-slate-400 text-xl font-medium">or click to browse files</p>
                </div>
                <div className="flex gap-4 mt-2">
                  {['PNG', 'JPG', 'WEBP', 'HEIC'].map(fmt => (
                    <div key={fmt} className="px-5 py-2.5 glass rounded-2xl text-[10px] sm:text-xs font-bold text-slate-500 tracking-widest uppercase">{fmt}</div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>
        ) : (
          <div className="w-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 glass p-8">
              <div className="text-center md:text-left">
                <h3 className="text-3xl font-black tracking-tight text-white mb-1">{items.length} Images</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Processing Queue ready</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 w-full md:w-auto">
                <button onClick={convertAll} disabled={items.every(i => i.status === 'completed')}
                  className="btn-primary w-full sm:w-auto shadow-emerald-500/20 shadow-xl py-4 px-8 group">
                  <Zap size={20} className="group-hover:animate-pulse" /> Convert All
                </button>
                <button onClick={downloadAll} disabled={!items.some(i => i.status === 'completed')}
                  className="btn-secondary w-full sm:w-auto py-4 px-8 border-slate-700 hover:border-slate-500">
                  <DownloadCloud size={20} /> Export ZIP
                </button>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="glass-card p-5 group/card transition-all duration-300 hover:shadow-emerald-500/10"
                  >
                    <div className="relative group/img overflow-hidden rounded-2xl aspect-square mb-5 bg-slate-900/50 flex items-center justify-center border border-white/5">
                      <button onClick={() => removeFile(item.id)} className="absolute top-3 right-3 p-2 bg-slate-900/80 backdrop-blur-md rounded-xl text-slate-400 hover:text-rose-400 transition-all opacity-0 group-hover/img:opacity-100 z-20 hover:scale-110">
                        <X size={16} />
                      </button>
                      {item.originalFile && (
                        <img src={URL.createObjectURL(item.originalFile)} alt="preview" className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" />
                      )}

                      {item.status === 'converting' && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-10">
                          <Loader2 size={32} className="text-emerald-400 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm truncate text-slate-200">{item.originalFile.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-tighter text-slate-500">{formatSize(item.originalFile.size)}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          {item.status === 'pending' && (
                            <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</div>
                          )}
                          {item.status === 'completed' && (
                            <div className="flex flex-col">
                              <div className="text-[11px] font-black tracking-widest text-emerald-400 uppercase flex items-center gap-1.5 mb-1">
                                <CheckCircle size={10} /> Optimized
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">
                                {formatSize(item.convertedSize)} <span className="text-emerald-500 ml-1">-{Math.round((1 - item.convertedSize / item.originalSize) * 100)}%</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {item.status === 'completed' ? (
                          <button onClick={() => downloadFile(item)} className="p-3 glass bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border-emerald-500/10 hover:scale-110">
                            <Download size={18} />
                          </button>
                        ) : (
                          <button onClick={() => convertFile(item)} disabled={item.status === 'converting'} className="p-3 glass bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border-emerald-500/10 disabled:opacity-50 hover:scale-110">
                            <Zap size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  layout onClick={() => fileInputRef.current.click()}
                  className="glass p-6 min-h-[300px] flex flex-col items-center justify-center gap-4 border-dashed border-2 border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-all text-slate-500 hover:text-emerald-400 group/add"
                >
                  <div className="p-5 rounded-3xl bg-slate-900/50 group-hover/add:bg-emerald-500/10 transition-colors">
                    <Upload size={32} />
                  </div>
                  <span className="font-bold uppercase tracking-widest text-xs">Add More</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full mt-auto pt-16 pb-12 border-t border-white/5 text-slate-600 text-xs flex flex-col items-center gap-6">
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
