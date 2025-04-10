import React from 'react';
import { WalletIcon, PlusCircle, ArrowDownIcon } from 'lucide-react';

interface BalanceCardProps {
    balance: number;
    formatCurrency: (value: number) => string;
    onAddMoney: () => void;
    onWithdraw: () => void;
    disableWithdraw: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
    balance,
    formatCurrency,
    onAddMoney,
    onWithdraw,
    disableWithdraw
}) => {
    return (
        <div className="apple-balance-card overflow-hidden h-full">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-white/90">Wallet Balance</h3>
                    <WalletIcon className="w-6 h-6 text-white/80" />
                </div>
                <div className="mb-4">
                    <div className="text-4xl font-bold text-white">{formatCurrency(balance)}</div>
                    <p className="text-white/70 text-sm mt-1">Available balance</p>
                </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10">
                <button
                    onClick={onAddMoney}
                    className="bg-transparent hover:bg-white/10 transition-colors py-4 text-white/90 hover:text-white flex items-center justify-center gap-2"
                >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add</span>
                </button>
                <button
                    onClick={onWithdraw}
                    disabled={disableWithdraw}
                    className={`bg-transparent hover:bg-white/10 transition-colors py-4 text-white/90 hover:text-white flex items-center justify-center gap-2 ${disableWithdraw ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    <ArrowDownIcon className="w-4 h-4" />
                    <span>Withdraw</span>
                </button>
            </div>
        </div>
    );
};

export default BalanceCard;
