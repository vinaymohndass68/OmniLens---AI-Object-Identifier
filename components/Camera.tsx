
import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CameraProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Could not access camera. Please check permissions.');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [startCamera]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        const base64 = dataUrl.split(',')[1];
        onCapture(base64);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-2xl aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800">
        {error ? (
          <div className="flex items-center justify-center h-full text-white p-8 text-center">
            {error}
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-8 flex gap-6 items-center">
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <button 
          onClick={captureImage}
          disabled={!!error}
          className="bg-white hover:bg-neutral-200 text-black h-20 w-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="h-16 w-16 rounded-full border-4 border-black/10 flex items-center justify-center">
            <div className="h-12 w-12 bg-black rounded-full" />
          </div>
        </button>
        
        <div className="w-12 h-12" /> {/* Spacer */}
      </div>
    </div>
  );
};

export default Camera;
