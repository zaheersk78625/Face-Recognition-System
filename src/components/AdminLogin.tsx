import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Cpu, ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';

export function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Authentication sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-cyan/5 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-dark p-10 rounded-[40px] border border-white/5 relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-neon-cyan/10 rounded-2xl flex items-center justify-center border border-neon-cyan/30 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
            <Cpu className="text-neon-cyan w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter">Vision<span className="text-neon-cyan">Sentinel</span></h1>
            <p className="text-slate-400 font-mono text-xs uppercase tracking-[0.2em]">Restricted Access Area</p>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

          <div className="space-y-4 w-full">
            <div className="flex items-center space-x-3 text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/5">
              <ShieldCheck className="text-neon-cyan w-5 h-5 shrink-0" />
              <p className="text-sm tracking-tight text-left">This system uses <span className="text-neon-cyan font-bold italic">Neural Auth v4</span> for biometric identity assurance.</p>
            </div>
            
            <button
              onClick={login}
              disabled={loading}
              className="w-full bg-white text-slate-950 font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-slate-200 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebase/anonymous-scan.png" className="w-5 h-5 hidden" alt="" />
              <span>Continue with Google Secure Login</span>
              <ArrowRight size={18} />
            </button>

            {error && (
              <p className="text-red-400 text-xs font-mono bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>
            )}
          </div>

          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest pt-4">
            Security Level: <span className="text-amber-500/80">Class-A Restricted</span>
          </p>
        </div>
      </motion.div>

      {/* Decroative Elements */}
      <div className="absolute top-10 left-10 opacity-20 pointer-events-none font-mono text-[10px] text-neon-cyan">
        FRAME_BUFFER: INITIALIZING...<br/>
        DESCRIPTORS_LOADED: 100%<br/>
        ENCRYPTION: AES-256-GCM
      </div>
      <div className="absolute bottom-10 right-10 opacity-20 pointer-events-none font-mono text-[10px] text-neon-cyan text-right">
        NODE_STATUS: STABLE<br/>
        REGION: US-WEST1-NEURAL<br/>
        LATENCY: &lt;1MS
      </div>
    </div>
  );
}
