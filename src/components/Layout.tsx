import React from 'react';
import { LayoutDashboard, Camera, UserPlus, LogOut, Cpu, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'recognition' | 'registration';
  onViewChange: (view: 'dashboard' | 'recognition' | 'registration') => void;
  onLogout: () => void;
}

export function Layout({ children, currentView, onViewChange, onLogout }: LayoutProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, color: 'text-neon-cyan', glow: 'shadow-[0_0_15px_rgba(0,243,255,0.5)]' },
    { id: 'recognition', label: 'Scanner', icon: Camera, color: 'text-neon-purple', glow: 'shadow-[0_0_15px_rgba(188,19,254,0.5)]' },
    { id: 'registration', label: 'Register', icon: UserPlus, color: 'text-neon-pink', glow: 'shadow-[0_0_15px_rgba(255,0,255,0.5)]' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-neon-pink/20">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col p-8 space-y-10 z-50">
        <div className="flex items-center space-x-4 group cursor-pointer">
          <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink rounded-2xl flex items-center justify-center p-0.5 shadow-[0_0_20px_rgba(188,19,254,0.3)] group-hover:shadow-[0_0_30px_rgba(188,19,254,0.5)] transition-all duration-500">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Cpu className="text-white w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter uppercase italic">Vision<span className="text-neon-cyan">Sentinel</span></h1>
            <p className="text-[8px] font-mono text-slate-500 tracking-[0.4em] uppercase font-black">Neural Interface v2.0</p>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onViewChange(item.id as any)}
              className={cn(
                "w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                currentView === item.id 
                  ? "bg-white/5 text-white shadow-xl" 
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.02]"
              )}
            >
              {currentView === item.id && (
                <motion.div 
                  layoutId="nav-bg"
                  className="absolute inset-0 bg-gradient-to-r from-white/[0.05] to-transparent -z-10" 
                />
              )}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                currentView === item.id ? cn("bg-white/10", item.color, item.glow) : "bg-white/5 group-hover:bg-white/10"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {currentView === item.id && (
                <motion.div 
                  layoutId="active-indicator" 
                  className={cn("ml-auto w-1.5 h-6 rounded-full", item.color.replace('text-', 'bg-'), item.glow)} 
                />
              )}
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-white/5 space-y-3">
          <button className="w-full flex items-center space-x-4 px-5 py-4 text-slate-500 hover:text-slate-200 rounded-2xl transition-all group">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold tracking-tight">Preferences</span>
          </button>
          <button 
            id="logout-btn"
            onClick={onLogout}
            className="w-full flex items-center space-x-4 px-5 py-4 text-slate-500 hover:text-red-400 rounded-2xl transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-red-500/10 transition-all">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold tracking-tight uppercase tracking-widest text-[10px]">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {/* Colorful Background Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-neon-cyan/10 blur-[180px] -z-10 rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-neon-purple/10 blur-[150px] -z-10 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-pink/5 blur-[200px] -z-10 rounded-full" />
        
        <div className="h-full overflow-y-auto p-12 max-w-7xl mx-auto relative">
          {children}
        </div>
      </main>
    </div>
  );
}
