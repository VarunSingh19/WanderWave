import React from 'react';
import { PlusCircle, ArrowDownIcon, BanknoteIcon, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickActionsCardProps {
    onAddMoney: () => void;
    onWithdraw: () => void;
    disableWithdraw: boolean;
}

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
    onAddMoney,
    onWithdraw,
    disableWithdraw
}) => {
    const router = useRouter();

    return (
        <div className="apple-card p-6 h-full">
            <h3 className="text-lg font-medium text-[var(--apple-black)] mb-6">Quick Actions</h3>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onAddMoney}
                    className="apple-transaction-item flex flex-col items-center justify-center py-4 h-auto border border-[var(--apple-light-gray)] rounded-xl"
                >
                    <div className="w-10 h-10 rounded-full bg-[var(--apple-blue)]/10 flex items-center justify-center mb-2">
                        <PlusCircle className="w-5 h-5 text-[var(--apple-blue)]" />
                    </div>
                    <span className="text-sm font-medium">Add Money</span>
                </button>

                <button
                    onClick={onWithdraw}
                    disabled={disableWithdraw}
                    className={`apple-transaction-item flex flex-col items-center justify-center py-4 h-auto border border-[var(--apple-light-gray)] rounded-xl ${disableWithdraw ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    <div className="w-10 h-10 rounded-full bg-[var(--apple-blue)]/10 flex items-center justify-center mb-2">
                        <ArrowDownIcon className="w-5 h-5 text-[var(--apple-blue)]" />
                    </div>
                    <span className="text-sm font-medium">Withdraw</span>
                </button>

                <button
                    onClick={() => router.push('/trips')}
                    className="apple-transaction-item flex flex-col items-center justify-center py-4 h-auto border border-[var(--apple-light-gray)] rounded-xl"
                >
                    <div className="w-10 h-10 rounded-full bg-[var(--apple-blue)]/10 flex items-center justify-center mb-2">
                        <BanknoteIcon className="w-5 h-5 text-[var(--apple-blue)]" />
                    </div>
                    <span className="text-sm font-medium">Pay Trip</span>
                </button>

                <button
                    onClick={() => router.push('/profile')}
                    className="apple-transaction-item flex flex-col items-center justify-center py-4 h-auto border border-[var(--apple-light-gray)] rounded-xl"
                >
                    <div className="w-10 h-10 rounded-full bg-[var(--apple-blue)]/10 flex items-center justify-center mb-2">
                        <Settings className="w-5 h-5 text-[var(--apple-blue)]" />
                    </div>
                    <span className="text-sm font-medium">Settings</span>
                </button>
            </div>
        </div>
    );
};

export default QuickActionsCard;
