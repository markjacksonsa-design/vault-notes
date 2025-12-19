'use client';

// Bank Details Card Component

interface BankDetailsCardProps {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export default function BankDetailsCard({
  bankName,
  accountNumber,
  accountHolder,
}: BankDetailsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Bank Details
        </h2>
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        {bankName && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Bank Name
            </label>
            <p className="text-lg text-gray-900 dark:text-white font-medium">
              {bankName}
            </p>
          </div>
        )}

        {accountNumber && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Account Number
            </label>
            <p className="text-lg text-gray-900 dark:text-white font-medium font-mono">
              {accountNumber.replace(/\d(?=\d{4})/g, '*')}
            </p>
          </div>
        )}

        {accountHolder && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Account Holder
            </label>
            <p className="text-lg text-gray-900 dark:text-white font-medium">
              {accountHolder}
            </p>
          </div>
        )}

        {!bankName && !accountNumber && (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
            No bank details provided
          </p>
        )}
      </div>
    </div>
  );
}

