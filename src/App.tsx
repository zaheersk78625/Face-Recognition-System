import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, serverTimestamp, addDoc } from 'firebase/firestore';
import { loadModels } from './lib/faceApi';
import { FaceUser, AttendanceRecord } from './types';
import { WebcamRecognition } from './components/WebcamRecognition';
import { UserRegistration } from './components/UserRegistration';
import { Dashboard } from './components/Dashboard';
import { AdminLogin } from './components/AdminLogin';
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [view, setView] = useState<'dashboard' | 'recognition' | 'registration'>('dashboard');
  const [registeredUsers, setRegisteredUsers] = useState<FaceUser[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    loadModels().then(() => setModelsLoaded(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FaceUser));
      setRegisteredUsers(users);
    });
    return () => unsub();
  }, [user]);

  const handleLogout = () => signOut(auth);

  if (loading || !modelsLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-neon-cyan animate-spin" />
        <p className="font-mono text-neon-cyan/70 tracking-widest text-sm uppercase">Initializing Neural Networks...</p>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  return (
    <Layout currentView={view} onViewChange={setView} onLogout={handleLogout}>
      {view === 'dashboard' && <Dashboard users={registeredUsers} />}
      {view === 'recognition' && <WebcamRecognition users={registeredUsers} />}
      {view === 'registration' && <UserRegistration />}
    </Layout>
  );
}
