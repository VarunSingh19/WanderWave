import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReceiptIcon, ArrowDownLeft, ArrowUpRight, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionHistoryProps {
    transactions: Transaction[];
    formatCurrency: (value: number) => string;
    formatDate: (date: string) => string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
    transactions,
    formatCurrency,
    formatDate
}) => {
    const renderTransactions = (filteredTransactions: Transaction[]) => {
        if (filteredTransactions.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="w-16 h-16 bg-[var(--apple-light-gray)] rounded-full flex items-center justify-center mb-4">
                        <ReceiptIcon className="w-8 h-8 text-[var(--apple-medium-gray)]" />
                    </div>
                    <h3 className="text-xl font-medium text-[var(--apple-black)] mb-2">No transactions found</h3>
                    <p className="text-[var(--apple-dark-gray)] max-w-md">
                        There are no transactions in this category. Transactions will appear here once you add money or make payments.
                    </p>
                </div>
            );
        }

        return (
            <div className="divide-y divide-[var(--apple-light-gray)]">
                {filteredTransactions.map((transaction) => (
                    <div
                        key={transaction._id}
                        className="apple-transaction-item p-4 sm:p-6 hover:bg-[var(--apple-light-gray)]/50 transition-colors duration-150"
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="flex items-start sm:items-center">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center ${transaction.type === "deposit"
                                            ? "bg-[var(--apple-green)]/10 text-[var(--apple-green)]"
                                            : transaction.type === "withdrawal"
                                                ? "bg-[var(--apple-red)]/10 text-[var(--apple-red)]"
                                                : "bg-[var(--apple-blue)]/10 text-[var(--apple-blue)]"
                                        }`}
                                >
                                    {transaction.type === "deposit" ? (
                                        <ArrowDownLeft className="w-6 h-6" />
                                    ) : transaction.type === "withdrawal" ? (
                                        <ArrowUpRight className="w-6 h-6" />
                                    ) : (
                                        <CreditCard className="w-6 h-6" />
                                    )}
                                </div>

                                <div className="ml-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center">
                                        <h3 className="font-medium text-[var(--apple-black)]">{transaction.description}</h3>
                                        <div
                                            className={`mt-1 sm:mt-0 sm:ml-3 text-xs px-2 py-1 rounded-full flex items-center ${transaction.status === "completed"
                                                    ? "apple-badge-completed"
                                                    : transaction.status === "pending"
                                                        ? "apple-badge-pending"
                                                        : "apple-badge-failed"
                                                }`}
                                        >
                                            {transaction.status === "completed" ? (
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                            ) : transaction.status === "pending" ? (
                                                <Clock className="w-3 h-3 mr-1" />
                                            ) : (
                                                <XCircle className="w-3 h-3 mr-1" />
                                            )}
                                            <span className="capitalize">{transaction.status}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center mt-1 text-sm text-[var(--apple-dark-gray)]">
                                        <div className="flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            <span>{formatDate(transaction.createdAt)}</span>
                                        </div>

                                        {transaction.trip && (
                                            <div className="flex items-center mt-1 sm:mt-0 sm:ml-4">
                                                <span>•</span>
                                                <span className="ml-1">Trip: {transaction.trip.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 sm:mt-0 text-right">
                                <div
                                    className={`text-xl font-semibold ${transaction.type === "deposit" ? "text-[var(--apple-green)]" : "text-[var(--apple-red)]"
                                        }`}
                                >
                                    {transaction.type === "deposit" ? "+" : "-"}
                                    {formatCurrency(transaction.amount)}
                                </div>
                                <div className="text-xs text-[var(--apple-dark-gray)] mt-1 capitalize">
                                    {transaction.type}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div id="transaction-history" className="pt-6 container mx-auto px-4">
            <div className="apple-card mb-10">
                <div className="p-4 sm:p-6 border-b border-[var(--apple-light-gray)]">
                    <h2 className="text-2xl font-semibold">Transaction History</h2>
                    <p className="text-[var(--apple-dark-gray)] mt-1">View your past transactions</p>
                </div>

                <Tabs defaultValue="all" className="w-full">
                    <div className="border-b border-[var(--apple-light-gray)]">
                        <div className="px-4 sm:px-6">
                            {/* Scrollable wrapper for tabs */}
                            <div className="overflow-x-auto">
                                <TabsList className="apple-tabs flex min-w-max h-12 sm:h-14 bg-transparent space-x-4 sm:space-x-8">
                                    <TabsTrigger
                                        value="all"
                                        className="apple-tab data-[state=active]:text-[var(--apple-blue)] data-[state=active]:border-[var(--apple-blue)] min-w-fit"
                                    >
                                        All Transactions
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="deposits"
                                        className="apple-tab data-[state=active]:text-[var(--apple-blue)] data-[state=active]:border-[var(--apple-blue)] min-w-fit"
                                    >
                                        Deposits
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="withdrawals"
                                        className="apple-tab data-[state=active]:text-[var(--apple-blue)] data-[state=active]:border-[var(--apple-blue)] min-w-fit"
                                    >
                                        Withdrawals
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="payments"
                                        className="apple-tab data-[state=active]:text-[var(--apple-blue)] data-[state=active]:border-[var(--apple-blue)] min-w-fit"
                                    >
                                        Payments
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </div>
                    </div>

                    <TabsContent value="all" className="p-0">
                        {renderTransactions(transactions || [])}
                    </TabsContent>

                    <TabsContent value="deposits" className="p-0">
                        {renderTransactions((transactions || []).filter(t => t.type === "deposit"))}
                    </TabsContent>

                    <TabsContent value="withdrawals" className="p-0">
                        {renderTransactions((transactions || []).filter(t => t.type === "withdrawal"))}
                    </TabsContent>

                    <TabsContent value="payments" className="p-0">
                        {renderTransactions((transactions || []).filter(t => t.type === "payment"))}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default TransactionHistory;
