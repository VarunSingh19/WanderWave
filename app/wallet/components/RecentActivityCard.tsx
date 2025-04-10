import React from 'react';
import { ChevronRight, ReceiptIcon, ArrowDownLeft, ArrowUpRight, CreditCard } from 'lucide-react';
import { Transaction } from '../types';

interface RecentActivityCardProps {
    transactions: Transaction[];
    formatCurrency: (value: number) => string;
    formatDate: (date: string) => string;
    onViewAllTransactions: () => void;
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
    transactions,
    formatCurrency,
    formatDate,
    onViewAllTransactions
}) => {
    return (
        <div className="apple-card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-[var(--apple-black)]">Recent Activity</h3>
                <ReceiptIcon className="w-5 h-5 text-[var(--apple-dark-gray)]" />
            </div>

            {transactions && transactions.length > 0 ? (
                <div className="space-y-4">
                    {transactions.slice(0, 2).map((transaction) => (
                        <div key={transaction._id} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === "deposit"
                                        ? "bg-[var(--apple-green)]/10 text-[var(--apple-green)]"
                                        : transaction.type === "withdrawal"
                                            ? "bg-[var(--apple-red)]/10 text-[var(--apple-red)]"
                                            : "bg-[var(--apple-blue)]/10 text-[var(--apple-blue)]"
                                    }`}>
                                    {transaction.type === "deposit"
                                        ? <ArrowDownLeft className="w-5 h-5" />
                                        : transaction.type === "withdrawal"
                                            ? <ArrowUpRight className="w-5 h-5" />
                                            : <CreditCard className="w-5 h-5" />
                                    }
                                </div>
                                <div className="ml-3">
                                    <p className="font-medium text-[var(--apple-black)] text-sm">{transaction.description}</p>
                                    <p className="text-xs text-[var(--apple-dark-gray)]">{formatDate(transaction.createdAt)}</p>
                                </div>
                            </div>
                            <div className={`font-semibold ${transaction.type === "deposit"
                                    ? "text-[var(--apple-green)]"
                                    : "text-[var(--apple-red)]"
                                }`}>
                                {transaction.type === "deposit" ? "+" : "-"}
                                {formatCurrency(transaction.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-[var(--apple-dark-gray)]">No recent transactions</p>
                </div>
            )}

            <button
                onClick={onViewAllTransactions}
                className="w-full mt-4 text-[var(--apple-blue)] hover:text-[var(--apple-blue-dark)] justify-between flex items-center px-0 py-2 bg-transparent border-0"
            >
                <span>View all transactions</span>
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
};

export default RecentActivityCard;
