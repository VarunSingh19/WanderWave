import React from 'react';
import { WalletIcon, PlusCircle, ArrowDownIcon, Loader2 } from 'lucide-react';

interface BalanceCardProps {
    balance: number | null;
    formatCurrency: (value: number) => string;
    onAddMoney: () => void;
    onWithdraw: () => void;
    disableWithdraw: boolean;
    isLoading?: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
    balance,
    formatCurrency,
    onAddMoney,
    onWithdraw,
    disableWithdraw,
    isLoading = false
}) => {
    return (
        <div className="apple-balance-card overflow-hidden h-full rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg border border-white/5">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-white/90">Wallet Balance</h3>
                    <WalletIcon className="w-6 h-6 text-white/80" />
                </div>
                <div className="mb-4">
                    {isLoading || balance === null ? (
                        <div className="flex flex-col items-start">
                            <div className="flex items-center gap-3 mb-2">
                                <Loader2 className="w-5 h-5 text-white/70 animate-spin" />
                                <div className="h-10 bg-white/10 animate-pulse rounded-md w-36"></div>
                            </div>
                            <div className="h-4 bg-white/10 animate-pulse rounded-md w-24 mt-1"></div>
                        </div>
                    ) : (
                        <>
                            <div className="text-4xl font-bold text-white transition-all duration-300">
                                {formatCurrency(balance)}
                            </div>
                            <p className="text-white/70 text-sm mt-1">Available balance</p>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10">
                <button
                    onClick={onAddMoney}
                    disabled={isLoading}
                    className={`bg-transparent hover:bg-white/10 transition-colors py-4 text-white/90 hover:text-white flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <PlusCircle className="w-4 h-4" />
                    )}
                    <span>Add</span>
                </button>
                <button
                    onClick={onWithdraw}
                    disabled={disableWithdraw || isLoading}
                    className={`bg-transparent hover:bg-white/10 transition-colors py-4 text-white/90 hover:text-white flex items-center justify-center gap-2 ${disableWithdraw || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <ArrowDownIcon className="w-4 h-4" />
                    )}
                    <span>Withdraw</span>
                </button>
            </div>
        </div>
    );
};

export default BalanceCard;

// Example usage:
// <BalanceCard
//   balance={balance}
//   formatCurrency={(value) => `$${value.toFixed(2)}`}
//   onAddMoney={() => console.log('Add money')}
//   onWithdraw={() => console.log('Withdraw')}
//   disableWithdraw={balance <= 0}
//   isLoading={isLoading}
// />