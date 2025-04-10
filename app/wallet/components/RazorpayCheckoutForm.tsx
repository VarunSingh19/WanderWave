import React, { useEffect, useState } from 'react';
import { RazorpayCheckoutProps } from '../types';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export const RazorpayCheckoutForm: React.FC<RazorpayCheckoutProps> = ({
    amount,
    transactionId,
    orderId,
    keyId,
    prefill,
    onSuccess
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;

        script.onload = () => {
            // Script loaded successfully
            setIsScriptLoaded(true);
        };

        script.onerror = () => {
            // Script failed to load
            setErrorMessage('Failed to load Razorpay. Please try again later.');
        };

        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const initializeRazorpay = () => {
        setIsLoading(true);
        setErrorMessage(null);

        if (typeof window.Razorpay === 'undefined') {
            // If Razorpay is not loaded yet, retry after a short delay
            setTimeout(initializeRazorpay, 100);
            return;
        }

        const options = {
            key: keyId,
            amount: amount * 100, // Razorpay amount is in paise
            currency: 'INR',
            name: 'WanderWave',
            description: 'Add Money to Wallet',
            image: 'https://same-assets.com/v1/4b767323-058c-4069-a91e-eaa13068dafa/company-logo.png',
            order_id: orderId,
            handler: function (response: any) {
                // Handle payment success
                verifyPayment(response);
            },
            prefill: {
                name: prefill?.name || '',
                email: prefill?.email || '',
                contact: prefill?.phone || ''
            },
            notes: {
                transaction_id: transactionId
            },
            theme: {
                color: '#0066CC' // Apple blue color
            },
            modal: {
                ondismiss: function () {
                    setIsLoading(false);
                }
            }
        };

        try {
            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response: any) {
                setErrorMessage(`Payment failed: ${response.error.description}`);
                setIsLoading(false);
            });
            razorpay.open();
        } catch (error: any) {
            setErrorMessage(error.message || 'Failed to initialize Razorpay');
            setIsLoading(false);
        }
    };

    const verifyPayment = async (response: any) => {
        try {
            // Send verification request to our backend
            const verifyResponse = await fetch('/api/payments/verify-razorpay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    signature: response.razorpay_signature,
                    transaction_id: transactionId
                })
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
        } catch (error: any) {
            console.error('Error verifying payment:', error);
            setErrorMessage(error.message || 'Error verifying payment. Please contact support.');
            setIsLoading(false);
        }
    };

    return (
        <div className="text-center">
            <div className="mb-6">
                <div className="w-16 h-16 bg-[var(--apple-blue)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <img
                        src="https://same-assets.com/v1/a8e2a4ef-59c2-4e43-bd6c-64a9c36f3d4a/razorpay-logo.svg"
                        alt="Razorpay"
                        className="h-10"
                    />
                </div>
                <p className="text-[var(--apple-dark-gray)]">
                    You'll be redirected to Razorpay to complete your payment of ${amount.toFixed(2)}
                </p>
            </div>

            {errorMessage && (
                <div className="text-[var(--apple-red)] text-sm py-2 px-3 bg-[var(--apple-red)]/10 rounded-md mb-4">
                    {errorMessage}
                </div>
            )}

            <button
                onClick={initializeRazorpay}
                disabled={isLoading || !isScriptLoaded}
                className="apple-button w-full"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        <span>Processing...</span>
                    </div>
                ) : (
                    <span>Pay with Razorpay</span>
                )}
            </button>

            <div className="flex justify-center mt-4">
                <div className="px-2 py-1 bg-[var(--apple-light-gray)] rounded text-xs text-[var(--apple-dark-gray)] flex items-center">
                    <img
                        src="https://same-assets.com/v1/a8e2a4ef-59c2-4e43-bd6c-64a9c36f3d4a/secure-payment.svg"
                        alt="Secure"
                        className="h-3 mr-1"
                    />
                    Secure Payment
                </div>
            </div>
        </div>
    );
};

export default RazorpayCheckoutForm;
