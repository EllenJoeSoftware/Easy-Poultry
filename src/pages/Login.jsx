import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, Lock, User as UserIcon, Bird, Sparkles, ArrowRight, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { isFirebaseConfigured } from '@/lib/firebase';
import { createPageUrl } from '@/utils';

export default function Login() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('return') || createPageUrl('Dashboard');

  // Redirect immediately if already signed in (skip when in reset mode so they
  // can stay on the page after clicking the email link)
  useEffect(() => {
    if (mode === 'reset') return;
    const unsub = api.auth.onChange((u) => {
      if (u) {
        navigate(returnUrl.startsWith('/') ? returnUrl : '/' + returnUrl, { replace: true });
      }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [navigate, returnUrl, mode]);

  const switchMode = (next) => {
    setMode(next);
    setError(null);
    setResetSent(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        await api.auth.signIn(email, password);
        toast.success('Welcome back!');
      } else if (mode === 'signup') {
        await api.auth.signUp(email, password, { full_name: fullName });
        toast.success('Account created! Welcome to Easy Poultry.');
      } else if (mode === 'reset') {
        await api.auth.sendPasswordReset(email);
        setResetSent(true);
        toast.success('Reset link sent — check your inbox.');
      }
    } catch (err) {
      const code = err?.code || '';
      const friendly =
        code.includes('wrong-password') || code.includes('user-not-found') || code.includes('invalid-credential')
          ? 'Wrong email or password.'
          : code.includes('email-already')
            ? 'An account with that email already exists.'
            : code.includes('weak-password')
              ? 'Password must be at least 6 characters.'
              : code.includes('invalid-email')
                ? 'That email address looks invalid.'
                : code.includes('too-many-requests')
                  ? 'Too many attempts. Please wait a few minutes and try again.'
                  : code.includes('missing-email')
                    ? 'Please enter your email address.'
                    : err?.message || 'Something went wrong. Please try again.';
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await api.auth.signInWithGoogle();
      toast.success('Signed in with Google');
    } catch (err) {
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Reset-mode: simplified panel after the link is sent
  if (mode === 'reset' && resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-6">
        <div className="card-premium p-10 max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-moss-50 border border-moss-100 flex items-center justify-center text-moss-700 mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-display text-3xl text-ink mb-3">Check your inbox</h2>
          <p className="text-ink/70 leading-relaxed mb-8">
            We've sent a password reset link to <span className="font-medium text-ink">{email}</span>.
            Click the link in that email to choose a new password.
          </p>
          <p className="text-xs text-ink/50 mb-6">
            Don't see it? Check your spam folder, or wait 30 seconds and try again.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => { switchMode('signin'); }}
              className="btn-cta w-full h-11 text-sm"
            >
              Back to sign in
            </Button>
            <button
              type="button"
              onClick={() => { setResetSent(false); }}
              className="text-xs text-ink/50 hover:text-moss-700 hover:underline mt-2"
            >
              Send to a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left — branded panel */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-moss-600 via-moss-700 to-ink-soft">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.4) 0%, transparent 30%), radial-gradient(circle at 80% 70%, rgba(224,122,95,.3) 0%, transparent 40%)',
        }} />
        <div className="absolute inset-0 backdrop-blur-3xl opacity-30" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bird className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Easy Poultry</span>
          </Link>

          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl lg:text-5xl font-bold leading-tight mb-6"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              The complete poultry platform.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-white/80 leading-relaxed max-w-md"
            >
              Marketplace, auctions, competitions, farm management & incubation — all in one place. Trusted by farmers across South Africa.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-10 grid grid-cols-3 gap-4"
            >
              {[
                { n: '4k+', l: 'Active sellers' },
                { n: 'R12M+', l: 'Auctions traded' },
                { n: '24/7', l: 'Marketplace' },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/10">
                  <div className="text-2xl font-bold">{s.n}</div>
                  <div className="text-xs text-white/70 mt-1">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <p className="text-white/60 text-sm">© {new Date().getFullYear()} Easy Poultry. All rights reserved.</p>
        </div>

        {/* Decorative orbs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-terracotta-400/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <Link to="/" className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-moss-600 to-ink-soft flex items-center justify-center">
              <Bird className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Easy Poultry</span>
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-moss-700 transition-colors mb-4 group"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                  Back to sign in
                </button>
              )}
              <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                {mode === 'signin' && 'Welcome back'}
                {mode === 'signup' && 'Create your account'}
                {mode === 'reset'  && 'Reset your password'}
              </h2>
              <p className="text-gray-500 mb-8">
                {mode === 'signin' && 'Sign in to manage your farm, listings, and auctions.'}
                {mode === 'signup' && 'Join thousands of poultry farmers and buyers.'}
                {mode === 'reset'  && "Enter the email you signed up with and we'll send you a reset link."}
              </p>

              {!isFirebaseConfigured && (
                <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
                  <Sparkles className="w-4 h-4 !text-amber-600" />
                  <AlertDescription className="text-sm">
                    Running in <b>demo mode</b>. Configure Firebase in <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">.env.local</code> to enable real sign-up.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50 text-red-900">
                  <AlertCircle className="w-4 h-4 !text-red-600" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {mode !== 'reset' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogle}
                disabled={googleLoading || !isFirebaseConfigured}
                className="w-full h-12 mb-4 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400 tracking-wider">or with email</span>
                </div>
              </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="fullName" className="text-gray-700">Full name</Label>
                    <div className="relative mt-1.5">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Wycliffe Mohapi"
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="email" className="text-gray-700">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700">Password</Label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => switchMode('reset')}
                        className="text-xs text-moss-700 hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••••"
                      className="pl-10 pr-10 h-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-moss-gradient hover:opacity-95 text-cream font-medium shadow-lg shadow-moss-600/25"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === 'signin' && 'Sign in'}
                      {mode === 'signup' && 'Create account'}
                      {mode === 'reset'  && 'Send reset link'}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </form>

              {mode !== 'reset' && (
                <p className="mt-8 text-sm text-center text-gray-500">
                  {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="text-moss-700 hover:underline font-medium"
                  >
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              )}
              {mode === 'reset' && (
                <p className="mt-8 text-sm text-center text-gray-500">
                  Remembered it?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-moss-700 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
