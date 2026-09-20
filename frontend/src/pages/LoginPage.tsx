import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

export const LoginPage: React.FC = () => {
  const { teammates, login } = useAuth();
  const navigate = useNavigate();

  // Multi-step flow: 'identify' -> 'password'
  const [step, setStep] = useState<'identify' | 'password'>('identify');
  const [identifier, setIdentifier] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showQuickSelect, setShowQuickSelect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Filter out revoked users for quick selection list
  const activeTeammates = teammates.filter(t => t.status !== 'revoked');

  // Step 1: Who are you?
  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const query = identifier.trim().toLowerCase();
    if (!query) {
      setError('Please enter your work email or name.');
      return;
    }

    // Match by exact email, email prefix, name, or id
    const matched = teammates.find(t => {
      const email = (t.email || '').toLowerCase();
      const name = (t.name || '').toLowerCase();
      const id = (t.id || '').toLowerCase();
      return email === query || email.startsWith(query) || name === query || name.includes(query) || id === query;
    });

    if (!matched) {
      setError(`No account found for "${identifier}". If you are new to Skybridge Systems, request access below.`);
      return;
    }

    if (matched.status === 'revoked') {
      setError(`Access for ${matched.name} has been revoked by an administrator. Please contact Mahim.`);
      return;
    }

    setSelectedUser(matched);
    setStep('password');
    setPassword('');
    setError(null);
  };

  const handleSelectTeammate = (user: User) => {
    if (user.status === 'revoked') {
      setError(`Access for ${user.name} has been revoked by an administrator.`);
      return;
    }
    setSelectedUser(user);
    setIdentifier(user.email);
    setStep('password');
    setPassword('');
    setError(null);
  };

  // Step 2: Password Authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await login(selectedUser.id, password || '123456');
      navigate('/tasks');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Incorrect password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToIdentify = () => {
    setStep('identify');
    setPassword('');
    setError(null);
  };

  const handleCopyMahimEmail = () => {
    navigator.clipboard.writeText('mahim@yourskybridge.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="min-h-screen w-full bg-surface-dim dark:bg-[#0f0f11] flex flex-col items-center justify-center py-8 px-4 selection:bg-ink-blue-container selection:text-primary">
      <div className="w-full max-w-[540px] flex flex-col gap-6">

        {/* System Explanation & Minimal Branding Header */}
        <header className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-ink-blue-container dark:bg-primary-container/20 border border-primary/20 text-primary rounded-full mb-3 text-xs font-semibold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            Internal Operations Portal
          </div>
          
          <div className="flex flex-col items-center justify-center gap-1.5 mb-1.5">
            <img
              src="/skybridge-logo.png"
              alt="Skybridge Systems"
              className="h-10 sm:h-12 w-auto object-contain mb-1"
            />
            <h1 className="font-headline-md text-2xl sm:text-3xl text-on-surface font-bold tracking-tight">
              AgencySync
            </h1>
          </div>
          
          <p className="font-body-md text-sm text-secondary max-w-[420px] leading-relaxed mt-1">
            Skybridge Systems's internal task & project flow portal — managing client deliverables, task pipelines, CRM leads, and design operations.
          </p>
        </header>

        {/* Main Authentication Card */}
        <div className="w-full bg-background dark:bg-[#18181b] rounded-3xl border border-outline shadow-xl p-6 sm:p-8 notepad-canvas-bg transition-all">
          
          {/* Security Indicator */}
          <div className="flex items-center justify-between pb-4 border-b border-outline mb-6">
            <div className="flex items-center gap-2 text-xs text-secondary font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Secure Gateway</span>
            </div>
            <span className="font-label-sm text-[11px] text-secondary/70 uppercase tracking-wider">
              256-Bit Encrypted
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-error/10 border border-error/20 rounded-2xl flex items-start gap-2.5 text-error text-sm animate-fadeIn">
              <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0">error</span>
              <span className="font-body-md leading-snug">{error}</span>
            </div>
          )}

          {/* STEP 1: WHO ARE YOU? */}
          {step === 'identify' && (
            <form onSubmit={handleIdentify} className="flex flex-col gap-4 animate-fadeIn">
              <div>
                <h2 className="font-headline-sm text-xl text-on-surface font-semibold mb-1">
                  Who are you?
                </h2>
                <p className="font-body-md text-sm text-secondary">
                  Enter your work email address or name to access your workspace.
                </p>
              </div>

              <div className="relative mt-2">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-secondary">
                  badge
                </span>
                <input
                  type="text"
                  autoFocus
                  required
                  value={identifier}
                  onChange={e => {
                    setIdentifier(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. mahim@yourskybridge.com or name"
                  className="w-full pl-11 pr-4 py-3 bg-surface-container border border-outline rounded-2xl font-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-base"
                />
              </div>

              <button
                type="submit"
                disabled={!identifier.trim()}
                className="w-full mt-2 py-3 rounded-2xl bg-primary text-on-primary font-body-md font-medium text-base shadow-sm hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>

              {/* Quick Select Teammate (Collapsible for convenience) */}
              <div className="pt-3 border-t border-outline/60 mt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickSelect(prev => !prev)}
                  className="w-full flex items-center justify-between text-xs text-secondary hover:text-on-surface transition-colors py-1 cursor-pointer"
                >
                  <span className="font-medium">Or select from known workspace profiles</span>
                  <span className="material-symbols-outlined text-[16px]">
                    {showQuickSelect ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {showQuickSelect && (
                  <div className="grid grid-cols-2 gap-2 mt-3 animate-fadeIn max-h-48 overflow-y-auto pr-1">
                    {activeTeammates.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTeammate(t)}
                        className="flex items-center gap-2.5 p-2 rounded-xl border border-outline hover:border-primary/50 hover:bg-surface-container transition-all text-left group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-ink-blue-container text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                          {t.avatar?.length === 1 ? t.avatar : t.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-body-md text-xs font-medium text-on-surface truncate">{t.name}</p>
                          <p className="font-label-sm text-[10px] text-secondary truncate">{t.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}

          {/* STEP 2: PASSWORD AUTHENTICATION */}
          {step === 'password' && selectedUser && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4 animate-fadeIn">
              {/* Selected Profile Badge */}
              <div className="flex items-center justify-between p-3 bg-surface-container rounded-2xl border border-outline">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-sm">
                    {selectedUser.avatar?.length === 1 ? selectedUser.avatar : selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-title-md text-sm font-semibold text-on-surface truncate">{selectedUser.name}</p>
                    <p className="font-label-sm text-xs text-secondary truncate">{selectedUser.role} • {selectedUser.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBackToIdentify}
                  className="text-xs text-primary hover:underline font-medium flex items-center gap-1 pl-2 flex-shrink-0 cursor-pointer"
                  title="Switch Account"
                >
                  <span>Switch</span>
                  <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                </button>
              </div>

              <div>
                <label className="font-label-sm text-xs text-secondary block mb-1.5 font-medium">
                  Workspace Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-secondary">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-11 py-3 bg-surface-container border border-outline rounded-2xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface cursor-pointer p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="font-label-sm text-[11px] text-secondary/80 mt-1.5">
                  Prototype environment: default teammate password is <code>123456</code>.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 rounded-2xl bg-primary text-on-primary font-body-md font-medium text-base shadow-sm hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">login</span>
                    <span>Sign In to Workspace</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* NOT A MEMBER SECTION (Contact Mahim) */}
          <div className="mt-6 pt-5 border-t border-outline flex flex-col gap-2.5 bg-surface-container/40 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-5 sm:p-6 rounded-b-3xl">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-primary mt-0.5 flex-shrink-0">
                contact_mail
              </span>
              <div className="flex-1">
                <p className="font-body-md text-xs font-semibold text-on-surface">
                  Not a team member yet?
                </p>
                <p className="font-label-sm text-[11px] text-secondary leading-snug mt-0.5">
                  Access is strictly limited to invited Skybridge Systems staff and contractors. Need access?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <a
                href="mailto:mahim@yourskybridge.com?subject=AgencySync%20-%20Access%20Request&body=Hi%20Mahim,%0A%0AI%20would%20like%20to%20request%20team%20access%20to%20AgencySync.%0A%0AFull%20Name:%20%0ARole%20/%20Title:%20%0AWork%20Email:%20"
                className="flex-1 py-2 px-3 rounded-xl bg-surface border border-outline hover:border-primary text-primary text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:bg-ink-blue-container"
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                <span>Contact Mahim for Access</span>
              </a>

              <button
                type="button"
                onClick={handleCopyMahimEmail}
                className="py-2 px-3 rounded-xl border border-outline text-secondary hover:text-on-surface hover:bg-surface text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                title="Copy Mahim's email"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {copiedEmail ? 'check' : 'content_copy'}
                </span>
                <span>{copiedEmail ? 'Copied!' : 'Copy Email'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* WANDERING VISITORS REDIRECT CARD (Website: www.yourskybridge.com) */}
        <div className="w-full bg-surface dark:bg-[#18181b]/70 border border-outline rounded-3xl p-5 flex items-center justify-between gap-4 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-surface-container border border-outline p-1.5 flex items-center justify-center flex-shrink-0">
              <img src="/skybridge-logo.png" alt="Skybridge Systems" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="font-title-md text-xs sm:text-sm font-semibold text-on-surface truncate">
                Looking for Skybridge Systems services?
              </p>
              <p className="font-label-sm text-[11px] text-secondary leading-snug truncate">
                Visit our official agency website for creative design, web development, and digital growth.
              </p>
            </div>
          </div>

          <a
            href="https://www.yourskybridge.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-medium hover:opacity-95 transition-opacity shadow-sm flex-shrink-0"
          >
            <span>yourskybridge.com</span>
            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
          </a>
        </div>

        {/* Minimal Footer */}
        <footer className="text-center">
          <p className="font-label-sm text-[11px] text-secondary/60">
            Skybridge Systems Inc. • Confidential internal portal • All rights reserved
          </p>
        </footer>

      </div>
    </div>
  );
};
