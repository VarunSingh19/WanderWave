import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { CheckoutFormProps } from '../types';

export const StripeCheckoutForm: React.FC<CheckoutFormProps> = ({ amount, transactionId, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        try {
            // First confirm the payment with Stripe
            const result = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/api/payments/verify-stripe?transaction_id=${transactionId}`,
                },
                redirect: 'if_required',
            });

            if (result.error) {
                // Show error to your customer
                setErrorMessage(result.error.message || 'An unexpected error occurred.');
                setIsLoading(false);
            } else {
                // The payment has been processed!
                if (result.paymentIntent && (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'processing')) {
                    // Verify the payment with our backend
                    const verifyResponse = await fetch('/api/payments/verify-stripe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            paymentIntentId: result.paymentIntent.id,
                            transaction_id: transactionId,
                        }),
                    });

                    if (verifyResponse.ok) {
                        // Payment verified successfully
                        onSuccess();
                    } else {
                        try {
                            const errorData = await verifyResponse.json();
                            setErrorMessage(errorData.error || errorData.details || 'Payment verification failed. Please contact support.');
                        } catch (err) {
                            setErrorMessage('Payment verification failed. Please contact support.');
                        }
                        setIsLoading(false);
                    }
                } else {
                    // Otherwise, show an error
                    setErrorMessage('Something went wrong with your payment. Please try again.');
                    setIsLoading(false);
                }
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'An unexpected error occurred.');
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />

            {errorMessage && (
                <div className="text-[var(--apple-red)] text-sm py-2 px-3 bg-[var(--apple-red)]/10 rounded-md">
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isLoading}
                className="apple-button w-full"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        <span>Processing...</span>
                    </div>
                ) : (
                    <span>Pay ${amount.toFixed(2)}</span>
                )}
            </button>

            <div className="flex justify-center items-center gap-2 mt-4">
                <div className="w-12 h-7">
                    <img src="https://same-assets.com/v1/4b767323-058c-4069-a91e-eaa13068dafa/visa-logo.svg" alt="Visa" className="h-full object-contain" />
                </div>
                <div className="w-12 h-7">
                    <img src="https://same-assets.com/v1/4b767323-058c-4069-a91e-eaa13068dafa/mastercard-logo.svg" alt="Mastercard" className="h-full object-contain" />
                </div>
                <div className="w-12 h-7">
                    <img src="https://same-assets.com/v1/4b767323-058c-4069-a91e-eaa13068dafa/amex-logo.svg" alt="American Express" className="h-full object-contain" />
                </div>
            </div>
        </form>
    );
};

export default StripeCheckoutForm;
