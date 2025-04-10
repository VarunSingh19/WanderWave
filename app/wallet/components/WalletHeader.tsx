import React from 'react';
import { PlusCircle, ArrowDownIcon } from 'lucide-react';

interface WalletHeaderProps {
    balance: number;
    isAddMoneyDialogOpen: boolean;
    setIsAddMoneyDialogOpen: (isOpen: boolean) => void;
    isWithdrawDialogOpen: boolean;
    setIsWithdrawDialogOpen: (isOpen: boolean) => void;
    onAddMoney: () => void;
    onWithdrawMoney: () => void;
    disableWithdraw: boolean;
}

const WalletHeader: React.FC<WalletHeaderProps> = ({
    balance,
    isAddMoneyDialogOpen,
    setIsAddMoneyDialogOpen,
    isWithdrawDialogOpen,
    setIsWithdrawDialogOpen,
    onAddMoney,
    onWithdrawMoney,
    disableWithdraw
}) => {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-semibold text-[var(--apple-black)]">My Wallet</h1>
                <p className="text-[var(--apple-dark-gray)] mt-1">Manage your funds and track transactions</p>
            </div>

            <div className="flex gap-3 mt-4 sm:mt-0">
                <button
                    onClick={() => setIsAddMoneyDialogOpen(true)}
                    className="apple-button flex items-center gap-2"
                >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Money</span>
                </button>

                <button
                    onClick={() => setIsWithdrawDialogOpen(true)}
                    disabled={disableWithdraw}
                    className={`apple-button-secondary apple-button flex items-center gap-2 ${disableWithdraw ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    <ArrowDownIcon className="w-4 h-4" />
                    <span>Withdraw</span>
                </button>
            </div>
        </div>
    );
};

export default WalletHeader;
