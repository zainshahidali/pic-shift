import React from 'react';

const TermsOfService = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 md:p-12 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)] text-slate-300">
      <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-8">
        Terms of Service
      </h1>
      
      <div className="space-y-6 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using PicShift, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Service Description</h2>
          <p>
            PicShift provides a suite of client-side image processing tools, including but not limited to converters, resizers, and document generators. All tasks are performed on your local machine using your browser's resources.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Use License</h2>
          <p>
            Permission is granted to temporarily use our tools on PicShift's website for personal, non-commercial, or commercial file processing. This is a grant of a license, not a transfer of title. We reserve the right to modify or discontinue the service at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Disclaimer</h2>
          <p>
            The materials on PicShift's website are provided on an 'as is' basis. PicShift makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Limitations</h2>
          <p>
            In no event shall PicShift or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on PicShift's website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Governing Law</h2>
          <p>
            Any claim relating to PicShift's website shall be governed by the laws of our operating jurisdiction without regard to its conflict of law provisions.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
