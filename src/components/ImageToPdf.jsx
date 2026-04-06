import React, { useState, useRef } from 'react';
import { Upload, Download, Trash2, Loader2, X, FileText, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { imageToDataUrl, getImageDimensions, formatSize } from '../utils/imageProcessor';
import { jsPDF } from 'jspdf';

const PAGE_SIZES = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
  { value: 'auto', label: 'Auto (Fit to Image)' },
];

const ORIENTATIONS = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
];

export default function ImageToPdf() {
  const [items, setItems] = useState([]);
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);
  const [dragItem, setDragItem] = useState(null);

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
          file,
          dims,
        });
      } catch {
        // skip
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

  // Reorder drag-and-drop
  const handleReorderDragStart = (index) => setDragItem(index);
  const handleReorderDragOver = (e, index) => {
    e.preventDefault();
    if (dragItem === null || dragItem === index) return;
    setItems(prev => {
      const newItems = [...prev];
      const [moved] = newItems.splice(dragItem, 1);
      newItems.splice(index, 0, moved);
      return newItems;
    });
    setDragItem(index);
  };
  const handleReorderDragEnd = () => setDragItem(null);

  const generatePdf = async () => {
    if (items.length === 0) return;
    setIsGenerating(true);

    try {
      let doc;

      if (pageSize === 'auto') {
        // For auto, we create pages matching each image's aspect ratio
        const firstDataUrl = await imageToDataUrl(items[0].file);
        const firstDims = items[0].dims;
        doc = new jsPDF({
          orientation: firstDims.width > firstDims.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [firstDims.width, firstDims.height],
        });
        doc.addImage(firstDataUrl, 'JPEG', 0, 0, firstDims.width, firstDims.height);

        for (let i = 1; i < items.length; i++) {
          const dataUrl = await imageToDataUrl(items[i].file);
          const dims = items[i].dims;
          doc.addPage([dims.width, dims.height], dims.width > dims.height ? 'landscape' : 'portrait');
          doc.addImage(dataUrl, 'JPEG', 0, 0, dims.width, dims.height);
        }
      } else {
        doc = new jsPDF({
          orientation,
          unit: 'mm',
          format: pageSize,
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const usableW = pageWidth - margin * 2;
        const usableH = pageHeight - margin * 2;

        for (let i = 0; i < items.length; i++) {
          if (i > 0) doc.addPage();
          const dataUrl = await imageToDataUrl(items[i].file);
          const dims = items[i].dims;

          const ratio = Math.min(usableW / dims.width, usableH / dims.height);
          const imgW = dims.width * ratio;
          const imgH = dims.height * ratio;
          const x = margin + (usableW - imgW) / 2;
          const y = margin + (usableH - imgH) / 2;

          doc.addImage(dataUrl, 'JPEG', x, y, imgW, imgH);
        }
      }

      doc.save('images.pdf');
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full">
      {/* Options Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-center gap-3 mb-10"
      >
        <div className="option-pill">
          <FileText size={16} className="text-slate-400" />
          <div className="flex flex-col">
            <label>Page Size</label>
            <select value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
              {PAGE_SIZES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {pageSize !== 'auto' && (
          <div className="option-pill">
            <FileText size={16} className="text-slate-400" />
            <div className="flex flex-col">
              <label>Orientation</label>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                {ORIENTATIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <button onClick={clearAll} className="option-pill text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer">
            <Trash2 size={16} />
            <span className="text-sm font-bold">Clear</span>
          </button>
        )}
      </motion.div>

      {items.length === 0 ? (
        <section className="text-center py-12 md:py-20 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.9] text-white">
              Images to <br />
              <span className="theme-gradient-text">PDF Document</span>
            </h2>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              Combine multiple images into a single PDF. Drag to reorder pages.
              Private — everything happens in your browser.
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
              <h3 className="text-2xl font-black tracking-tight text-white mb-1">{items.length} Pages</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Drag to reorder • Each image = 1 page</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
              <button onClick={generatePdf} disabled={isGenerating} className="btn-primary w-full sm:w-auto shadow-emerald-500/20 shadow-xl py-3 px-6 group">
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {isGenerating ? 'Generating...' : 'Generate PDF'}
              </button>
              <button onClick={() => fileInputRef.current.click()} className="btn-secondary w-full sm:w-auto py-3 px-6 border-slate-700 hover:border-slate-500 flex items-center gap-2">
                <Upload size={18} /> Add More
              </button>
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            </div>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-20">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1, outline: dragItem === index ? '2px solid rgba(16,185,129,0.5)' : 'none' }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  draggable
                  onDragStart={() => handleReorderDragStart(index)}
                  onDragOver={(e) => handleReorderDragOver(e, index)}
                  onDragEnd={handleReorderDragEnd}
                  className="glass-card p-3 group/card transition-all duration-300 hover:shadow-emerald-500/10 rounded-2xl cursor-grab active:cursor-grabbing"
                >
                  <div className="relative group/img overflow-hidden rounded-xl aspect-[3/4] mb-3 bg-slate-900/50 flex items-center justify-center border border-white/5">
                    <button onClick={() => removeFile(item.id)} className="absolute top-2 right-2 p-1.5 bg-slate-900/80 backdrop-blur-md rounded-lg text-slate-400 hover:text-rose-400 transition-all opacity-0 group-hover/img:opacity-100 z-20 hover:scale-110">
                      <X size={12} />
                    </button>
                    <div className="absolute top-2 left-2 p-1.5 bg-slate-900/80 backdrop-blur-md rounded-lg text-slate-500 opacity-0 group-hover/img:opacity-100 z-20">
                      <GripVertical size={12} />
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-emerald-400 z-20">
                      Page {index + 1}
                    </div>
                    <img src={URL.createObjectURL(item.file)} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <p className="font-bold text-[11px] truncate text-slate-300">{item.file.name}</p>
                  <p className="text-[9px] font-black uppercase text-slate-500">
                    {item.dims.width}×{item.dims.height} • {formatSize(item.file.size)}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
