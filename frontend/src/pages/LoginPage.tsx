import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AddTeammateModal } from '../components/modals/AddTeammateModal';

export const LoginPage: React.FC = () => {
  const { teammates, login } = useAuth();
  const navigate = useNavigate();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const toggleTeammate = (userId: string) => {
    if (activeUserId === userId) {
      setActiveUserId(null);
      setPassword('');
      setError(null);
    } else {
      setActiveUserId(userId);
      setPassword('');
      setError(null);
    }
  };

  const handleLogin = async (userId: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await login(userId, password || '123456');
      navigate('/tasks');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface-dim dark:bg-[#121212] flex justify-center py-6 px-3 selection:bg-ink-blue-container selection:text-primary">
      <div className="w-full max-w-[560px] flex flex-col px-margin-mobile pt-8 pb-10 min-h-screen bg-background rounded-2xl border border-outline shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] notepad-canvas-bg">
        {/* Brand Header */}
        <header className="w-full mb-xl pb-md border-b border-outline text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-ink-blue-container text-primary font-headline-lg text-headline-lg mb-2 shadow-minimal-lift">
            A
          </div>
          <h1 className="font-headline-lg text-[32px] text-on-surface">AgencySync</h1>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Minimalist stationery task & project flow for agency creators
          </p>
        </header>

        {/* Main Grid */}
        <main className="flex-1 flex flex-col justify-center items-center w-full">
          <div className="w-full max-w-[420px]">
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider text-center mb-6">
              Select Your Teammate Profile
            </p>

            <div className="grid grid-cols-2 gap-6 w-full">
              {teammates.map((teammate) => {
                const isSelected = activeUserId === teammate.id;

                return (
                  <div
                    key={teammate.id}
                    className={`flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? 'bg-surface-container/90 border-primary shadow-minimal-lift scale-[1.02]'
                        : 'bg-surface-bright/70 border-outline hover:border-outline-strong hover:bg-surface-container/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTeammate(teammate.id)}
                      className={`w-20 h-20 rounded-full flex items-center justify-center font-headline-lg text-headline-lg mb-2 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-on-primary ring-4 ring-primary/20 scale-105'
                          : 'bg-ink-blue-container text-primary hover:bg-primary-fixed'
                      }`}
                    >
                      {teammate.avatar}
                    </button>
                    <span className="font-body-lg text-body-lg text-on-surface font-medium">{teammate.name}</span>
                    <span className="font-label-sm text-label-sm text-secondary truncate max-w-[130px]">
                      {teammate.role}
                    </span>

                    {/* Expandable Password Drawer */}
                    {isSelected && (
                      <div className="w-full mt-4 animate-fadeIn">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleLogin(teammate.id);
                          }}
                          className="flex flex-col gap-3 border-t border-outline pt-3"
                        >
                          <div className="relative">
                            <label className="font-label-sm text-label-sm text-secondary block text-center mb-1">
                              Password / PIN
                            </label>
                            <input
                              autoFocus
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-transparent border-0 border-b border-outline focus:ring-0 focus:border-primary font-body-lg text-body-lg py-1 px-0 text-center"
                            />
                          </div>

                          {error && (
                            <p className="text-danger font-label-sm text-label-sm text-center">{error}</p>
                          )}

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary text-on-primary rounded-full py-2 font-label-sm text-label-sm transition-all hover:bg-surface-tint active:scale-95 disabled:opacity-50 shadow-sm"
                          >
                            {isSubmitting ? 'Entering...' : 'Log In'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Teammate Tile */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-outline hover:border-primary transition-all group cursor-pointer bg-surface/30">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-16 h-16 rounded-full border border-outline border-dashed flex items-center justify-center text-secondary mb-2 transition-all duration-200 group-hover:border-primary group-hover:text-primary group-hover:bg-ink-blue-container"
                >
                  <span className="material-symbols-outlined text-[24px]">add</span>
                </button>
                <span className="font-body-md text-body-md text-secondary group-hover:text-on-surface">
                  Add Teammate
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer Info */}
        <footer className="mt-auto pt-6 text-center border-t border-outline">
          <p className="font-label-sm text-label-sm text-secondary">
            Notepad Minimal Aesthetic • AgencySync v1.0
          </p>
        </footer>

        {/* Add Teammate Modal */}
        <AddTeammateModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      </div>
    </div>
  );
};
