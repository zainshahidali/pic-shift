'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, MapPin, Download, X, Check, Loader2, Info, Map as MapIcon, Type } from 'lucide-react';
import * as piexif from 'piexifjs';
import { saveAs } from 'file-saver';

export default function GeoTagging() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState({
    latitude: '',
    longitude: '',
    altText: ''
  });

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
        setError('Please upload a JPEG image. EXIF metadata is best supported for JPEGs.');
        return;
      }
      setError('');
      setImage(file);
      const reader = new FileReader();
      reader.onload = (event) => setPreviewUrl(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMetadata(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
      },
      (err) => {
        setError(`Error getting location: ${err.message}`);
      }
    );
  };

  const convertToRational = (decimal) => {
    const absDecimal = Math.abs(decimal);
    const degrees = Math.floor(absDecimal);
    const minutes = Math.floor((absDecimal - degrees) * 60);
    const seconds = ((absDecimal - degrees - minutes / 60) * 3600).toFixed(4);

    return [
      [degrees, 1],
      [minutes, 1],
      [Math.round(parseFloat(seconds) * 100), 100]
    ];
  };

  const handleApplyTags = async () => {
    if (!image || !previewUrl) return;
    setIsProcessing(true);
    setError('');

    try {
      // 1. Get the base64 data
      const base64Data = previewUrl;

      // 2. Create EXIF object
      const zeroth = {};
      const exif = {};
      const gps = {};

      // UserComment for Alt Text (ID 37510 in Exif IFD)
      // UserComment should be prefixed with encoding (ASCII or Unicode)
      if (metadata.altText) {
        exif[piexif.ExifIFD.UserComment] = "ASCII\0\0\0" + metadata.altText;
      }

      // GPS tags
      if (metadata.latitude && metadata.longitude) {
        const lat = parseFloat(metadata.latitude);
        const lng = parseFloat(metadata.longitude);

        gps[piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? 'N' : 'S';
        gps[piexif.GPSIFD.GPSLatitude] = convertToRational(lat);
        gps[piexif.GPSIFD.GPSLongitudeRef] = lng >= 0 ? 'E' : 'W';
        gps[piexif.GPSIFD.GPSLongitude] = convertToRational(lng);
        gps[piexif.GPSIFD.GPSVersionID] = [2, 2, 0, 0];
      }

      const exifObj = { "0th": zeroth, "Exif": exif, "GPS": gps };
      const exifBytes = piexif.dump(exifObj);

      // 3. Insert EXIF into image
      const newBase64 = piexif.insert(exifBytes, base64Data);

      // 4. Create Blob and Save
      const byteString = atob(newBase64.split(',')[1]);
      const mimeString = newBase64.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      saveAs(blob, `geotagged_${image.name}`);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to apply tags. Make sure the image is a valid JPEG.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto w-full"
    >
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black gradient-text mb-3">Geo Tagging</h2>
        <p className="text-slate-400 text-lg">Add location data and descriptive tags to your images.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div
            className={`glass-card p-8 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] cursor-pointer
              ${image ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-emerald-500/30'}`}
            onClick={() => fileInputRef.current.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/jpg"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden group">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white font-semibold">Change Image</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-5 glass rounded-2xl mb-4 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                  <Upload size={32} />
                </div>
                <p className="text-lg font-bold text-slate-200">Drop image here</p>
                <p className="text-sm text-slate-500 mt-1">Supports JPEG format only</p>
              </>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
            >
              <X size={18} />
              {error}
            </motion.div>
          )}
        </div>

        {/* Controls Section */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 glass rounded-lg text-emerald-400">
                <MapPin size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-200">Location Data</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Latitude</label>
                <div className="relative">
                  <input
                    type="number"
                    name="latitude"
                    step="0.000001"
                    placeholder="0.000000"
                    value={metadata.latitude}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  step="0.000001"
                  placeholder="0.000000"
                  value={metadata.longitude}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              onClick={getCurrentLocation}
              className="w-full py-3 glass hover:bg-white/10 rounded-xl text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <MapIcon size={16} />
              Use Current Location
            </button>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 glass rounded-lg text-emerald-400">
                  <Type size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-200">Alt Text / Description</h3>
              </div>
              <textarea
                name="altText"
                placeholder="Describe your image for accessibility and SEO..."
                value={metadata.altText}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-colors resize-none"
              />
            </div>

            <button
              disabled={!image || isProcessing}
              onClick={handleApplyTags}
              className="btn-primary w-full justify-center mt-4"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : isSuccess ? (
                <>
                  <Check size={20} />
                  Tags Applied!
                </>
              ) : (
                <>
                  <Download size={20} />
                  Apply & Download
                </>
              )}
            </button>
          </div>

          <div className="p-4 glass rounded-2xl flex gap-4">
            <div className="p-2 bg-emerald-500/10 rounded-xl h-fit text-emerald-400">
              <Info size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200 mb-1">SEO Benefits</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Embedding GeoTags and Alt Text directly into your images helps search engines understand the context and location, boosting local SEO performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
