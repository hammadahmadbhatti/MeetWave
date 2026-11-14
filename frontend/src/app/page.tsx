'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GenderSelector from '@/components/GenderSelector';
import CountrySelector from '@/components/CountrySelector';
import { useUserStore } from '@/store/userStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const { user, setUser, setPreferences, hydrate } = useUserStore();
  const [gender, setGender] = useState('ANY');
  const [country, setCountry] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrate();
    api.getStats().then((data) => setOnlineCount(data.onlineCount)).catch(() => {});
  }, [hydrate]);

  const handleStart = async () => {
    setLoading(true);
    try {
      setPreferences({ gender: gender !== 'ANY' ? gender : undefined, country: country || undefined });

      if (!user) {
        const result = await api.guestLogin();
        setUser(result.user, result.token);
      }
      router.push('/chat');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onlineCount={onlineCount} showAuth={!user} />

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center pt-16">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          {/* Decorative glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 relative">
            <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-emerald-300 bg-clip-text text-transparent">
              Meet New People
            </span>
          </h1>
          <p className="text-xl text-surface-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Connect with strangers from around the world through instant video chat.
            Free, anonymous, and exciting.
          </p>

          {/* Setup card */}
          <div className="glass rounded-2xl p-8 max-w-md mx-auto mb-12 relative">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2 text-left">I want to chat with</label>
                <GenderSelector value={gender} onChange={setGender} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2 text-left">Country preference</label>
                <CountrySelector value={country} onChange={setCountry} />
              </div>
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-white font-bold text-lg rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-brand-500/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  '🎥 Start Chatting'
                )}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: '⚡', title: 'Instant Match', desc: 'Get connected to random people in seconds' },
              { icon: '🌍', title: 'Global Community', desc: 'Chat with people from over 190 countries' },
              { icon: '🔒', title: 'Private & Secure', desc: 'Anonymous chats with no data stored' },
            ].map((f) => (
              <div key={f.title} className="glass rounded-xl p-6 text-left">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-surface-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
