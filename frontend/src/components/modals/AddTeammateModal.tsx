import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AddTeammateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTeammateModal: React.FC<AddTeammateModalProps> = ({ isOpen, onClose }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('Product Designer');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const generatedEmail = email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '')}@agencysync.co`;
      await register(name.trim(), role.trim(), generatedEmail);
      setName('');
      setEmail('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add teammate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/25 dark:bg-black/50 px-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-surface dark:bg-surface-dim border border-outline rounded-2xl w-full max-w-sm sm:max-w-md p-lg shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-md pb-2 border-b border-outline">
          <h3 className="font-headline-md text-headline-md text-on-surface">Add Teammate</h3>
          <button onClick={onClose} className="p-1 text-secondary hover:text-on-surface rounded-full">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-md p-2 text-danger font-label-sm text-label-sm bg-danger/10 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          {/* Name Input */}
          <div className="relative">
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Full Name</label>
            <input
              required
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-lg text-body-lg text-on-surface focus:ring-0 focus:border-primary"
            />
          </div>

          {/* Role Input */}
          <div className="relative">
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Role / Title</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Brand Strategist"
              className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-md text-body-md text-on-surface focus:ring-0 focus:border-primary"
            />
          </div>

          {/* Optional Email */}
          <div className="relative">
            <label className="font-label-sm text-label-sm text-secondary block mb-1">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@agencysync.co"
              className="w-full bg-transparent border-0 border-b border-outline py-1.5 font-body-md text-body-md text-on-surface focus:ring-0 focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-md pt-sm border-t border-outline mt-2">
            <button
              type="button"
              onClick={onClose}
              className="font-body-md text-body-md text-secondary px-4 py-1.5 hover:bg-surface-variant rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="font-body-md text-body-md bg-primary text-on-primary px-5 py-1.5 rounded-full hover:bg-surface-tint disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Join Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
