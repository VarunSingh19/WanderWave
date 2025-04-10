import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wallet, BanknoteIcon, SmartphoneIcon, CreditCardIcon, AlertCircle } from 'lucide-react';

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
    const isAmountExceedingBalance = amount && parseFloat(amount) > balance;

    const isWithdrawButtonDisabled =
        withdrawLoading ||
        !amount ||
        parseFloat(amount) <= 0 ||
        isAmountExceedingBalance ||
        (withdrawMethod === 'bank' && (!withdrawAccountName || !withdrawAccountNumber || !withdrawAccountIFSC)) ||
        (withdrawMethod === 'upi' && !withdrawUPI) ||
        (withdrawMethod === 'card' && !withdrawCardNumber);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="apple-dialog max-w-md md:max-w-lg p-0">
                <DialogHeader className="apple-dialog-header">
                    <DialogTitle className="text-2xl font-semibold">Withdraw Funds</DialogTitle>
                    <DialogDescription className="text-[var(--apple-dark-gray)] mt-1">
                        Transfer money from your wallet to your bank account
                    </DialogDescription>
                </DialogHeader>

                <div className="apple-dialog-content">
                    {/* Balance indicator */}
                    <div className="flex justify-between items-center p-4 bg-[var(--apple-blue)]/5 rounded-xl mb-6">
                        <div>
                            <p className="text-[var(--apple-dark-gray)] text-sm">Available balance</p>
                            <p className="text-[var(--apple-blue)] text-xl font-bold">{formatCurrency(balance)}</p>
                        </div>
                        <Wallet className="w-10 h-10 text-[var(--apple-blue)]" />
                    </div>

                    {/* Withdrawal amount */}
                    <div className="mb-6">
                        <label htmlFor="withdraw-amount" className="text-base font-medium block mb-2">Amount to Withdraw</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--apple-dark-gray)]">$</span>
                            <input
                                id="withdraw-amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="apple-input pl-8 h-12 text-lg w-full"
                                placeholder="Enter amount"
                                type="number"
                                min="1"
                                max={balance.toString()}
                                step="0.01"
                            />
                        </div>

                        {isAmountExceedingBalance && (
                            <p className="text-[var(--apple-red)] text-sm flex items-center mt-2">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Amount exceeds available balance
                            </p>
                        )}
                    </div>

                    {/* Warning for big withdrawal */}
                    {amount && parseFloat(amount) > 1000 && (
                        <div className="flex p-4 text-sm rounded-xl bg-amber-50 border border-amber-200 text-amber-800 mb-6">
                            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                            <p>
                                <strong>Note:</strong> Larger withdrawals may take 1-3 business days to process due to security verification.
                            </p>
                        </div>
                    )}

                    {/* Withdrawal Method */}
                    <div className="mb-6">
                        <label className="text-base font-medium block mb-3">Withdrawal Method</label>
                        <RadioGroup
                            value={withdrawMethod}
                            onValueChange={(value) => setWithdrawMethod(value as 'bank' | 'upi' | 'card')}
                            className="space-y-3"
                        >
                            <div className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all hover:border-[var(--apple-blue)/30] hover:bg-[var(--apple-blue)/5] ${withdrawMethod === 'bank' ? 'border-[var(--apple-blue)] bg-[var(--apple-blue)/5]' : 'border-[var(--apple-light-gray)]'
                                }`}>
                                <RadioGroupItem value="bank" id="bank-withdraw" className="mr-4" />
                                <div className="flex-1">
                                    <label htmlFor="bank-withdraw" className="flex items-center text-base font-medium cursor-pointer">
                                        <BanknoteIcon className="w-5 h-5 mr-2 text-[var(--apple-blue)]" />
                                        Bank Transfer
                                    </label>
                                    <p className="text-[var(--apple-dark-gray)] text-sm mt-1">Transfer to your bank account (1-2 business days)</p>
                                </div>
                            </div>

                            <div className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all hover:border-[var(--apple-blue)/30] hover:bg-[var(--apple-blue)/5] ${withdrawMethod === 'upi' ? 'border-[var(--apple-blue)] bg-[var(--apple-blue)/5]' : 'border-[var(--apple-light-gray)]'
                                }`}>
                                <RadioGroupItem value="upi" id="upi-withdraw" className="mr-4" />
                                <div className="flex-1">
                                    <label htmlFor="upi-withdraw" className="flex items-center text-base font-medium cursor-pointer">
                                        <SmartphoneIcon className="w-5 h-5 mr-2 text-[var(--apple-green)]" />
                                        UPI Transfer
                                    </label>
                                    <p className="text-[var(--apple-dark-gray)] text-sm mt-1">Instant transfer to UPI ID (within 24 hours)</p>
                                </div>
                            </div>

                            <div className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all hover:border-[var(--apple-blue)/30] hover:bg-[var(--apple-blue)/5] ${withdrawMethod === 'card' ? 'border-[var(--apple-blue)] bg-[var(--apple-blue)/5]' : 'border-[var(--apple-light-gray)]'
                                }`}>
                                <RadioGroupItem value="card" id="card-withdraw" className="mr-4" />
                                <div className="flex-1">
                                    <label htmlFor="card-withdraw" className="flex items-center text-base font-medium cursor-pointer">
                                        <CreditCardIcon className="w-5 h-5 mr-2 text-[var(--apple-purple)]" />
                                        Card Refund
                                    </label>
                                    <p className="text-[var(--apple-dark-gray)] text-sm mt-1">Refund to your card (3-5 business days)</p>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Account details based on method */}
                    {withdrawMethod === 'bank' && (
                        <div className="space-y-4 p-5 border border-[var(--apple-light-gray)] rounded-xl mb-6">
                            <h4 className="font-medium">Bank Account Details</h4>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="account-name" className="text-sm font-medium block mb-1">Account Holder Name</label>
                                    <input
                                        id="account-name"
                                        value={withdrawAccountName}
                                        onChange={(e) => setWithdrawAccountName(e.target.value)}
                                        placeholder="Enter account holder name"
                                        className="apple-input"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="account-number" className="text-sm font-medium block mb-1">Account Number</label>
                                    <input
                                        id="account-number"
                                        value={withdrawAccountNumber}
                                        onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                                        placeholder="Enter account number"
                                        className="apple-input"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="account-ifsc" className="text-sm font-medium block mb-1">IFSC Code</label>
                                    <input
                                        id="account-ifsc"
                                        value={withdrawAccountIFSC}
                                        onChange={(e) => setWithdrawAccountIFSC(e.target.value)}
                                        placeholder="Enter IFSC code"
                                        className="apple-input"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {withdrawMethod === 'upi' && (
                        <div className="space-y-4 p-5 border border-[var(--apple-light-gray)] rounded-xl mb-6">
                            <h4 className="font-medium">UPI Details</h4>
                            <div>
                                <label htmlFor="upi-id" className="text-sm font-medium block mb-1">UPI ID</label>
                                <input
                                    id="upi-id"
                                    value={withdrawUPI}
                                    onChange={(e) => setWithdrawUPI(e.target.value)}
                                    placeholder="name@ybl or name@upi"
                                    className="apple-input"
                                />
                                <p className="text-xs text-[var(--apple-dark-gray)] mt-1">Enter your UPI ID in the format username@bank</p>
                            </div>
                        </div>
                    )}

                    {withdrawMethod === 'card' && (
                        <div className="space-y-4 p-5 border border-[var(--apple-light-gray)] rounded-xl mb-6">
                            <h4 className="font-medium">Card Details</h4>
                            <div>
                                <label htmlFor="card-number" className="text-sm font-medium block mb-1">Card Number</label>
                                <input
                                    id="card-number"
                                    value={withdrawCardNumber}
                                    onChange={(e) => setWithdrawCardNumber(e.target.value)}
                                    placeholder="XXXX XXXX XXXX XXXX"
                                    className="apple-input"
                                />
                                <p className="text-xs text-[var(--apple-dark-gray)] mt-1">Enter the card number you want to receive the funds</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="apple-dialog-footer">
                    <div className="w-full flex justify-between items-center">
                        <div className="text-sm text-[var(--apple-dark-gray)]">
                            {withdrawMethod === 'bank' ? '1-2 business days' :
                                withdrawMethod === 'upi' ? 'Within 24 hours' :
                                    '3-5 business days'}
                        </div>
                        <button
                            onClick={onWithdrawMoney}
                            disabled={isWithdrawButtonDisabled}
                            className="apple-button"
                        >
                            {withdrawLoading ? (
                                <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Processing...
                                </div>
                            ) : (
                                <>Withdraw</>
                            )}
                        </button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WithdrawDialog;
