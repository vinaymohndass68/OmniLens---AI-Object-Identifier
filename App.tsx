
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { identifyObjectsInImage } from './services/geminiService';
import { IdentificationResult, ItemType } from './types';
import Camera from './components/Camera';
import ResultCard from './components/ResultCard';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [results, setResults] = useState<IdentificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleIdentify = async (base64: string) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setImage(`data:image/jpeg;base64,${base64}`);
    setShowCamera(false);

    try {
      const res = await identifyObjectsInImage(base64);
      setResults(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!results || !image) return;
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('OmniLens Identification Report', 20, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 32);

      // Add Image
      try {
        // Adding image to PDF. jspdf handles data URLs well.
        // We'll scale it to fit width while maintaining aspect ratio
        const imgProps = doc.getImageProperties(image);
        const imgWidth = pageWidth - 40;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        // If image is too tall, scale it down
        const maxHeight = 80;
        let finalWidth = imgWidth;
        let finalHeight = imgHeight;
        if (imgHeight > maxHeight) {
          finalHeight = maxHeight;
          finalWidth = (imgProps.width * finalHeight) / imgProps.height;
        }
        
        doc.addImage(image, 'JPEG', (pageWidth - finalWidth) / 2, 50, finalWidth, finalHeight);
        
        let currentY = 50 + finalHeight + 20;

        // Items List
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Identified Items', 20, currentY);
        currentY += 10;

        results.items.forEach((item, index) => {
          // Check for page break
          if (currentY > 260) {
            doc.addPage();
            currentY = 20;
          }

          doc.setDrawColor(226, 232, 240); // Slate 200
          doc.line(20, currentY, pageWidth - 20, currentY);
          currentY += 10;

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${item.name}`, 20, currentY);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139); // Slate 500
          doc.text(item.type.toUpperCase(), pageWidth - 20, currentY, { align: 'right' });
          
          currentY += 7;
          doc.setTextColor(71, 85, 105); // Slate 600
          const splitDescription = doc.splitTextToSize(item.description, pageWidth - 40);
          doc.text(splitDescription, 20, currentY);
          currentY += (splitDescription.length * 5) + 2;

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          if (item.type === ItemType.LIVING && item.scientificName) {
            doc.text('SCIENTIFIC NAME: ', 20, currentY);
            doc.setFont('helvetica', 'italic');
            doc.text(`${item.scientificName.genus} ${item.scientificName.species}`, 55, currentY);
          } else {
            doc.text('PLACE OF ORIGIN: ', 20, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(item.origin || 'Unknown', 55, currentY);
          }
          
          currentY += 15;
          doc.setTextColor(30, 41, 59); // Reset text color
        });

      } catch (imgErr) {
        console.error("PDF Image Error:", imgErr);
        doc.text("Image could not be rendered in PDF", 20, 60);
      }

      doc.save(`OmniLens_Report_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        handleIdentify(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setImage(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-white" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">OmniLens</h1>
          </div>
          {image && !isLoading && (
            <button 
              onClick={reset}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        {!image && !isLoading && (
          <div className="text-center py-12">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Discover the world through AI</h2>
            <p className="text-slate-500 max-w-lg mx-auto mb-10 text-lg">
              Capture or upload a photo to identify plants, animals, objects, and more. 
              Get scientific details and origin stories instantly.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
              <button 
                onClick={() => setShowCamera(true)}
                className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                Use Camera
              </button>
              
              <label className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-100 font-bold py-4 px-6 rounded-2xl transition-all cursor-pointer active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Upload File
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        )}

        {image && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Image Preview */}
            <div className="relative group max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src={image} 
                alt="Captured" 
                className={`w-full h-auto transition-all duration-700 ${isLoading ? 'blur-sm scale-105 opacity-80' : 'blur-0 scale-100 opacity-100'}`} 
              />
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                  <p className="text-white font-bold text-lg drop-shadow-md tracking-wide">Identifying everything...</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-2xl flex flex-col items-center">
                <p className="font-bold mb-2">Error</p>
                <p className="text-sm mb-4">{error}</p>
                <button 
                  onClick={() => handleIdentify(image.split(',')[1])}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Found {results.items.length} items</h3>
                  <button 
                    onClick={generatePDF}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2.5 px-5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isExporting ? (
                      <div className="w-4 h-4 border-2 border-indigo-700/20 border-t-indigo-700 rounded-full animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    )}
                    {isExporting ? 'Generating PDF...' : 'Download Report (PDF)'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.items.map((item, idx) => (
                    <ResultCard key={idx} item={item} />
                  ))}
                </div>

                {results.items.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">No objects were clearly identified in this image.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Camera Overlay */}
      {showCamera && (
        <Camera 
          onCapture={handleIdentify} 
          onClose={() => setShowCamera(false)} 
        />
      )}
    </div>
  );
};

export default App;
