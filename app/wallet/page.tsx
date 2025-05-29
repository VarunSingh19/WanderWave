"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, SessionProvider } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { LogIn } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { WalletData } from "./types"
import { testWalletAPI, testRazorpayAPI } from './debug'

// Import components
import WalletHeader from "./components/WalletHeader"
import BalanceCard from "./components/BalanceCard"
import RecentActivityCard from "./components/RecentActivityCard"
import QuickActionsCard from "./components/QuickActionsCard"
import TransactionHistory from "./components/TransactionHistory"
import { AddMoneyDialog } from "./components/AddMoneyDialog"
import { WithdrawDialog } from "./components/WithdrawDialog"

// Import CSS
import "./wallet.css"

// Stripe initialization
let stripePromise: ReturnType<typeof loadStripe> | null = null;

// Wrap the entire component with SessionProvider
function WalletPageContent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState<string>('')
  const [addMoneyLoading, setAddMoneyLoading] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [isAddMoneyDialogOpen, setIsAddMoneyDialogOpen] = useState(false)
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [stripeKey, setStripeKey] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'razorpay'>('stripe')
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'upi' | 'card'>('bank')
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('')
  const [withdrawAccountName, setWithdrawAccountName] = useState('')
  const [withdrawAccountIFSC, setWithdrawAccountIFSC] = useState('')
  const [withdrawUPI, setWithdrawUPI] = useState('')
  const [withdrawCardNumber, setWithdrawCardNumber] = useState('')
  const [razorpayData, setRazorpayData] = useState<any>(null)
  const [showCustomAmount, setShowCustomAmount] = useState(false)
  const predefinedAmounts = [50, 100, 200, 500, 1000, 5000]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchWalletData()
    }
  }, [status, router])

  const fetchWalletData = async (retryCount = 0) => {
    if (status !== "authenticated") return

    try {
      setLoading(true)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch("/api/profile/wallet", {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }
        throw new Error(`Failed to load wallet data: ${response.status}`)
      }

      const data = await response.json()
      setWalletData(data)
    } catch (error: any) {
      console.error("Error fetching wallet data:", error)

      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        if (retryCount < 2) {
          toast({
            title: "Retrying...",
            description: `Connection timeout, retrying... (${retryCount + 1}/3)`,
          })
          setTimeout(() => fetchWalletData(retryCount + 1), 1000)
          return
        }
      }

      toast({
        title: "Error",
        description: "Failed to load wallet data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddMoney = async () => {
    // Validate input
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than zero",
        variant: "destructive",
      })
      return
    }

    setAddMoneyLoading(true)
    console.log(`Initiating wallet deposit of ${amount} using ${paymentMethod}`)

    try {
      // Format amount correctly
      const amountValue = parseFloat(amount)

      // Make API request
      const response = await fetch("/api/profile/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountValue,
          paymentMethod: paymentMethod
        }),
      })

      // Check if response is OK
      if (!response.ok) {
        // Get error details from response
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Failed to add money: ${response.status} ${response.statusText}`)
      }

      // Parse the response data
      const data = await response.json()
      console.log("Payment response data:", data)

      if (data.paymentMethod === 'stripe') {
        // Validate Stripe response data
        if (!data.clientSecret) {
          throw new Error("Missing client secret from Stripe")
        }
        if (!data.transactionId) {
          throw new Error("Missing transaction ID from Stripe")
        }
        if (!data.publishableKey) {
          throw new Error("Missing publishable key from Stripe")
        }

        // Initialize Stripe
        if (!stripePromise && data.publishableKey) {
          stripePromise = loadStripe(data.publishableKey);
        }

        // Save data for Stripe Elements
        setClientSecret(data.clientSecret);
        setTransactionId(data.transactionId);
        setStripeKey(data.publishableKey);
        setRazorpayData(null);
      }
      else if (data.paymentMethod === 'razorpay') {
        // Validate Razorpay response data
        if (!data.orderId) {
          throw new Error("Missing order ID from Razorpay")
        }
        if (!data.transactionId) {
          throw new Error("Missing transaction ID from Razorpay")
        }
        if (!data.keyId) {
          throw new Error("Missing key ID from Razorpay")
        }

        // Save data for Razorpay
        setRazorpayData({
          orderId: data.orderId,
          amount: data.amount,
          keyId: data.keyId,
          transactionId: data.transactionId,
          prefill: data.prefill || {}
        });
        setTransactionId(data.transactionId);
        setClientSecret(null);
      }
      else {
        throw new Error(`Invalid payment method returned from server: ${data.paymentMethod}`)
      }

      // Payment initialization successful
      setAddMoneyLoading(false)

    } catch (error: any) {
      console.error("Payment initialization error:", error)

      // Show error toast
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment request. Please try again.",
        variant: "destructive",
      })

      // Reset state
      setAddMoneyLoading(false)
      return
    }
  }

  const handleWithdrawMoney = async () => {
    // Validate input
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than zero",
        variant: "destructive",
      })
      return
    }

    // Check if wallet has sufficient balance
    if (walletData && parseFloat(amount) > walletData.wallet.balance) {
      toast({
        title: "Insufficient balance",
        description: `Your current balance is ${formatCurrency(walletData.wallet.balance)}, which is less than the requested withdrawal amount`,
        variant: "destructive",
      })
      return
    }

    // Validate account details based on withdrawal method
    if (withdrawMethod === 'bank') {
      if (!withdrawAccountNumber || !withdrawAccountName || !withdrawAccountIFSC) {
        toast({
          title: "Missing account details",
          description: "Please fill in all bank account fields",
          variant: "destructive",
        })
        return
      }
    } else if (withdrawMethod === 'upi') {
      if (!withdrawUPI) {
        toast({
          title: "Missing UPI ID",
          description: "Please enter your UPI ID",
          variant: "destructive",
        })
        return
      }
    } else if (withdrawMethod === 'card') {
      if (!withdrawCardNumber) {
        toast({
          title: "Missing card details",
          description: "Please enter your card number",
          variant: "destructive",
        })
        return
      }
    }

    setWithdrawLoading(true)
    console.log(`Initiating wallet withdrawal of ${amount} using ${withdrawMethod}`)

    try {
      // Prepare account details based on withdrawal method
      let accountDetails = {}

      if (withdrawMethod === 'bank') {
        accountDetails = {
          type: 'bank',
          accountNumber: withdrawAccountNumber,
          accountName: withdrawAccountName,
          ifsc: withdrawAccountIFSC
        }
      } else if (withdrawMethod === 'upi') {
        accountDetails = {
          type: 'upi',
          upiId: withdrawUPI
        }
      } else if (withdrawMethod === 'card') {
        accountDetails = {
          type: 'card',
          cardNumber: withdrawCardNumber.replace(/\s+/g, '').slice(-4) // Only store last 4 digits for security
        }
      }

      // Format amount correctly
      const amountValue = parseFloat(amount)

      // Make API request
      const response = await fetch("/api/profile/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountValue,
          accountDetails
        }),
      })

      // Check if response is OK
      if (!response.ok) {
        // Get error details from response
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Failed to process withdrawal: ${response.status} ${response.statusText}`)
      }

      // Parse the response data
      const data = await response.json()
      console.log("Withdrawal response data:", data)

      // Show success message
      toast({
        title: "Withdrawal requested",
        description: `Your withdrawal of ${formatCurrency(amountValue)} has been requested and is being processed.`,
      })

      // Reset state and close dialog
      setAmount('')
      setWithdrawMethod('bank')
      setWithdrawAccountNumber('')
      setWithdrawAccountName('')
      setWithdrawAccountIFSC('')
      setWithdrawUPI('')
      setWithdrawCardNumber('')
      setIsWithdrawDialogOpen(false)

      // Refresh wallet data
      fetchWalletData()

    } catch (error: any) {
      console.error("Withdrawal error:", error)

      // Show error toast
      toast({
        title: "Withdrawal Error",
        description: error.message || "Failed to process withdrawal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setWithdrawLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    // Show success toast
    toast({
      title: "Payment Successful!",
      description: `Your wallet has been credited with ${formatCurrency(parseFloat(amount))}`,
      variant: "default",
    });

    // Close dialog
    setIsAddMoneyDialogOpen(false);

    // Reset states
    setClientSecret(null);
    setTransactionId(null);
    setRazorpayData(null);
    setAmount('');
    setAddMoneyLoading(false);

    // Fetch the updated wallet data to show the new balance
    fetchWalletData();
  }

  const handleViewAllTransactions = () => {
    document.getElementById('transaction-history')?.scrollIntoView({ behavior: 'smooth' });
  }

  const handleOpenDialog = () => {
    console.log("Opening dialog...");
    setIsAddMoneyDialogOpen(true);
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--apple-light-bg)] p-4">
        <div className="max-w-md w-full apple-card">
          <div className="bg-[var(--apple-black)] p-8 text-white">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <LogIn className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center">Authentication Required</h2>
          </div>
          <div className="p-8">
            <p className="text-[var(--apple-dark-gray)] text-center mb-8">
              Please log in to access your wallet and manage your finances securely.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="apple-button w-full"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--apple-light-bg)] p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto apple-container">
          <div className="flex items-center justify-between mb-8">
            <div className="apple-skeleton h-12 w-36 rounded-md" />
            <div className="apple-skeleton h-10 w-32 rounded-md" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="apple-skeleton h-[180px] rounded-2xl" />
            <div className="apple-skeleton h-[180px] rounded-2xl" />
            <div className="apple-skeleton h-[180px] rounded-2xl" />
          </div>

          <div className="mb-8">
            <div className="apple-skeleton h-10 w-44 mb-6 rounded-md" />
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="apple-skeleton h-20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--apple-light-bg)] p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto apple-container">
        {/* Header */}
        <WalletHeader
          balance={walletData?.wallet.balance || 0}
          isAddMoneyDialogOpen={isAddMoneyDialogOpen}
          setIsAddMoneyDialogOpen={setIsAddMoneyDialogOpen}
          isWithdrawDialogOpen={isWithdrawDialogOpen}
          setIsWithdrawDialogOpen={setIsWithdrawDialogOpen}
          onAddMoney={handleAddMoney}
          onWithdrawMoney={handleWithdrawMoney}
          disableWithdraw={!walletData || walletData.wallet.balance <= 0}
        />

        {/* Balance and quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Main Balance Card */}
          <BalanceCard
            balance={walletData?.wallet.balance || 0}
            formatCurrency={formatCurrency}
            onAddMoney={handleOpenDialog}
            onWithdraw={() => setIsWithdrawDialogOpen(true)}
            disableWithdraw={!walletData || walletData.wallet.balance <= 0}
          />

          {/* Recent Activity Card */}
          <RecentActivityCard
            transactions={walletData?.transactions || []}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onViewAllTransactions={handleViewAllTransactions}
          />

          {/* Quick Actions Card */}
          <QuickActionsCard
            onAddMoney={() => setIsAddMoneyDialogOpen(true)}
            onWithdraw={() => setIsWithdrawDialogOpen(true)}
            disableWithdraw={!walletData || walletData.wallet.balance <= 0}
          />
        </div>

        {/* Transaction History */}
        <TransactionHistory
          transactions={walletData?.transactions || []}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />

        {/* Add Money Dialog */}
        <AddMoneyDialog
          isOpen={isAddMoneyDialogOpen}
          onOpenChange={setIsAddMoneyDialogOpen}
          amount={amount}
          setAmount={setAmount}
          showCustomAmount={showCustomAmount}
          setShowCustomAmount={setShowCustomAmount}
          predefinedAmounts={predefinedAmounts}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          onAddMoney={handleAddMoney}
          addMoneyLoading={addMoneyLoading}
          clientSecret={clientSecret}
          transactionId={transactionId}
          razorpayData={razorpayData}
          stripePromise={stripePromise}
          handlePaymentSuccess={handlePaymentSuccess}
          setClientSecret={setClientSecret}
          setRazorpayData={setRazorpayData}
          setTransactionId={setTransactionId}
        />

        {/* Withdraw Money Dialog */}
        <WithdrawDialog
          isOpen={isWithdrawDialogOpen}
          onOpenChange={setIsWithdrawDialogOpen}
          amount={amount}
          setAmount={setAmount}
          balance={walletData?.wallet.balance || 0}
          formatCurrency={formatCurrency}
          withdrawMethod={withdrawMethod}
          setWithdrawMethod={setWithdrawMethod}
          withdrawAccountNumber={withdrawAccountNumber}
          setWithdrawAccountNumber={setWithdrawAccountNumber}
          withdrawAccountName={withdrawAccountName}
          setWithdrawAccountName={setWithdrawAccountName}
          withdrawAccountIFSC={withdrawAccountIFSC}
          setWithdrawAccountIFSC={setWithdrawAccountIFSC}
          withdrawUPI={withdrawUPI}
          setWithdrawUPI={setWithdrawUPI}
          withdrawCardNumber={withdrawCardNumber}
          setWithdrawCardNumber={setWithdrawCardNumber}
          onWithdrawMoney={handleWithdrawMoney}
          withdrawLoading={withdrawLoading}
        />
      </div>
    </div>
  )
}

// Export the page with SessionProvider
export default function WalletPage() {
  return (
    <SessionProvider>
      <WalletPageContent />
    </SessionProvider>
  )
}
