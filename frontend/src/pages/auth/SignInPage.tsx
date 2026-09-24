import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Eye,
  EyeOff,
  Factory,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Warehouse,
} from 'lucide-react';

const quickLogins = [
  { label: 'Admin', email: 'admin@apex.com', role: 'Executive' },
  { label: 'Production Manager', email: 'production@apex.com', role: 'Operations' },
  { label: 'HR Manager', email: 'hr@apex.com', role: 'People & HR' },
  { label: 'Operator', email: 'operator@apex.com', role: 'Shopfloor' },
];

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const demoLoginEnabled = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(12,135,235,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(2,108,201,0.08),transparent_30%)]" />
      <div className="absolute inset-0 opacity-[0.38] [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/80 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-[2px] lg:grid lg:grid-cols-[45%_55%]">
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-8 text-slate-100 lg:flex">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(12,135,235,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.12),transparent_28%)]" />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-400/40 bg-brand-600/15 text-brand-200 shadow-[0_12px_28px_rgba(2,108,201,0.18)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-200">Lumirise</p>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Enterprise platform</p>
                </div>
              </div>

              <div className="mt-12 max-w-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">Operations clarity</p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  LUMIRISE
                </h1>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Enterprise Manufacturing ERP + CRM + HRMS Platform
                </p>
              </div>
            </div>

            <div className="relative z-10">
              <p className="max-w-sm text-sm leading-6 text-slate-300">
                Bring operations, people, inventory, revenue, and execution into a single workspace built for high-performing teams.
              </p>
            </div>
          </aside>

          <main className="flex items-center justify-center bg-slate-50/60 px-4 py-8 sm:px-8 lg:px-12">
            <div className="w-full max-w-[460px]">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-700">Lumirise</p>
                  <p className="text-xs text-slate-500">Enterprise workspace</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)] sm:p-8">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Welcome back</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                    Sign in to your workspace
                  </h2>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                  >
                    {error}
                  </div>
                )}

                {forgotPasswordMessage && (
                  <div
                    role="status"
                    className="mb-5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700"
                  >
                    {forgotPasswordMessage}
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <Input
                    label="Business Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    leftIcon={<Mail className="h-4 w-4" />}
                  />

                  <div>
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      leftIcon={<Lock className="h-4 w-4" />}
                      rightIcon={
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />

                    <div className="mt-2 flex items-center justify-end">
                      <button
                        type="button"
                        className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 rounded-md"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setForgotPasswordMessage('Password reset requests should be sent to your workspace administrator or support team.');
                          setError('');
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="mt-2 w-full justify-center"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Sign in to Lumirise
                  </Button>
                </form>

                {demoLoginEnabled && (
                  <div className="mt-6 border-t border-slate-200 pt-5">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Demo access
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {quickLogins.map((q) => (
                        <button
                          key={q.email}
                          type="button"
                          onClick={() => {
                            setEmail(q.email);
                            setPassword('Password123!');
                          }}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2.5 text-left transition-colors hover:border-brand-200 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
                        >
                          <p className="text-[11px] font-semibold text-slate-800 leading-tight">{q.label}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{q.role}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
