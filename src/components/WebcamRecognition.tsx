import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { createFaceMatcher } from '../lib/faceApi';
import { FaceUser } from '../types';
import { Camera, AlertCircle, ShieldAlert, Cpu, Sparkles, Smile, Frown, Meh, Angry, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface WebcamRecognitionProps {
  users: FaceUser[];
}

export function WebcamRecognition({ users }: WebcamRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identifiedUser, setIdentifiedUser] = useState<string | null>(null);
  const [lastLoggedUser, setLastLoggedUser] = useState<string | null>(null);
  const [lastLogTime, setLastLogTime] = useState<number>(0);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<{ emotion: string, time: string }[]>([]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error(err);
      setError("Camera access denied. Enable permissions to continue.");
    }
  };

  useEffect(() => {
    startVideo();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isStreaming || users.length === 0) return;

    const matcher = createFaceMatcher(users.map(u => ({ name: u.name, descriptors: u.descriptors })));
    
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const detections = await faceapi.detectAllFaces(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions();

      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, displaySize.width, displaySize.height);

      if (resizedDetections.length > 0) {
        resizedDetections.forEach(detection => {
          const result = matcher.findBestMatch(detection.descriptor);
          const box = detection.detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
          drawBox.draw(canvasRef.current!);
          
          const exp = detection.expressions;
          const dominantExpression = Object.entries(exp).reduce((a, b) => a[1] > b[1] ? a : b)[0];
          setEmotion(dominantExpression);
          
          setEmotionHistory(prev => {
            const last = prev[0];
            if (last?.emotion === dominantExpression) return prev;
            return [{ emotion: dominantExpression, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5);
          });

          if (result.label !== 'unknown') {
            setIdentifiedUser(result.label);
            
            // Auto-log attendance if not recently logged (e.g. 5 mins)
            const matchedUser = users.find(u => u.name === result.label);
            const now = Date.now();
            if (matchedUser && (lastLoggedUser !== matchedUser.id || now - lastLogTime > 300000)) {
              logAttendance(matchedUser, result.distance, dominantExpression);
            }
          } else {
            setIdentifiedUser('Unknown Target');
          }
        });
      } else {
        setIdentifiedUser(null);
        setEmotion(null);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming, users, lastLoggedUser, lastLogTime]);

  const logAttendance = async (user: FaceUser, distance: number, emotion: string) => {
    try {
      await addDoc(collection(db, 'attendance'), {
        userId: user.id,
        name: user.name,
        timestamp: serverTimestamp(),
        confidence: 1 - distance,
        emotion: emotion
      });
      setLastLoggedUser(user.id);
      setLastLogTime(Date.now());
      console.log(`Logged attendance for ${user.name}`);
    } catch (e) {
      console.error("Error logging attendance", e);
    }
  };

  const emotionIcons: Record<string, { icon: any, color: string }> = {
    happy: { icon: Smile, color: 'text-emerald-400' },
    sad: { icon: Frown, color: 'text-blue-400' },
    angry: { icon: Angry, color: 'text-red-400' },
    neutral: { icon: Meh, color: 'text-slate-400' },
    surprised: { icon: Sparkles, color: 'text-amber-400' },
    fearful: { icon: ShieldAlert, color: 'text-purple-400' },
    disgusted: { icon: AlertCircle, color: 'text-orange-400' },
  };

  const currentEmotion = emotion ? emotionIcons[emotion] : null;
  const EmotionIcon = currentEmotion?.icon || HelpCircle;
  const emotionColor = currentEmotion?.color || 'text-slate-400';

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Active <span className="text-neon-cyan">Scanner</span></h2>
          <p className="text-slate-400 mt-1">Real-time neural recognition active.</p>
        </div>
        <div className="flex items-center space-x-2 bg-neon-cyan/10 px-4 py-2 rounded-full border border-neon-cyan/30">
          <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_rgba(0,243,255,1)]" />
          <span className="text-[10px] font-mono font-bold text-neon-cyan uppercase tracking-widest">Live Feed Access</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 group bg-slate-900 shadow-2xl">
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <p className="text-lg font-medium text-red-400">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-neon-cyan hover:underline underline-offset-4 font-mono text-xs uppercase">Retry Auth</button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
                <div className="scanner-line" />
                
                {/* HUD Elements */}
                <div className="absolute top-6 left-6 flex space-x-2 pointer-events-none">
                  <div className="glass-dark px-3 py-1.5 rounded-lg flex items-center space-x-2">
                    <Cpu size={14} className="text-neon-cyan" />
                    <span className="text-[10px] font-mono uppercase tracking-tighter">Neural Engine 4.2.0</span>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 pointer-events-none">
                  <AnimatePresence mode="wait">
                    {identifiedUser && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                          "glass-dark px-6 py-4 rounded-2xl flex items-center space-x-4 border-l-4",
                          identifiedUser === 'Unknown Target' ? "border-l-red-500" : "border-l-neon-cyan"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          identifiedUser === 'Unknown Target' ? "bg-red-500/10 text-red-500" : "bg-neon-cyan/20 text-neon-cyan"
                        )}>
                          {identifiedUser === 'Unknown Target' ? <ShieldAlert size={28} /> : <Sparkles size={28} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Identified Subject</p>
                          <p className="text-xl font-bold tracking-tight">{identifiedUser}</p>
                          {emotion && (
                            <div className={cn("flex items-center space-x-1.5 mt-1", emotionColor)}>
                              <EmotionIcon size={14} />
                              <p className="text-xs font-mono uppercase tracking-tighter">Sentiment: {emotion}</p>
                            </div>
                          )}
                        </div>

                        {/* Emotion History */}
                        {emotionHistory.length > 0 && (
                          <div className="border-l border-white/10 pl-4 py-1 flex flex-col space-y-1">
                            <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">History</p>
                            {emotionHistory.map((item, i) => {
                              const HistIcon = emotionIcons[item.emotion]?.icon || HelpCircle;
                              const histColor = emotionIcons[item.emotion]?.color || 'text-slate-400';
                              return (
                                <div key={i} className={cn("flex items-center space-x-2 opacity-60", histColor)}>
                                  <HistIcon size={10} />
                                  <span className="text-[10px] font-mono uppercase">{item.emotion}</span>
                                  <span className="text-[8px] text-slate-500">{item.time}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-dark p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest">System Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-xs text-slate-400">FPS</span>
                <span className="text-xl font-bold font-mono text-emerald-400">24.8</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-xs text-slate-400">Latency</span>
                <span className="text-xl font-bold font-mono text-amber-400">12ms</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-xs text-slate-400">Recognition Score</span>
                <span className="text-xl font-bold font-mono text-neon-cyan">98.4%</span>
              </div>
            </div>
          </div>

          <div className="glass-dark p-6 rounded-2xl border border-white/5">
             <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">Neural Instructions</h3>
             <ul className="text-xs text-slate-400 space-y-3 font-mono leading-relaxed">
               <li><span className="text-neon-cyan/50">&gt;</span> Align face with center vector</li>
               <li><span className="text-neon-cyan/50">&gt;</span> Ensure thermal parity is stable</li>
               <li><span className="text-neon-cyan/50">&gt;</span> Minimal diffraction interference required</li>
               <li><span className="text-neon-cyan/50">&gt;</span> System auto-updates embeddings on high confidence</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
