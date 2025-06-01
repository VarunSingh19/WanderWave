
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Wallet,
    BanknoteIcon,
    SmartphoneIcon,
    CreditCardIcon,
    AlertCircle,
    ArrowRightIcon,
    CheckCircle2,
    ChevronLeft
} from 'lucide-react';

interface WithdrawDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    amount: string;
    setAmount: (amount: string) => void;
    balance: number;
    formatCurrency: (value: number) => string;
    withdrawMethod: 'bank' | 'upi' | 'card';
    setWithdrawMethod: (method: 'bank' | 'upi' | 'card') => void;
    withdrawAccountNumber: string;
    setWithdrawAccountNumber: (value: string) => void;
    withdrawAccountName: string;
    setWithdrawAccountName: (value: string) => void;
    withdrawAccountIFSC: string;
    setWithdrawAccountIFSC: (value: string) => void;
    withdrawUPI: string;
    setWithdrawUPI: (value: string) => void;
    withdrawCardNumber: string;
    setWithdrawCardNumber: (value: string) => void;
    onWithdrawMoney: () => void;
    withdrawLoading: boolean;
}

export const WithdrawDialog: React.FC<WithdrawDialogProps> = ({
    isOpen,
    onOpenChange,
    amount,
    setAmount,
    balance,
    formatCurrency,
    withdrawMethod,
    setWithdrawMethod,
    withdrawAccountNumber,
    setWithdrawAccountNumber,
    withdrawAccountName,
    setWithdrawAccountName,
    withdrawAccountIFSC,
    setWithdrawAccountIFSC,
    withdrawUPI,
    setWithdrawUPI,
    withdrawCardNumber,
    setWithdrawCardNumber,
    onWithdrawMoney,
    withdrawLoading
}) => {
    // Multi-step form
    const [step, setStep] = useState(1);
    const [quickAmounts] = useState([100, 500, 1000, 2000]);
    const [isFocused, setIsFocused] = useState(false);

    // Reset step when dialog opens/closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => setStep(1), 300); // Reset after close animation
        }
    }, [isOpen]);

    const isAmountExceedingBalance = amount && parseFloat(amount) > balance;
    const amountValue = parseFloat(amount) || 0;

    const isWithdrawButtonDisabled =
        withdrawLoading ||
        !amount ||
        amountValue <= 0 ||
        isAmountExceedingBalance ||
        (withdrawMethod === 'bank' && (!withdrawAccountName || !withdrawAccountNumber || !withdrawAccountIFSC)) ||
        (withdrawMethod === 'upi' && !withdrawUPI) ||
        (withdrawMethod === 'card' && !withdrawCardNumber);

    const getProcessingTime = () => {
        switch (withdrawMethod) {
            case 'bank': return '1-2 business days';
            case 'upi': return 'Within 24 hours';
            case 'card': return '3-5 business days';
            default: return '';
        }
    };

    const handleQuickAmountSelect = (quickAmount: number) => {
        if (quickAmount <= balance) {
            setAmount(quickAmount.toString());
        }
    };

    const goToNextStep = () => {
        if (step === 1 && amountValue > 0 && amountValue <= balance) {
            setStep(2);
        }
    };

    // Format card number with spaces
    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-md mx-auto p-0 rounded-xl bg-white overflow-hidden shadow-xl border-0">
                <DialogHeader className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                    {step === 2 && (
                        <button
                            onClick={() => setStep(1)}
                            className="absolute top-4 left-4 p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <DialogTitle className="text-xl sm:text-2xl font-semibold text-center">
                        {step === 1 ? 'Withdraw Funds' : 'Payment Details'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-600 mt-1 text-sm sm:text-base">
                        {step === 1
                            ? 'Transfer money from your wallet to your account'
                            : `Set up your ${withdrawMethod === 'bank' ? 'bank account' : withdrawMethod === 'upi' ? 'UPI' : 'card'} details`}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="px-4 sm:px-6 py-4 space-y-6">
                        {/* Balance */}
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white shadow-md">
                            <div>
                                <p className="text-blue-100 text-sm">Available balance</p>
                                <p className="text-white text-xl sm:text-2xl font-bold">{formatCurrency(balance)}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <label htmlFor="withdraw-amount" className="text-base font-medium block">
                                Amount to Withdraw
                            </label>
                            <div className={`relative transition-all duration-200 ${isFocused ? 'ring-2 ring-blue-300 rounded-md' : ''}`}>
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">₹</span>
                                <input
                                    id="withdraw-amount"
                                    type="number"
                                    min="1"
                                    max={balance.toString()}
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    placeholder="0.00"
                                    className="w-full pl-9 py-3 text-lg rounded-md border border-gray-300 focus:outline-none"
                                />
                            </div>

                            {/* Quick Amount Selection */}
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {quickAmounts.map(quickAmount => (
                                    <button
                                        key={quickAmount}
                                        type="button"
                                        onClick={() => handleQuickAmountSelect(quickAmount)}
                                        disabled={quickAmount > balance}
                                        className={`py-2 px-1 rounded text-sm font-medium transition-colors ${parseFloat(amount) === quickAmount
                                            ? 'bg-blue-100 text-blue-700 border-blue-300 border'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                                            } ${quickAmount > balance ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        ₹{quickAmount}
                                    </button>
                                ))}
                            </div>

                            {isAmountExceedingBalance && (
                                <p className="text-red-600 text-sm flex items-center mt-1">
                                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                                    Amount exceeds available balance
                                </p>
                            )}
                        </div>

                        {/* Large Withdrawal Warning */}
                        {amount && parseFloat(amount) > 1000 && (
                            <div className="flex p-3 text-sm rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                <p>
                                    <strong>Note:</strong> Larger withdrawals may take 1-3 business days to process due to security verification.
                                </p>
                            </div>
                        )}

                        {/* Method */}
                        <div className="space-y-3">
                            <label className="text-base font-medium block">Withdrawal Method</label>
                            <RadioGroup
                                value={withdrawMethod}
                                onValueChange={(value) => setWithdrawMethod(value as 'bank' | 'upi' | 'card')}
                                className="space-y-3"
                            >
                                {/* Bank */}
                                <div
                                    className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${withdrawMethod === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                        }`}>
                                    <RadioGroupItem value="bank" id="bank-withdraw" className="mr-3" />
                                    <div className="flex-1">
                                        <label htmlFor="bank-withdraw" className="flex items-center text-base font-medium cursor-pointer">
                                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                                                <BanknoteIcon className="w-5 h-5 text-blue-600" />
                                            </div>
                                            Bank Transfer
                                        </label>
                                        <p className="text-gray-600 text-xs mt-1">1-2 business days</p>
                                    </div>
                                    <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                                </div>

                                {/* UPI */}
                                <div
                                    className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${withdrawMethod === 'upi' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                        }`}>
                                    <RadioGroupItem value="upi" id="upi-withdraw" className="mr-3" />
                                    <div className="flex-1">
                                        <label htmlFor="upi-withdraw" className="flex items-center text-base font-medium cursor-pointer">
                                            <div className="bg-green-100 p-2 rounded-full mr-3">
                                                <SmartphoneIcon className="w-5 h-5 text-green-600" />
                                            </div>
                                            UPI Transfer
                                        </label>
                                        <p className="text-gray-600 text-xs mt-1">Within 24 hours</p>
                                    </div>
                                    <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                                </div>

                                {/* Card */}
                                <div
                                    className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${withdrawMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                        }`}>
                                    <RadioGroupItem value="card" id="card-withdraw" className="mr-3" />
                                    <div className="flex-1">
                                        <label htmlFor="card-withdraw" className="flex items-center text-base font-medium cursor-pointer">
                                            <div className="bg-purple-100 p-2 rounded-full mr-3">
                                                <CreditCardIcon className="w-5 h-5 text-purple-600" />
                                            </div>
                                            Card Refund
                                        </label>
                                        <p className="text-gray-600 text-xs mt-1">3-5 business days</p>
                                    </div>
                                    <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="px-4 sm:px-6 py-4 space-y-6">
                        {/* Summary */}
                        <div className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-gray-600 text-sm">Amount</span>
                                <span className="font-semibold">{formatCurrency(parseFloat(amount))}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">Withdrawal via</span>
                                <span className="font-medium flex items-center">
                                    {withdrawMethod === 'bank' && <BanknoteIcon className="w-4 h-4 text-blue-600 mr-1" />}
                                    {withdrawMethod === 'upi' && <SmartphoneIcon className="w-4 h-4 text-green-600 mr-1" />}
                                    {withdrawMethod === 'card' && <CreditCardIcon className="w-4 h-4 text-purple-600 mr-1" />}
                                    {withdrawMethod === 'bank' ? 'Bank Transfer' : withdrawMethod === 'upi' ? 'UPI' : 'Card Refund'}
                                </span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Processing time</span>
                                <span className="text-sm font-medium">{getProcessingTime()}</span>
                            </div>
                        </div>

                        {/* Bank Details Form */}
                        {withdrawMethod === 'bank' && (
                            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                                <h4 className="font-medium flex items-center">
                                    <BanknoteIcon className="w-4 h-4 mr-2 text-blue-600" />
                                    Bank Account Details
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="account-name" className="text-sm font-medium block mb-1">Account Holder Name</label>
                                        <input
                                            id="account-name"
                                            type="text"
                                            value={withdrawAccountName}
                                            onChange={(e) => setWithdrawAccountName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="account-number" className="text-sm font-medium block mb-1">Account Number</label>
                                        <input
                                            id="account-number"
                                            type="text"
                                            value={withdrawAccountNumber}
                                            onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                                            placeholder="1234567890"
                                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="account-ifsc" className="text-sm font-medium block mb-1">IFSC Code</label>
                                        <input
                                            id="account-ifsc"
                                            type="text"
                                            value={withdrawAccountIFSC}
                                            onChange={(e) => setWithdrawAccountIFSC(e.target.value.toUpperCase())}
                                            placeholder="ABCD0123456"
                                            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* UPI Details Form */}
                        {withdrawMethod === 'upi' && (
                            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                                <h4 className="font-medium flex items-center">
                                    <SmartphoneIcon className="w-4 h-4 mr-2 text-green-600" />
                                    UPI Details
                                </h4>
                                <div>
                                    <label htmlFor="upi-id" className="text-sm font-medium block mb-1">UPI ID</label>
                                    <input
                                        id="upi-id"
                                        type="text"
                                        value={withdrawUPI}
                                        onChange={(e) => setWithdrawUPI(e.target.value.toLowerCase())}
                                        placeholder="name@bank"
                                        className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                    />
                                    <p className="text-xs text-gray-600 mt-2 flex items-start">
                                        <span className="text-blue-500 mr-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /></span>
                                        Enter your UPI ID in format username@bank
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Card Details Form */}
                        {withdrawMethod === 'card' && (
                            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                                <h4 className="font-medium flex items-center">
                                    <CreditCardIcon className="w-4 h-4 mr-2 text-purple-600" />
                                    Card Details
                                </h4>
                                <div>
                                    <label htmlFor="card-number" className="text-sm font-medium block mb-1">Card Number</label>
                                    <input
                                        id="card-number"
                                        type="text"
                                        value={withdrawCardNumber}
                                        onChange={(e) => setWithdrawCardNumber(formatCardNumber(e.target.value))}
                                        placeholder="XXXX XXXX XXXX XXXX"
                                        maxLength={19} // 16 digits + 3 spaces
                                        className="w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                    />
                                    <p className="text-xs text-gray-600 mt-2 flex items-start">
                                        <span className="text-blue-500 mr-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /></span>
                                        Enter the card number to receive funds
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="px-4 sm:px-6 py-4 border-t border-gray-100">
                    {step === 1 ? (
                        <button
                            onClick={goToNextStep}
                            disabled={!amount || amountValue <= 0 || isAmountExceedingBalance}
                            className="w-full py-3 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    ) : (
                        <div className="w-full">
                            <div className="text-xs text-gray-500 mb-3 text-center">
                                By proceeding, you agree to our withdrawal terms and conditions.
                            </div>
                            <button
                                onClick={onWithdrawMoney}
                                disabled={isWithdrawButtonDisabled}
                                className="w-full py-3 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {withdrawLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Processing...
                                    </div>
                                ) : (
                                    `Withdraw ${formatCurrency(parseFloat(amount))}`
                                )}
                            </button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WithdrawDialog;