import '../index.css';

export const metadata = {
  title: 'PicShift — Image Converter, Resizer & More',
  description: 'Convert and resize images to PNG, JPG, WebP, and BMP with smart compression. Private, secure, and entirely browser-based.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/Pic Shift fav.ico" />
      </head>
      <body>
        <div className="min-h-screen flex flex-col relative overflow-hidden">
          {/* Background Ornaments */}
          <div className="fixed top-[-10%] left-[-5%] w-[45%] h-[45%] bg-emerald-600/10 blur-[130px] rounded-full -z-10 animate-pulse"></div>
          <div className="fixed bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-cyan-600/10 blur-[130px] rounded-full -z-10"></div>
          
          {children}
        </div>
      </body>
    </html>
  );
}
