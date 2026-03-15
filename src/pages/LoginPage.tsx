import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabaseClient';
import { Ticket, Mail, Lock, ArrowRight, Loader2, User as UserIcon, Sun, Moon, ChevronLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const LoginPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Wait for session to load (handles OAuth token resolution)
  if (isLoading) return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </div>
  );

  // Auto-redirect if already logged in
  if (user) {
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isSignup) {
        // Sign Up with Supabase
        const { data, error: signupError } = await supabase.auth.signUp({ 
          email: email.trim(), 
          password: password,
          options: {
            data: { full_name: name.trim() || email.split('@')[0] }
          }
        });
        
        if (signupError) throw signupError;
        
        if (data?.user && !data.session) {
          setSuccessMsg('Signup successful! Please check your email for confirmation, or wait for admin approval.');
          setIsSignup(false); // Switch to login view
        } else if (data.session) {
          setSuccessMsg('Account created successfully!');
          navigate('/');
        }
      } else {
        // Sign In with Supabase
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setGoogleLoading(true);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      setGoogleLoading(false);
    }
  };

  const handleProviderLogin = async (provider: 'microsoft') => {
    try {
        setError('');
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: 'azure',
            options: {
                redirectTo: `${window.location.origin}/`,
            }
        });
        if (oauthError) throw oauthError;
    } catch (err: any) {
        setError(err.message || `Failed to login with ${provider}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Return to Landing Page */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-surface)] border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-violet-500/30 transition-all shadow-xl backdrop-blur-md text-xs font-bold uppercase tracking-widest active:scale-95"
        >
          <ChevronLeft size={16} className="text-violet-400" />
          Back to Home
        </button>
      </div>

      {/* Theme Toggle for Login Page */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="p-3 bg-[var(--bg-surface)] border border-white/10 rounded-full text-slate-400 hover:text-amber-400 hover:border-amber-400/30 transition-all shadow-xl backdrop-blur-md"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      {/* Background Glows */}
      <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md animate-slide-up z-10 relative">
        <div className="glass-card p-10 mt-8 mb-8">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.4)] mb-6 animate-pulse-glow">
              <Ticket size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                {isSignup ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-[var(--text-secondary)] text-sm text-center">
                {isSignup ? 'Sign up to file your first ticket' : 'Sign in to the Ticketing Management System'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-center animate-fade-in">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm text-center animate-fade-in">
                {successMsg}
              </div>
            )}

            {isSignup && (
                <div className="space-y-1 animate-fade-in">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-violet-400 transition-colors" />
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field has-icon py-3"
                            placeholder="John Doe"
                            autoComplete="off"
                        />
                    </div>
                </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-violet-400 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field has-icon py-3"
                  placeholder="name@fastservices.com"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                {!isSignup && <span className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer">Forgot?</span>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-violet-400 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field has-icon py-3"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary w-full py-3 mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {isSignup ? 'Sign Up' : 'Sign In'} <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>
            
            <div className="text-center mt-4">
                <button 
                    type="button" 
                    onClick={() => setIsSignup(!isSignup)} 
                    className="text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition-colors"
                >
                    {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
            </div>
          </form>

          {/* Social Logins */}
          <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
              <p className="text-xs text-center text-slate-500 uppercase tracking-wider font-semibold">Or continue with</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-white/10 hover:border-violet-500/30 transition-all text-sm text-[var(--text-primary)] font-medium group disabled:opacity-60 disabled:cursor-not-allowed shadow-sm focus:ring-1 focus:ring-violet-500/20"
                >
                    {googleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                          <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                          <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                          <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                          <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                          </g>
                      </svg>
                    )}
                    {googleLoading ? 'Redirecting...' : 'Google'}
                </button>
                <button 
                  onClick={() => handleProviderLogin('microsoft')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-white/10 hover:border-violet-500/30 transition-all text-sm text-[var(--text-primary)] font-medium group shadow-sm focus:ring-1 focus:ring-violet-500/20"
                >
                    <svg viewBox="0 0 21 21" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#f25022" d="M1 1h9v9H1z"/>
                        <path fill="#7fba00" d="M11 1h9v9h-9z"/>
                        <path fill="#00a4ef" d="M1 11h9v9H1z"/>
                        <path fill="#ffb900" d="M11 11h9v9h-9z"/>
                    </svg>
                    Microsoft
                </button>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};
