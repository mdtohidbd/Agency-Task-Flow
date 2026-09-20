import React, { useRef } from 'react';
import { MonthlyFinanceReport } from '../../types';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MonthlyFinanceReport | null;
  isLoading: boolean;
  companyName: string;
}

function fmt(n: number) {
  return '৳' + n.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function monthLabel(month: string) {
  const [y, m] = month.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

// Simple SVG pie chart
function PieChart({ income, expenses }: { income: number; expenses: number }) {
  const total = income + expenses;
  if (total === 0) return <div className="w-36 h-36 rounded-full bg-surface-container flex items-center justify-center text-secondary font-label-sm text-label-sm">No data</div>;

  const incomeAngle = (income / total) * 360;
  const r = 64;
  const cx = 70;
  const cy = 70;

  function polarToCart(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const start = polarToCart(0);
  const end = polarToCart(incomeAngle);
  const largeArc = incomeAngle > 180 ? 1 : 0;

  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      {/* Expense slice (background) */}
      <circle cx={cx} cy={cy} r={r} fill="#ef4444" opacity={0.8} />
      {/* Income slice */}
      {incomeAngle > 0 && incomeAngle < 360 && (
        <path
          d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
          fill="#10b981"
          opacity={0.85}
        />
      )}
      {incomeAngle >= 360 && <circle cx={cx} cy={cy} r={r} fill="#10b981" opacity={0.85} />}
      {/* Inner circle for donut look */}
      <circle cx={cx} cy={cy} r={38} fill="var(--color-surface, #fff)" />
      <text x={cx} y={cy - 6} textAnchor="middle" className="font-label-sm" fontSize="10" fill="var(--color-on-surface, #000)">
        Net
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill={income - expenses >= 0 ? '#10b981' : '#ef4444'}>
        {income >= expenses ? '+' : '-'}{fmt(Math.abs(income - expenses)).slice(1)}
      </text>
    </svg>
  );
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  report,
  isLoading,
  companyName,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[95vh] bg-surface dark:bg-surface-dim rounded-3xl shadow-2xl overflow-y-auto print:shadow-none print:rounded-none print:max-h-none print:overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline print:hidden">
          <h2 className="font-headline-md text-headline-md text-on-surface">Monthly Report</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-ink-blue-container dark:bg-primary-container text-primary dark:text-on-primary-container font-body-md text-body-md rounded-xl hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print Report
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-secondary transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block px-6 pt-6 pb-4 border-b border-outline">
          <p className="text-xs text-gray-500">{companyName}</p>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Finance Report</h1>
          {report && <p className="text-gray-600 mt-1">{monthLabel(report.month)}</p>}
        </div>

        <div ref={printRef} className="p-6 flex flex-col gap-6">
          {isLoading && (
            <div className="flex items-center justify-center h-48">
              <span className="material-symbols-outlined text-[40px] text-secondary animate-spin">progress_activity</span>
            </div>
          )}

          {!isLoading && !report && (
            <p className="text-center text-secondary font-body-md text-body-md py-12">No data for this period.</p>
          )}

          {!isLoading && report && (
            <>
              {/* Period */}
              <div className="text-center">
                <p className="font-headline-sm text-headline-sm text-on-surface">{monthLabel(report.month)}</p>
                <p className="font-label-sm text-label-sm text-secondary mt-1">{report.entries.length} transaction{report.entries.length !== 1 ? 's' : ''}</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
                  <p className="font-label-sm text-label-sm text-emerald-600 dark:text-emerald-400 mb-1">Total Income</p>
                  <p className="font-headline-sm text-headline-sm font-bold text-emerald-700 dark:text-emerald-300">{fmt(report.totalIncomeBDT)}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
                  <p className="font-label-sm text-label-sm text-red-500 dark:text-red-400 mb-1">Total Expenses</p>
                  <p className="font-headline-sm text-headline-sm font-bold text-red-600 dark:text-red-400">{fmt(report.totalExpensesBDT)}</p>
                </div>
                <div className="bg-surface-container rounded-2xl p-4 border border-outline">
                  <p className="font-label-sm text-label-sm text-secondary mb-1">Company Expenses</p>
                  <p className="font-headline-sm text-headline-sm font-bold text-on-surface">{fmt(report.companyExpensesBDT)}</p>
                </div>
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-4 border border-violet-200 dark:border-violet-800">
                  <p className="font-label-sm text-label-sm text-violet-600 dark:text-violet-400 mb-1">Personal (Unreimbursed)</p>
                  <p className="font-headline-sm text-headline-sm font-bold text-violet-700 dark:text-violet-300">{fmt(report.unreimbursedPersonalBDT)}</p>
                </div>
              </div>

              {/* Net + Pie Chart */}
              <div className="flex items-center gap-6 bg-surface-container rounded-2xl p-5 border border-outline">
                <PieChart income={report.totalIncomeBDT} expenses={report.totalExpensesBDT} />
                <div className="flex-1">
                  <p className="font-label-sm text-label-sm text-secondary mb-2">Net Profit / Loss</p>
                  <p className={`font-display-sm text-display-sm font-bold ${
                    report.netProfitBDT >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                  }`}>
                    {report.netProfitBDT >= 0 ? '+' : ''}{fmt(report.netProfitBDT)}
                  </p>
                  <div className="mt-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-label-sm text-label-sm text-secondary">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                      Income: {fmt(report.totalIncomeBDT)}
                    </div>
                    <div className="flex items-center gap-2 font-label-sm text-label-sm text-secondary">
                      <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                      Expenses: {fmt(report.totalExpensesBDT)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Income by Project */}
              {report.incomeByProject.length > 0 && (
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface mb-3">Income by Project</h3>
                  <div className="flex flex-col gap-2">
                    {report.incomeByProject.map(p => (
                      <div key={p.projectName} className="flex items-center justify-between px-4 py-3 bg-surface-container rounded-xl border border-outline">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
                          <span className="font-body-md text-body-md text-on-surface">{p.projectName}</span>
                          <span className="font-label-sm text-label-sm text-secondary">×{p.count}</span>
                        </div>
                        <span className="font-body-md text-body-md font-semibold text-emerald-600 dark:text-emerald-400">{fmt(p.amountBDT)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses by Category */}
              {report.expensesByCategory.length > 0 && (
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface mb-3">Expenses by Category</h3>
                  <div className="flex flex-col gap-2">
                    {report.expensesByCategory.map(c => (
                      <div key={c.category} className="flex items-center justify-between px-4 py-3 bg-surface-container rounded-xl border border-outline">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                          <span className="font-body-md text-body-md text-on-surface">{c.category}</span>
                          <span className={`px-1.5 py-0.5 rounded font-label-sm text-label-sm ${
                            c.paidBy === 'personal'
                              ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                              : 'bg-surface-variant text-on-surface-variant'
                          }`}>
                            {c.paidBy}
                          </span>
                        </div>
                        <span className="font-body-md text-body-md font-semibold text-red-500 dark:text-red-400">{fmt(c.amountBDT)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Transaction Log */}
              <div>
                <h3 className="font-title-md text-title-md text-on-surface mb-3">All Transactions</h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline">
                      <th className="font-label-sm text-label-sm text-secondary pb-2 pr-3">Date</th>
                      <th className="font-label-sm text-label-sm text-secondary pb-2 pr-3">Description</th>
                      <th className="font-label-sm text-label-sm text-secondary pb-2 text-right">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.entries.map(e => (
                      <tr key={e.id} className="border-b border-outline/40">
                        <td className="font-label-sm text-label-sm text-secondary py-2 pr-3 whitespace-nowrap">
                          {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="font-body-sm text-body-sm text-on-surface py-2 pr-3">{e.description}</td>
                        <td className={`font-body-sm text-body-sm py-2 text-right font-semibold ${
                          e.entryType === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                        }`}>
                          {e.entryType === 'income' ? '+' : '-'}{fmt(e.amountBDT)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className="font-label-sm text-label-sm text-secondary pt-3 font-bold">Net Profit</td>
                      <td className={`font-label-sm text-label-sm pt-3 text-right font-bold ${
                        report.netProfitBDT >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {report.netProfitBDT >= 0 ? '+' : ''}{fmt(report.netProfitBDT)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Print footer */}
              <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-400 flex justify-between">
                <span>{companyName}</span>
                <span>Generated: {new Date().toLocaleDateString()}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
