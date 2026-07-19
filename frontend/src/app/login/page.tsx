'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, User, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LoginPage() {
  const router = useRouter();
  const { token, setAuth } = useStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if logged in
  useEffect(() => {
    if (token) {
      router.push('/');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        // Log in
        const res = await api.post('/auth/login', {
          emailOrUsername: email || username,
          password,
        });
        setAuth(res.token, res.user);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
        router.push('/');
      } else {
        // Sign up
        const res = await api.post('/auth/signup', {
          username,
          email,
          password,
        });
        setAuth(res.token, res.user);
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.8 } });
        router.push('/');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cozy-bg dark:bg-[#1A1813]">
      {/* Floating cozy SVG circle blobs */}
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-cozy-lavender/30 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-cozy-mint/30 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md glass-card p-8 relative z-10 cozy-hover">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cozy-lavender rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-cozy mb-4 animate-float">
            🎒
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-[#F3EFE6] tracking-tight">StudyQuest AI</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            "The app that understands HOW you study, not just what you answer."
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 text-center font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Username (e.g. BrambleFan)"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-cozy-lavender text-sm"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type={isLogin ? "text" : "email"}
              placeholder={isLogin ? "Username or Email" : "Email Address"}
              required
              value={isLogin ? username || email : email}
              onChange={(e) => {
                if (isLogin) {
                  setUsername(e.target.value);
                  setEmail(e.target.value);
                } else {
                  setEmail(e.target.value);
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-cozy-lavender text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-cozy-lavender text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cozy-lavender text-cozy-lavender-deep hover:bg-cozy-lavender-dark transition-all rounded-xl font-bold flex items-center justify-center space-x-2 text-sm shadow-cozy cursor-pointer active:scale-95"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-cozy-lavender-deep border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{isLogin ? 'Enter Village' : 'Create My Character'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
            }}
            className="text-xs text-cozy-lavender-deep hover:underline font-semibold"
          >
            {isLogin ? "New player? Create a character here!" : "Already registered? Enter the village!"}
          </button>
        </div>

        {/* Demo Credentials hint */}
        {isLogin && (
          <div className="mt-8 p-3 bg-cozy-mint/20 border border-cozy-mint rounded-xl text-center">
            <p className="text-[10px] text-cozy-mint-deep font-semibold">💡 Cozy Sandbox Note</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
              Simply input any mock details to sign up and instantly start playing with your study village!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
