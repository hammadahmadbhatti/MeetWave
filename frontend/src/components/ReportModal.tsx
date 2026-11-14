'use client';
import { useState } from 'react';

const reasons = [
  { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'UNDERAGE', label: 'Underage User' },
  { value: 'OTHER', label: 'Other' },
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description?: string) => void;
}

export default function ReportModal({ isOpen, onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit(reason, description || undefined);
    setReason('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass w-full max-w-md mx-4 rounded-2xl p-6 animate-slide-up">
        <h3 className="text-lg font-semibold text-white mb-4">Report User</h3>

        <div className="space-y-2 mb-4">
          {reasons.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                reason === r.value ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={(e) => setReason(e.target.value)}
                className="text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-surface-200">{r.label}</span>
            </label>
          ))}
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details (optional)..."
          className="w-full px-4 py-3 bg-white/5 rounded-xl text-sm text-white placeholder-surface-500 border border-white/10 focus:border-red-500/50 outline-none resize-none"
          rows={3}
          maxLength={500}
        />

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 text-surface-400 hover:text-white border border-white/10 rounded-xl transition-all text-sm">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all text-sm font-medium"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
