import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Wallet, LockIcon } from 'lucide-react';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Import checkout forms
import StripeCheckoutForm from './StripeCheckoutForm';
import RazorpayCheckoutForm from './RazorpayCheckoutForm';

interface AddMoneyDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    amount: string;
    setAmount: (amount: string) => void;
    showCustomAmount: boolean;
    setShowCustomAmount: (show: boolean) => void;
    predefinedAmounts: number[];
    paymentMethod: 'stripe' | 'razorpay';
    setPaymentMethod: (method: 'stripe' | 'razorpay') => void;
    onAddMoney: () => void;
    addMoneyLoading: boolean;
    clientSecret: string | null;
    transactionId: string | null;
    setTransactionId: (id: string | null) => void;
    razorpayData: any;
    setRazorpayData: (data: any) => void;
    setClientSecret: (secret: string | null) => void;
    stripePromise: any;
    handlePaymentSuccess: () => void;
}

export const AddMoneyDialog: React.FC<AddMoneyDialogProps> = ({
    isOpen,
    onOpenChange,
    amount,
    setAmount,
    showCustomAmount,
    setShowCustomAmount,
    predefinedAmounts,
    paymentMethod,
    setPaymentMethod,
    onAddMoney,
    addMoneyLoading,
    clientSecret,
    transactionId,
    razorpayData,
    stripePromise,
    handlePaymentSuccess,
    setClientSecret,
    setRazorpayData,
    setTransactionId
}) => {
    const handlePredefinedAmountClick = (amt: number) => {
        setAmount(amt.toString());
        setShowCustomAmount(false);
    };

    const handleCustomAmountClick = () => {
        setShowCustomAmount(true);
        setAmount('');
    };

    const handleGoBack = () => {
        // Go back to amount selection
        if (clientSecret || razorpayData) {
            if (clientSecret) {
                setClientSecret(null);
            } else {
                setRazorpayData(null);
            }
            setTransactionId(null);
        }
    };

    const renderStripeForm = () => {
        if (!stripePromise || !clientSecret) return null;

        return (
            <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: 'stripe' } }}
            >
                <StripeCheckoutForm
                    amount={parseFloat(amount)}
                    transactionId={transactionId!}
                    onSuccess={handlePaymentSuccess}
                />
            </Elements>
        );
    };

    const renderRazorpayForm = () => {
        if (!razorpayData) return null;

        return (
            <RazorpayCheckoutForm
                amount={razorpayData.amount}
                transactionId={razorpayData.transactionId}
                orderId={razorpayData.orderId}
                keyId={razorpayData.keyId}
                prefill={razorpayData.prefill}
                onSuccess={handlePaymentSuccess}
            />
        );
    };

    const renderStage = () => {
        if (!clientSecret && !razorpayData) {
            // Stage 1: Amount Selection UI
            return (
                <>
                    <DialogHeader className="apple-dialog-header">
                        <DialogTitle className="text-2xl font-semibold">Add Money</DialogTitle>
                        <DialogDescription className="text-[var(--apple-dark-gray)] mt-1">
                            Choose an amount to add to your wallet
                        </DialogDescription>
                    </DialogHeader>

                    <div className="apple-dialog-content">
                        {/* Amount selection */}
                        <div className="mb-8">
                            <label className="text-base font-medium block mb-3">Select Amount</label>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {predefinedAmounts.map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        className={`h-16 rounded-xl text-lg font-medium transition-all ${amount === amt.toString() && !showCustomAmount
                                            ? "bg-[var(--apple-blue)] text-white"
                                            : "bg-[var(--apple-light-gray)] text-[var(--apple-black)] hover:bg-[var(--apple-blue)/10]"
                                            }`}
                                        onClick={() => handlePredefinedAmountClick(amt)}
                                    >
                                        ${amt}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                className={`w-full h-12 rounded-xl text-base font-medium transition-all ${showCustomAmount
                                    ? "bg-[var(--apple-blue)] text-white"
                                    : "bg-[var(--apple-light-gray)] text-[var(--apple-black)] hover:bg-[var(--apple-blue)/10]"
                                    }`}
                                onClick={handleCustomAmountClick}
                            >
                                Enter Custom Amount
                            </button>
                        </div>

                        {/* Custom amount input */}
                        {showCustomAmount && (
                            <div className="mb-8">
                                <label className="text-base font-medium block mb-2">Custom Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--apple-dark-gray)]">$</span>
                                    <input
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="apple-input pl-8 h-12 text-lg w-full"
                                        placeholder="Enter amount"
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        {/* Payment method selection */}
                        <div className="mb-2">
                            <label className="text-base font-medium block mb-3">Payment Method</label>
                            <RadioGroup
                                value={paymentMethod}
                                onValueChange={(value) => setPaymentMethod(value as 'stripe' | 'razorpay')}
                                className="space-y-3"
                            >
                                <div className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all hover:border-[var(--apple-blue)/30] hover:bg-[var(--apple-blue)/5] ${paymentMethod === 'stripe' ? 'border-[var(--apple-blue)] bg-[var(--apple-blue)/5]' : 'border-[var(--apple-light-gray)]'
                                    }`}>
                                    <RadioGroupItem value="stripe" id="stripe" className="mr-4" />
                                    <div className="flex-1">
                                        <label htmlFor="stripe" className="flex items-center text-base font-medium cursor-pointer">
                                            <CreditCard className="w-5 h-5 mr-2 text-[var(--apple-blue)]" />
                                            Credit or Debit Card
                                        </label>
                                        <p className="text-[var(--apple-dark-gray)] text-sm mt-1">Pay securely with Stripe</p>
                                    </div>
                                    <img src="https://same-assets.com/v1/4b767323-058c-4069-a91e-eaa13068dafa/stripe-logo.svg" alt="Stripe" className="h-8" />
                                </div>

                                <div className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all hover:border-[var(--apple-blue)/30] hover:bg-[var(--apple-blue)/5] ${paymentMethod === 'razorpay' ? 'border-[var(--apple-blue)] bg-[var(--apple-blue)/5]' : 'border-[var(--apple-light-gray)]'
                                    }`}>
                                    <RadioGroupItem value="razorpay" id="razorpay" className="mr-4" />
                                    <div className="flex-1">
                                        <label htmlFor="razorpay" className="flex items-center text-base font-medium cursor-pointer">
                                            <Wallet className="w-5 h-5 mr-2 text-[var(--apple-green)]" />
                                            UPI / Wallet / Net Banking
                                        </label>
                                        <p className="text-[var(--apple-dark-gray)] text-sm mt-1">Pay using Razorpay</p>
                                    </div>
                                    <img src="https://same-assets.com/v1/a8e2a4ef-59c2-4e43-bd6c-64a9c36f3d4a/razorpay-logo.svg" alt="Razorpay" className="h-7" />
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    <DialogFooter className="apple-dialog-footer">
                        <div className="w-full flex justify-between items-center">
                            <div className="text-sm text-[var(--apple-dark-gray)] flex items-center">
                                <LockIcon className="w-3 h-3 mr-1" />
                                Secure transaction
                            </div>
                            <button
                                onClick={onAddMoney}
                                disabled={addMoneyLoading || !amount || parseFloat(amount) <= 0}
                                className="apple-button"
                            >
                                {addMoneyLoading ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Processing...
                                    </div>
                                ) : (
                                    <>Continue</>
                                )}
                            </button>
                        </div>
                    </DialogFooter>
                </>
            );
        } else if (clientSecret) {
            // Stage 2A: Stripe Payment Form
            return (
                <>
                    <DialogHeader className="apple-dialog-header">
                        <DialogTitle className="text-2xl font-semibold">Payment Details</DialogTitle>
                        <DialogDescription className="text-[var(--apple-dark-gray)] mt-1">
                            Complete your payment of ${parseFloat(amount).toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="apple-dialog-content">
                        <div className="bg-[var(--apple-light-gray)] p-6 rounded-xl">
                            {renderStripeForm()}
                        </div>

                        <div className="flex items-center justify-center text-xs text-[var(--apple-dark-gray)] mt-4">
                            <LockIcon className="w-3 h-3 mr-1" />
                            Payments are secure and encrypted
                        </div>
                    </div>

                    <DialogFooter className="apple-dialog-footer">
                        <div className="w-full flex justify-start">
                            <button
                                onClick={handleGoBack}
                                className="text-[var(--apple-blue)]"
                            >
                                ← Back to payment methods
                            </button>
                        </div>
                    </DialogFooter>
                </>
            );
        } else if (razorpayData) {
            // Stage 2B: Razorpay Payment Form
            return (
                <>
                    <DialogHeader className="apple-dialog-header">
                        <DialogTitle className="text-2xl font-semibold">Pay with Razorpay</DialogTitle>
                        <DialogDescription className="text-[var(--apple-dark-gray)] mt-1">
                            Complete your payment of ${parseFloat(amount).toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="apple-dialog-content">
                        {renderRazorpayForm()}
                    </div>

                    <DialogFooter className="apple-dialog-footer">
                        <div className="w-full flex justify-start">
                            <button
                                onClick={handleGoBack}
                                className="text-[var(--apple-blue)]"
                            >
                                ← Back to payment methods
                            </button>
                        </div>
                    </DialogFooter>
                </>
            );
        }

        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="apple-dialog max-w-md md:max-w-lg p-0">
                {renderStage()}
            </DialogContent>
        </Dialog>
    );
};
