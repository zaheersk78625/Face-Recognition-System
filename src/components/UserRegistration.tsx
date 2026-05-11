import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, Upload, CheckCircle2, User, Sparkles, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function UserRegistration() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [descriptors, setDescriptors] = useState<number[][]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      setError("Camera access is blocked.");
    }
  };

  const captureFace = async () => {
    if (!videoRef.current) return;
    setLoading(true);
    setError(null);

    try {
      const fullFaceDescription = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!fullFaceDescription) {
        setError("No face detected. Please align your face clearly with the camera.");
        setLoading(false);
        return;
      }

      // Store descriptor as a regular array for Firestore
      const descriptorArray = Array.from(fullFaceDescription.descriptor);
      setDescriptors(prev => [...prev, descriptorArray]);
      setLoading(false);
    } catch (err) {
      setError("Face extraction failed.");
      setLoading(false);
    }
  };

  const registerUser = async () => {
    if (!name || descriptors.length === 0) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'users'), {
        name,
        phone,
        descriptors,
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setStep(3);
    } catch (err) {
      setError("Database registration failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 2) startVideo();
    return () => {
      if (videoRef.current?.srcObject) {
         (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [step]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Personnel <span className="text-neon-cyan">Enrollment</span></h2>
        <p className="text-slate-400 mt-2">Initialize biometric profiles for neural identification.</p>
      </header>

      {/* Stepper */}
      <div className="flex items-center justify-center space-x-4 mb-10">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={cn(
              "w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all",
              step === s ? "border-neon-cyan text-neon-cyan bg-neon-cyan/10 shadow-[0_0_15px_rgba(0,243,255,0.4)]" : 
              step > s ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-slate-800 text-slate-700"
            )}>
              {step > s ? <CheckCircle2 size={20} /> : s}
            </div>
            {s < 3 && <div className={cn("h-px w-10", step > s ? "bg-emerald-500" : "bg-slate-800")} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            id="step-1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-dark p-8 rounded-3xl space-y-6"
          >
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Full Identity Name</label>
                 <input 
                   type="text" 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   className="w-full bg-slate-900 border border-white/5 rounded-xl px-5 py-4 focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan outline-none transition-all placeholder:text-slate-700"
                   placeholder="e.g. Johnathan Sentinel"
                 />
               </div>
               <div>
                 <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Comms Channel / Phone</label>
                 <input 
                   type="text" 
                   value={phone}
                   onChange={(e) => setPhone(e.target.value)}
                   className="w-full bg-slate-900 border border-white/5 rounded-xl px-5 py-4 focus:ring-2 focus:ring-neon-cyan outline-none transition-all placeholder:text-slate-700 font-mono"
                   placeholder="+1 (888) 000-0000"
                 />
               </div>
             </div>
             <button 
               onClick={() => setStep(2)}
               disabled={!name}
               className="w-full bg-neon-cyan text-slate-950 font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(0,243,255,0.6)] disabled:opacity-50 disabled:hover:shadow-none transition-all"
             >
               Proceed to Biometric Scan
             </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            id="step-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark p-8 rounded-3xl space-y-6"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/5 group">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="scanner-line" />
              <div className="absolute inset-0 border-2 border-neon-cyan/20 m-8 rounded-full border-dashed animate-pulse " />
              
              <div className="absolute top-4 left-4 glass px-3 py-1 rounded-lg flex items-center space-x-2">
                <Info size={14} className="text-neon-cyan" />
                <span className="text-[10px] font-mono uppercase tracking-tighter">Capture 1-3 samples</span>
              </div>

              {descriptors.length > 0 && (
                <div className="absolute top-4 right-4 flex space-x-1">
                  {descriptors.map((_, i) => (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="w-2 h-2 bg-neon-cyan rounded-full shadow-[0_0_8px_rgba(0,243,255,1)]" />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center space-x-3">
                <AlertCircle className="text-red-500" size={18} />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={captureFace}
                disabled={loading || !isStreaming}
                className="flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
                <span>Capture Sample</span>
              </button>
              <button 
                onClick={registerUser}
                disabled={loading || descriptors.length === 0}
                className="flex items-center justify-center space-x-2 bg-neon-cyan text-slate-950 font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(0,243,255,0.6)] disabled:opacity-50 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                <span>Initialize Core</span>
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            id="step-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark p-12 rounded-3xl text-center space-y-6"
          >
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Enrollment Synchronized</h3>
              <p className="text-slate-400 mt-2 font-mono text-sm tracking-tight">Biometric profile for {name} is now live in the neural cluster.</p>
            </div>
            <div className="pt-4">
              <button 
                onClick={() => {
                  setName('');
                  setDescriptors([]);
                  setPhone('');
                  setSuccess(false);
                  setStep(1);
                }}
                className="text-neon-cyan font-mono text-xs uppercase tracking-widest hover:underline"
              >
                Register Another Personnel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
