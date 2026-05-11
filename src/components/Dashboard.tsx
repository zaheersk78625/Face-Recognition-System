import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FaceUser, AttendanceRecord } from '../types';
import { Users, Clock, ShieldCheck, Activity, User, PieChart as PieIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { formatTimestamp, cn } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  users: FaceUser[];
}

export function Dashboard({ users }: DashboardProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setAttendance(logs);
    });
    return () => unsub();
  }, []);

  const emotionData = attendance.reduce((acc: any[], log) => {
    if (!log.emotion) return acc;
    const emotionName = log.emotion.charAt(0).toUpperCase() + log.emotion.slice(1);
    const existing = acc.find(a => a.name === emotionName);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: emotionName, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#00f3ff', '#bc13fe', '#ff00ff', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

  const stats = [
    { label: 'Registered Personnel', value: users.length, icon: Users, color: 'text-neon-cyan', bg: 'bg-neon-cyan/20', glass: 'glass-vibrant-cyan' },
    { label: 'Security Uptime', value: '99.98%', icon: ShieldCheck, color: 'text-neon-emerald', bg: 'bg-neon-emerald/20', glass: 'glass-vibrant-emerald border-neon-emerald/20' },
    { label: 'Active Sessions', value: attendance.length > 0 ? attendance.filter(a => {
      const then = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      return (Date.now() - then.getTime()) < 3600000;
    }).length : 0, icon: Activity, color: 'text-neon-pink', bg: 'bg-neon-pink/20', glass: 'glass-vibrant-pink' },
  ];

  return (
    <div className="space-y-10">
      <header className="relative py-4">
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-neon-cyan via-neon-purple to-neon-pink rounded-full blur-[2px]" />
        <h2 className="text-4xl font-black tracking-tight uppercase italic">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink">Intelligence</span> Dashboard
        </h2>
        <p className="text-slate-400 mt-1 font-mono text-xs uppercase tracking-[0.3em] opacity-70">Neural Cluster Synchronized // Multi-Node Monitoring</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            id={`stat-card-${idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              stat.glass || "glass-dark",
              "p-6 rounded-[2rem] relative overflow-hidden group transition-all hover:scale-[1.02]"
            )}
          >
            <div className={stat.bg + " absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity"} />
            <div className="flex items-center space-x-5">
              <div className={cn(stat.bg, "p-4 rounded-2xl", stat.color, "shadow-[0_0_15px_rgba(0,0,0,0.2)]")}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                <p className="text-3xl font-black mt-1 font-mono tracking-tighter">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-dark p-8 rounded-[2.5rem] border border-white/5 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 blur-[60px] rounded-full" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center border border-neon-purple/30">
                <PieIcon className="text-neon-purple w-4 h-4" />
              </div>
              <h3 className="font-bold uppercase tracking-widest text-[10px] text-slate-400 font-mono">Neural Sentiment Distribution</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emotionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={10}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {emotionData.map((_entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="outline-none hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(20px)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', textTransform: 'capitalize', fontWeight: 'bold' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontClassName: 'font-mono', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-dark p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-pink/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
           <div className="w-20 h-20 bg-neon-cyan/10 rounded-3xl flex items-center justify-center border border-neon-cyan/20 group-hover:border-neon-cyan/50 transition-all rotate-3 group-hover:rotate-12">
              <Activity className="text-neon-cyan w-10 h-10 animate-pulse" />
           </div>
           <div className="space-y-3">
              <h4 className="font-black text-xl tracking-tight uppercase italic underline decoration-neon-cyan/30 decoration-4">Integrity</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">Edge network synchronization is currently operating at peak photonic efficiency.</p>
           </div>
           <div className="w-full pt-6 border-t border-white/5 space-y-3">
              <div className="flex justify-between text-[8px] font-mono font-black text-slate-500 tracking-[0.2em]">
                 <span>SYNC_STATUS</span>
                 <span className="text-neon-emerald">OPTIMAL_LINK</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                 <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '94%' }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink rounded-full" 
                 />
              </div>
           </div>
        </div>
      </div>

      {/* Attendance Logs */}
      <div className="glass-dark rounded-2xl overflow-hidden border border-white/5">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-neon-purple" />
            <h3 className="font-semibold">Recent Identification Logs</h3>
          </div>
          <button className="text-xs font-mono text-neon-cyan hover:underline uppercase tracking-tighter">View Master Log</button>
        </div>
        <div className="divide-y divide-white/5">
          {attendance.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">
              No identification records detected.
            </div>
          ) : (
            attendance.map((log, idx) => (
              <motion.div 
                key={log.id} 
                id={`log-entry-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-6 py-4 flex items-center group hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-neon-cyan/20 group-hover:text-neon-cyan transition-colors">
                  <User size={18} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-sm">{log.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">UID: {log.userId.slice(0, 8)}...</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-slate-400">{formatTimestamp(log.timestamp)}</p>
                  <div className="flex items-center justify-end mt-1 space-x-2">
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-amber-400 uppercase font-bold tracking-tighter">
                      Conf: {(log.confidence * 100).toFixed(1)}%
                    </span>
                    {log.emotion && (
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-neon-purple uppercase font-bold tracking-tighter">
                        {log.emotion}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
