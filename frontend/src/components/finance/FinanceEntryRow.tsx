import React from 'react';
import { FinanceEntry } from '../../types';

interface FinanceEntryRowProps {
  entry: FinanceEntry;
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
  onToggleReimbursed?: (entry: FinanceEntry) => void;
}

function formatBDT(amount: number): string {
  return '৳' + amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatOriginal(entry: FinanceEntry): string {
  if (entry.currency === 'USD') {
    return `$${entry.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return '';
}

export const FinanceEntryRow: React.FC<FinanceEntryRowProps> = ({ entry, onEdit, onDelete, onToggleReimbursed }) => {
  const isIncome = entry.entryType === 'income';

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors group">
      {/* Type Icon */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
        isIncome
          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
          : 'bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400'
      }`}>
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {isIncome ? 'arrow_upward' : 'arrow_downward'}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-body-md text-body-md text-on-surface truncate">{entry.description}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {/* Date */}
              <span className="font-label-sm text-label-sm text-secondary">
                {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>

              {/* Project name for income */}
              {isIncome && entry.projectName && (
                <span className="px-2 py-0.5 bg-ink-blue-container dark:bg-primary-container text-primary dark:text-on-primary-container font-label-sm text-label-sm rounded-full">
                  {entry.projectName}
                </span>
              )}

              {/* Installment note */}
              {entry.installmentNote && (
                <span className="px-2 py-0.5 bg-surface-variant text-on-surface-variant font-label-sm text-label-sm rounded-full">
                  {entry.installmentNote}
                </span>
              )}

              {/* Invoice ref */}
              {entry.invoiceRef && (
                <span className="font-label-sm text-label-sm text-secondary">#{entry.invoiceRef}</span>
              )}

              {/* Category for expenses */}
              {!isIncome && entry.category && (
                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-label-sm text-label-sm rounded-full">
                  {entry.category}
                </span>
              )}

              {/* PaidBy badge */}
              {!isIncome && (
                <span className={`px-2 py-0.5 font-label-sm text-label-sm rounded-full ${
                  entry.paidBy === 'personal'
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    : 'bg-surface-variant text-on-surface-variant'
                }`}>
                  {entry.paidBy === 'personal' ? 'Personal' : 'Company'}
                </span>
              )}

              {/* Reimbursement status */}
              {entry.paidBy === 'personal' && (
                <button
                  onClick={() => onToggleReimbursed?.(entry)}
                  className={`flex items-center gap-1 px-2 py-0.5 font-label-sm text-label-sm rounded-full border transition-colors ${
                    entry.reimbursed
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {entry.reimbursed ? 'check_circle' : 'pending'}
                  </span>
                  {entry.reimbursed ? 'Reimbursed' : 'Pending'}
                </button>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="flex flex-col items-end flex-shrink-0">
            <span className={`font-headline-sm text-headline-sm font-bold ${
              isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
            }`}>
              {isIncome ? '+' : '-'}{formatBDT(entry.amountBDT)}
            </span>
            {entry.currency === 'USD' && (
              <span className="font-label-sm text-label-sm text-secondary">{formatOriginal(entry)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons — show on hover */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(entry)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-variant text-secondary transition-colors"
          title="Edit"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
        <button
          onClick={() => onDelete(entry)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-error-container text-error transition-colors"
          title="Delete"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    </div>
  );
};
