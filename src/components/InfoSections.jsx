import React, { useState } from 'react';
import { Target, Zap, Shield, HelpCircle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

const InfoSections = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  const faqs = [
    {
      question: "Are my images uploaded to your servers?",
      answer: "No, absolutely not! PicShift processes all your images locally directly within your web browser. Your files never leave your device, ensuring complete privacy and security."
    },
    {
      question: "Is there a limit on file size or the number of images?",
      answer: "Since processing happens on your device, the only limits are your browser's memory and your device's capabilities. There are no artificial limits imposed by us."
    },
    {
      question: "Is PicShift completely free to use?",
      answer: "Yes, PicShift is 100% free with no hidden charges, watermarks, or premium features locked behind paywalls."
    },
    {
      question: "Will the quality of my images be reduced?",
      answer: "We use advanced algorithms to ensure maximum quality retention. When converting formats or resizing, you have granular control over the output quality."
    }
  ];

  return (
    <div className="w-full mt-24 space-y-24 mb-16">
      
      {/* Our Goals & Mission */}
      <section className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/10 blur-[100px] rounded-full -z-10"></div>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our <span className="theme-gradient-text">Goals & Mission</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Empowering creators and professionals with fast, secure, and intuitive image tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center hover:border-emerald-500/30 transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Absolute Privacy</h3>
            <p className="text-slate-400 text-sm">
              We believe your data is yours. That's why we built a tool that processes everything locally, eliminating server uploads completely.
            </p>
          </div>
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center hover:border-teal-500/30 transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
            <p className="text-slate-400 text-sm">
              By utilizing your device's computing power, we skip the upload and download wait times, delivering instant results.
            </p>
          </div>
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center hover:border-cyan-500/30 transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Target className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Professional Quality</h3>
            <p className="text-slate-400 text-sm">
              Free doesn't mean cheap. We provide advanced controls and premium algorithms to give you pixel-perfect outputs every time.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <div className="glass-card rounded-[40px] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full -z-10"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                How It <span className="text-cyan-400">Works</span>
              </h2>
              <p className="text-slate-300 mb-8 leading-relaxed">
                PicShift uses modern web technologies to bring heavy processing power directly to your browser. Here is the seamless mechanism behind the magic.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">1. Select Your Files</h4>
                    <p className="text-slate-400 text-sm">Drag &amp; drop or select images from your device. They are immediately read into your browser's memory.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">2. Local Processing</h4>
                    <p className="text-slate-400 text-sm">Using modern web capabilities, your browser acts as a powerful engine to convert, resize, or package your images instantly.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">3. Instant Download</h4>
                    <p className="text-slate-400 text-sm">The processed files are packaged as direct downloads. You get your results immediately without any network latency.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full relative">
               <div className="glass p-6 rounded-3xl border border-white/10 shadow-2xl relative z-10">
                 <div className="space-y-4">
                   <div className="h-10 bg-white/5 rounded-xl w-full animate-pulse"></div>
                   <div className="h-32 bg-white/5 rounded-xl w-full flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                         <Zap className="w-8 h-8 text-emerald-400" />
                      </div>
                   </div>
                   <div className="h-10 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl w-full"></div>
                 </div>
               </div>
               
               {/* Decorative elements */}
               <div className="absolute -top-6 -right-6 w-24 h-24 bg-teal-500/20 rounded-full blur-2xl"></div>
               <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-4">
            <HelpCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked <span className="theme-gradient-text">Questions</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === index ? 'border-emerald-500/30 bg-white/5' : 'border-transparent hover:bg-white/5'}`}
            >
              <button 
                className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 cursor-pointer"
                onClick={() => toggleFaq(index)}
              >
                <span className="font-semibold text-lg">{faq.question}</span>
                {openFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
              </button>
              
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-slate-400 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  );
};

export default InfoSections;
