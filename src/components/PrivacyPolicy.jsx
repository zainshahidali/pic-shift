import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 md:p-12 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)] text-slate-300">
      <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-8">
        Privacy Policy
      </h1>
      
      <div className="space-y-6 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
          <p>
            At PicShift, your privacy is our priority. Since our image conversion and processing tools operate entirely on your browser (client-side), we do not upload, store, or collect your images or document files on our servers. The files you process remain exclusively on your device.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
          <p>
            We do not collect personal information. We may use anonymous analytics tools to understand how users interact with our website to improve our services and user experience. This data cannot be used to personally identify you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Third-Party Services</h2>
          <p>
            Our service may contain links to third-party websites or services that are not owned or controlled by PicShift. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party web sites or services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Cookies</h2>
          <p>
            We may use cookies and similar tracking technologies to track the activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
