// "use client"

// import type React from "react"

// import { useEffect, useState, useRef, useMemo } from "react"
// import { useRouter } from "next/navigation"
// import { useSession } from "next-auth/react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Badge } from "@/components/ui/badge"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Button } from "@/components/ui/button"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { useToast } from "@/hooks/use-toast"
// import { formatCurrency, formatDate } from "@/lib/utils"
// import {
//   Wallet,
//   ArrowUpRight,
//   ArrowDownLeft,
//   CreditCard,
//   Clock,
//   CheckCircle,
//   XCircle,
//   PlusCircle,
//   LogIn,
//   ArrowDownIcon,
//   CreditCardIcon,
//   SmartphoneIcon,
//   AlertCircle,
//   PiggyBank,
//   BarChart3,
//   Download,
//   Filter,
//   ChevronDown,
// } from "lucide-react"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { testWalletAPI, testRazorpayAPI } from "./debug"
// import { motion, AnimatePresence } from "framer-motion"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { PieChart, BarChart } from "@/components/ui/charts"
// // Stripe imports
// import { Elements } from "@stripe/react-stripe-js"
// import { loadStripe } from "@stripe/stripe-js"
// import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
// import { generateWalletPDF } from "@/lib/pdf-utils"

// // Types
// interface Transaction {
//   _id: string
//   type: string
//   amount: number
//   status: string
//   description: string
//   createdAt: string
//   trip?: {
//     _id: string
//     name: string
//   }
//   expense?: {
//     _id: string
//     title: string
//   }
// }

// interface WalletData {
//   wallet: {
//     balance: number
//   }
//   transactions: Transaction[]
// }

// interface MonthlyStats {
//   month: string
//   deposits: number
//   withdrawals: number
//   payments: number
// }

// interface CategoryStats {
//   category: string
//   amount: number
//   percentage: number
// }

// // Initialize Stripe
// let stripePromise: ReturnType<typeof loadStripe> | null = null

// // CheckoutForm component using Stripe Elements
// function CheckoutForm({
//   amount,
//   transactionId,
//   onSuccess,
// }: { amount: number; transactionId: string; onSuccess: () => void }) {
//   const stripe = useStripe()
//   const elements = useElements()
//   const { toast } = useToast()
//   const [isLoading, setIsLoading] = useState(false)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!stripe || !elements) {
//       // Stripe.js hasn't yet loaded
//       return
//     }

//     setIsLoading(true)

//     try {
//       const { error, paymentIntent } = await stripe.confirmPayment({
//         elements,
//         confirmParams: {
//           return_url: window.location.origin + "/wallet",
//         },
//         redirect: "if_required",
//       })

//       if (error) {
//         toast({
//           title: "Payment failed",
//           description: error.message || "Your payment was not successful. Please try again.",
//           variant: "destructive",
//         })
//       } else if (paymentIntent && paymentIntent.status === "succeeded") {
//         // Verify payment on the server
//         const verifyResponse = await fetch("/api/payments/verify-stripe", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             paymentIntentId: paymentIntent.id,
//             transaction_id: transactionId,
//           }),
//         })

//         if (verifyResponse.ok) {
//           toast({
//             title: "Payment successful",
//             description: `Successfully added ${formatCurrency(amount)} to your wallet`,
//           })
//           onSuccess()
//         } else {
//           const errorData = await verifyResponse.json()
//           throw new Error(errorData.error || "Failed to verify payment")
//         }
//       }
//     } catch (error: any) {
//       console.error("Payment error:", error)
//       toast({
//         title: "Payment error",
//         description: error.message || "There was a problem with your payment",
//         variant: "destructive",
//       })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit}>
//       <PaymentElement className="mb-6" />
//       <div className="flex items-center justify-end gap-2">
//         <Button type="submit" disabled={!stripe || isLoading} className="w-full">
//           {isLoading ? "Processing..." : `Pay ${formatCurrency(amount)}`}
//         </Button>
//       </div>
//     </form>
//   )
// }

// // Razorpay checkout component
// function RazorpayCheckout({
//   amount,
//   transactionId,
//   orderId,
//   keyId,
//   prefill,
//   onSuccess,
// }: {
//   amount: number
//   transactionId: string
//   orderId: string
//   keyId: string
//   prefill: any
//   onSuccess: () => void
// }) {
//   const { toast } = useToast()
//   const [isLoading, setIsLoading] = useState(false)
//   const razorpayInstanceRef = useRef<any>(null)
//   const [scriptLoaded, setScriptLoaded] = useState(false)

//   // Load Razorpay script when component mounts
//   useEffect(() => {
//     const loadRazorpayScript = () => {
//       return new Promise<void>((resolve, reject) => {
//         // Check if the script is already loaded
//         if (window.Razorpay) {
//           console.log("Razorpay already loaded")
//           setScriptLoaded(true)
//           return resolve()
//         }

//         console.log("Loading Razorpay script...")
//         const script = document.createElement("script")
//         script.src = "https://checkout.razorpay.com/v1/checkout.js"
//         script.async = true

//         script.onload = () => {
//           console.log("Razorpay script loaded successfully")
//           setScriptLoaded(true)
//           resolve()
//         }

//         script.onerror = (error) => {
//           console.error("Error loading Razorpay script:", error)
//           reject(new Error("Failed to load Razorpay script"))
//         }

//         document.body.appendChild(script)
//       })
//     }

//     loadRazorpayScript().catch((error) => {
//       console.error("Failed to load Razorpay:", error)
//       toast({
//         title: "Failed to load payment gateway",
//         description: "Please try again or use a different payment method",
//         variant: "destructive",
//       })
//     })

//     return () => {
//       // Clean up Razorpay instance if it exists
//       if (razorpayInstanceRef.current) {
//         razorpayInstanceRef.current.close()
//       }
//     }
//   }, [toast])

//   const handlePayment = async () => {
//     setIsLoading(true)

//     if (!window.Razorpay) {
//       toast({
//         title: "Razorpay not available",
//         description: "Please try again in a few moments or use a different payment method",
//         variant: "destructive",
//       })
//       setIsLoading(false)
//       return
//     }

//     try {
//       console.log("Initializing Razorpay payment:", { orderId, amount, keyId })

//       const options = {
//         key: keyId,
//         amount: amount, // Amount in paise
//         currency: "INR",
//         name: "Trip App",
//         description: "Add Money to Wallet",
//         order_id: orderId,
//         prefill: prefill || {},
//         handler: async (response: any) => {
//           console.log("Razorpay payment successful:", response)

//           try {
//             // Log full details of the response
//             console.log("Full Razorpay response:", JSON.stringify(response, null, 2))

//             // First try the simplified verification endpoint for debugging
//             const debugVerifyUrl = window.location.origin + "/api/wallet/verify"
//             console.log(`Trying simplified verification at: ${debugVerifyUrl}`)

//             const verifyPayload = {
//               paymentId: response.razorpay_payment_id,
//               orderId: response.razorpay_order_id,
//               signature: response.razorpay_signature,
//               transaction_id: transactionId,
//             }

//             console.log("Verification payload:", JSON.stringify(verifyPayload, null, 2))

//             try {
//               const verifyResponse = await fetch(debugVerifyUrl, {
//                 method: "POST",
//                 headers: {
//                   "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(verifyPayload),
//               })

//               console.log("Debug verification response status:", verifyResponse.status)

//               if (verifyResponse.ok) {
//                 const verifyData = await verifyResponse.json()
//                 console.log("Debug verification response data:", verifyData)

//                 toast({
//                   title: "Payment successful",
//                   description: `Successfully added ₹${(amount / 100).toFixed(2)} to your wallet`,
//                 })
//                 onSuccess()
//                 return // Exit early on success
//               } else {
//                 console.log("Simplified verification failed, falling back to standard verification...")
//               }
//             } catch (debugError) {
//               console.error("Error with simplified verification:", debugError)
//               console.log("Falling back to standard verification...")
//             }

//             // Fallback to the standard verification endpoint
//             const verifyUrl = window.location.origin + "/api/payments/verify-razorpay"
//             console.log(`Sending verification request to: ${verifyUrl}`)

//             const verifyResponse = await fetch(verifyUrl, {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//               },
//               body: JSON.stringify(verifyPayload),
//             })

//             console.log("Verification response status:", verifyResponse.status)

//             if (!verifyResponse.ok) {
//               const errorText = await verifyResponse.text()
//               console.error("Verification error response:", errorText)
//               throw new Error(`Verification failed: ${verifyResponse.status}`)
//             }

//             const verifyData = await verifyResponse.json()
//             console.log("Verification response data:", verifyData)

//             toast({
//               title: "Payment successful",
//               description: `Successfully added ₹${(amount / 100).toFixed(2)} to your wallet`,
//             })
//             onSuccess()
//           } catch (error: any) {
//             console.error("Payment verification error:", error)
//             toast({
//               title: "Payment verification failed",
//               description: error.message || "There was a problem verifying your payment",
//               variant: "destructive",
//             })
//           } finally {
//             setIsLoading(false)
//           }
//         },
//         modal: {
//           ondismiss: () => {
//             console.log("Payment modal dismissed")
//             setIsLoading(false)
//           },
//           escape: false,
//           backdropclose: false,
//         },
//         theme: {
//           color: "#3399cc",
//         },
//       }

//       console.log("Creating Razorpay instance with options:", JSON.stringify(options, null, 2))
//       razorpayInstanceRef.current = new window.Razorpay(options)
//       razorpayInstanceRef.current.on("payment.failed", (response: any) => {
//         console.error("Razorpay payment failed:", response.error)
//         toast({
//           title: "Payment failed",
//           description: response.error.description || "Your payment has failed. Please try again.",
//           variant: "destructive",
//         })
//         setIsLoading(false)
//       })

//       razorpayInstanceRef.current.open()
//       console.log("Razorpay payment modal opened")
//     } catch (error: any) {
//       console.error("Razorpay initialization error:", error)
//       toast({
//         title: "Payment error",
//         description: error.message || "Failed to initialize payment",
//         variant: "destructive",
//       })
//       setIsLoading(false)
//     }
//   }

//   // Open Razorpay modal automatically once script is loaded
//   useEffect(() => {
//     if (scriptLoaded && !isLoading) {
//       console.log("Script loaded, initiating payment automatically")
//       handlePayment()
//     }
//   }, [scriptLoaded])

//   return (
//     <div className="py-6">
//       <p className="mb-6 text-center">
//         {isLoading ? "Processing payment..." : "Click the button below to pay with Razorpay:"}
//       </p>
//       <Button onClick={handlePayment} disabled={isLoading || !scriptLoaded} className="w-full">
//         {isLoading ? "Processing..." : `Pay ₹${(amount / 100).toFixed(2)}`}
//       </Button>
//     </div>
//   )
// }

// // Monthly Report Component
// function MonthlyReport({ transactions }: { transactions: Transaction[] }) {
//   const [selectedMonth, setSelectedMonth] = useState<string>(() => {
//     const now = new Date()
//     return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
//   })

//   const months = useMemo(() => {
//     const uniqueMonths = new Set<string>()
//     transactions.forEach((transaction) => {
//       const date = new Date(transaction.createdAt)
//       const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
//       uniqueMonths.add(monthYear)
//     })
//     return Array.from(uniqueMonths).sort().reverse()
//   }, [transactions])

//   const filteredTransactions = useMemo(() => {
//     return transactions.filter((transaction) => {
//       const date = new Date(transaction.createdAt)
//       const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
//       return monthYear === selectedMonth
//     })
//   }, [transactions, selectedMonth])

//   const monthlyStats = useMemo(() => {
//     const stats = {
//       deposits: 0,
//       withdrawals: 0,
//       payments: 0,
//       total: 0,
//     }

//     filteredTransactions.forEach((transaction) => {
//       if (transaction.type === "deposit") {
//         stats.deposits += transaction.amount
//         stats.total += transaction.amount
//       } else if (transaction.type === "withdrawal") {
//         stats.withdrawals += transaction.amount
//         stats.total -= transaction.amount
//       } else if (transaction.type === "payment") {
//         stats.payments += transaction.amount
//         stats.total -= transaction.amount
//       }
//     })

//     return stats
//   }, [filteredTransactions])

//   const categoryData = useMemo(() => {
//     const categories: Record<string, number> = {}
//     let total = 0

//     filteredTransactions.forEach((transaction) => {
//       if (transaction.type === "payment") {
//         const category = transaction.expense?.title || "Uncategorized"
//         categories[category] = (categories[category] || 0) + transaction.amount
//         total += transaction.amount
//       }
//     })

//     return Object.entries(categories)
//       .map(([category, amount]) => ({
//         category,
//         amount,
//         percentage: total > 0 ? (amount / total) * 100 : 0,
//       }))
//       .sort((a, b) => b.amount - a.amount)
//   }, [filteredTransactions])

//   const chartData = useMemo(() => {
//     // Group by day for the selected month
//     const dailyData: Record<string, number> = {}

//     filteredTransactions.forEach((transaction) => {
//       if (transaction.type === "payment") {
//         const date = new Date(transaction.createdAt)
//         const day = date.getDate()
//         dailyData[day] = (dailyData[day] || 0) + transaction.amount
//       }
//     })

//     // Convert to array format for chart
//     return Object.entries(dailyData).map(([day, amount]) => ({
//       name: `Day ${day}`,
//       value: amount,
//     }))
//   }, [filteredTransactions])

//   const pieChartData = useMemo(() => {
//     return categoryData.slice(0, 5).map((item) => ({
//       name: item.category,
//       value: item.amount,
//     }))
//   }, [categoryData])

//   const handleDownloadReport = () => {
//     // Format month name for the report title
//     const [year, month] = selectedMonth.split("-")
//     const monthName = new Date(Number.parseInt(year), Number.parseInt(month) - 1).toLocaleString("default", {
//       month: "long",
//     })

//     try {
//       // Generate PDF
//       const doc = generateWalletPDF(monthName, year, filteredTransactions, monthlyStats, categoryData)

//       // Save the PDF
//       doc.save(`wallet_report_${selectedMonth}.pdf`)
//     } catch (error) {
//       console.error("Error generating PDF:", error)
//     }
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4">
//         <h2 className="text-2xl font-semibold">Monthly Report</h2>

//         <div className="flex flex-wrap items-center gap-2 w-full xs:w-auto">
//           <Select value={selectedMonth} onValueChange={setSelectedMonth}>
//             <SelectTrigger className="w-[180px]">
//               <SelectValue placeholder="Select month" />
//             </SelectTrigger>
//             <SelectContent>
//               {months.map((month) => {
//                 const [year, monthNum] = month.split("-")
//                 const monthName = new Date(Number.parseInt(year), Number.parseInt(monthNum) - 1).toLocaleString(
//                   "default",
//                   {
//                     month: "long",
//                   },
//                 )
//                 return (
//                   <SelectItem key={month} value={month}>
//                     {monthName} {year}
//                   </SelectItem>
//                 )
//               })}
//             </SelectContent>
//           </Select>

//           <Button
//             variant="outline"
//             size="icon"
//             onClick={handleDownloadReport}
//             className="transition-all hover:bg-primary hover:text-primary-foreground"
//           >
//             <Download className="h-4 w-4" />
//             <span className="sr-only">Download report</span>
//           </Button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//         <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
//           <CardContent className="pt-6">
//             <div className="flex justify-between items-center">
//               <div>
//                 <p className="text-sm text-green-700">Total Deposits</p>
//                 <p className="text-2xl font-bold text-green-800">{formatCurrency(monthlyStats.deposits)}</p>
//               </div>
//               <div className="bg-green-200 p-2 rounded-full">
//                 <ArrowDownLeft className="h-5 w-5 text-green-700" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
//           <CardContent className="pt-6">
//             <div className="flex justify-between items-center">
//               <div>
//                 <p className="text-sm text-red-700">Total Expenses</p>
//                 <p className="text-2xl font-bold text-red-800">{formatCurrency(monthlyStats.payments)}</p>
//               </div>
//               <div className="bg-red-200 p-2 rounded-full">
//                 <ArrowUpRight className="h-5 w-5 text-red-700" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
//           <CardContent className="pt-6">
//             <div className="flex justify-between items-center">
//               <div>
//                 <p className="text-sm text-blue-700">Net Change</p>
//                 <p className="text-2xl font-bold text-blue-800">{formatCurrency(monthlyStats.total)}</p>
//               </div>
//               <div className="bg-blue-200 p-2 rounded-full">
//                 <BarChart3 className="h-5 w-5 text-blue-700" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-lg">Expense Breakdown</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="h-[300px]">
//               {pieChartData.length > 0 ? (
//                 <PieChart data={pieChartData} />
//               ) : (
//                 <div className="h-full flex items-center justify-center text-muted-foreground">
//                   No expense data for this month
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle className="text-lg">Daily Expenses</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="h-[300px]">
//               {chartData.length > 0 ? (
//                 <BarChart data={chartData} />
//               ) : (
//                 <div className="h-full flex items-center justify-center text-muted-foreground">
//                   No expense data for this month
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg">Top Expense Categories</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {categoryData.length > 0 ? (
//             <div className="space-y-4">
//               {categoryData.slice(0, 5).map((category, index) => (
//                 <div key={index} className="space-y-2">
//                   <div className="flex justify-between">
//                     <span className="text-sm font-medium">{category.category}</span>
//                     <span className="text-sm">{formatCurrency(category.amount)}</span>
//                   </div>
//                   <div className="w-full bg-gray-100 rounded-full h-2.5">
//                     <div className="bg-primary h-2.5 rounded-full" style={{ width: `${category.percentage}%` }}></div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="py-8 text-center text-muted-foreground">No expense data for this month</div>
//           )}
//         </CardContent>
//       </Card>

//       <Button onClick={handleDownloadReport} className="w-full">
//         <Download className="mr-2 h-4 w-4" />
//         Download Full Report
//       </Button>
//     </div>
//   )
// }

// // Declare Razorpay on window
// declare global {
//   interface Window {
//     Razorpay: any
//   }
// }

// // Main wallet page
// export default function WalletPage() {
//   const router = useRouter()
//   const { data: session, status } = useSession()
//   const { toast } = useToast()
//   const [walletData, setWalletData] = useState<WalletData | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [amount, setAmount] = useState<string>("")
//   const [addMoneyLoading, setAddMoneyLoading] = useState(false)
//   const [withdrawLoading, setWithdrawLoading] = useState(false)
//   const [isAddMoneyDialogOpen, setIsAddMoneyDialogOpen] = useState(false)
//   const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
//   const [clientSecret, setClientSecret] = useState<string | null>(null)
//   const [transactionId, setTransactionId] = useState<string | null>(null)
//   const [stripeKey, setStripeKey] = useState<string | null>(null)
//   const [paymentMethod, setPaymentMethod] = useState<"stripe" | "razorpay">("stripe")
//   const [withdrawMethod, setWithdrawMethod] = useState<"bank" | "upi" | "card">("bank")
//   const [withdrawAccountNumber, setWithdrawAccountNumber] = useState("")
//   const [withdrawAccountName, setWithdrawAccountName] = useState("")
//   const [withdrawAccountIFSC, setWithdrawAccountIFSC] = useState("")
//   const [withdrawUPI, setWithdrawUPI] = useState("")
//   const [withdrawCardNumber, setWithdrawCardNumber] = useState("")
//   const [razorpayData, setRazorpayData] = useState<any>(null)
//   const [showCustomAmount, setShowCustomAmount] = useState(false)
//   const [activeTab, setActiveTab] = useState<string>("all")
//   const [showStats, setShowStats] = useState(false)
//   const predefinedAmounts = [50, 100, 200, 500, 1000, 5000]

//   useEffect(() => {
//     if (status === "unauthenticated") {
//       router.push("/login")
//       return
//     }

//     if (status === "authenticated") {
//       fetchWalletData()
//     }
//   }, [status, router])

//   const fetchWalletData = async () => {
//     if (status !== "authenticated") return

//     try {
//       setLoading(true)
//       const response = await fetch("/api/profile/wallet")

//       if (!response.ok) {
//         if (response.status === 401) {
//           // Auth error - session might have expired
//           router.push("/login")
//           return
//         }
//         throw new Error("Failed to load wallet data")
//       }

//       const data = await response.json()
//       setWalletData(data)
//     } catch (error) {
//       console.error("Error fetching wallet data:", error)
//       toast({
//         title: "Error",
//         description: "Failed to load wallet data",
//         variant: "destructive",
//       })
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handlePredefinedAmountClick = (amt: number) => {
//     setAmount(amt.toString())
//     setShowCustomAmount(false)
//   }

//   const handleCustomAmountClick = () => {
//     setAmount("")
//     setShowCustomAmount(true)
//   }

//   const handleAddMoney = async () => {
//     // Validate input
//     if (!amount || Number.parseFloat(amount) <= 0) {
//       toast({
//         title: "Invalid amount",
//         description: "Please enter a valid amount greater than zero",
//         variant: "destructive",
//       })
//       return
//     }

//     setAddMoneyLoading(true)
//     console.log(`Initiating wallet deposit of ${amount} using ${paymentMethod}`)

//     try {
//       // Format amount correctly
//       const amountValue = Number.parseFloat(amount)

//       // Make API request
//       const response = await fetch("/api/profile/wallet", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           amount: amountValue,
//           paymentMethod: paymentMethod,
//         }),
//       })

//       // Check if response is OK
//       if (!response.ok) {
//         // Get error details from response
//         const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
//         throw new Error(errorData.error || `Failed to add money: ${response.status} ${response.statusText}`)
//       }

//       // Parse the response data
//       const data = await response.json()
//       console.log("Payment response data:", data)

//       if (data.paymentMethod === "stripe") {
//         // Validate Stripe response data
//         if (!data.clientSecret) {
//           throw new Error("Missing client secret from Stripe")
//         }
//         if (!data.transactionId) {
//           throw new Error("Missing transaction ID from Stripe")
//         }
//         if (!data.publishableKey) {
//           throw new Error("Missing publishable key from Stripe")
//         }

//         // Initialize Stripe
//         if (!stripePromise && data.publishableKey) {
//           stripePromise = loadStripe(data.publishableKey)
//         }

//         // Save data for Stripe Elements
//         setClientSecret(data.clientSecret)
//         setTransactionId(data.transactionId)
//         setStripeKey(data.publishableKey)
//         setRazorpayData(null)
//       } else if (data.paymentMethod === "razorpay") {
//         // Validate Razorpay response data
//         if (!data.orderId) {
//           throw new Error("Missing order ID from Razorpay")
//         }
//         if (!data.transactionId) {
//           throw new Error("Missing transaction ID from Razorpay")
//         }
//         if (!data.keyId) {
//           throw new Error("Missing key ID from Razorpay")
//         }

//         // Save data for Razorpay
//         setRazorpayData({
//           orderId: data.orderId,
//           amount: data.amount,
//           keyId: data.keyId,
//           transactionId: data.transactionId,
//           prefill: data.prefill || {},
//         })
//         setTransactionId(data.transactionId)
//         setClientSecret(null)
//       } else {
//         throw new Error(`Invalid payment method returned from server: ${data.paymentMethod}`)
//       }

//       // Payment initialization successful
//       setAddMoneyLoading(false)
//     } catch (error: any) {
//       console.error("Payment initialization error:", error)

//       // Show error toast
//       toast({
//         title: "Payment Error",
//         description: error.message || "Failed to process payment request. Please try again.",
//         variant: "destructive",
//       })

//       // Reset state
//       setAddMoneyLoading(false)
//       return
//     }
//   }

//   const handleWithdrawMoney = async () => {
//     // Validate input
//     if (!amount || Number.parseFloat(amount) <= 0) {
//       toast({
//         title: "Invalid amount",
//         description: "Please enter a valid amount greater than zero",
//         variant: "destructive",
//       })
//       return
//     }

//     // Check if wallet has sufficient balance
//     if (walletData && Number.parseFloat(amount) > walletData.wallet.balance) {
//       toast({
//         title: "Insufficient balance",
//         description: `Your current balance is ${formatCurrency(walletData.wallet.balance)}, which is less than the requested withdrawal amount`,
//         variant: "destructive",
//       })
//       return
//     }

//     // Validate account details based on withdrawal method
//     if (withdrawMethod === "bank") {
//       if (!withdrawAccountNumber || !withdrawAccountName || !withdrawAccountIFSC) {
//         toast({
//           title: "Missing account details",
//           description: "Please fill in all bank account fields",
//           variant: "destructive",
//         })
//         return
//       }
//     } else if (withdrawMethod === "upi") {
//       if (!withdrawUPI) {
//         toast({
//           title: "Missing UPI ID",
//           description: "Please enter your UPI ID",
//           variant: "destructive",
//         })
//         return
//       }
//     } else if (withdrawMethod === "card") {
//       if (!withdrawCardNumber) {
//         toast({
//           title: "Missing card details",
//           description: "Please enter your card number",
//           variant: "destructive",
//         })
//         return
//       }
//     }

//     setWithdrawLoading(true)
//     console.log(`Initiating wallet withdrawal of ${amount} using ${withdrawMethod}`)

//     try {
//       // Prepare account details based on withdrawal method
//       let accountDetails = {}

//       if (withdrawMethod === "bank") {
//         accountDetails = {
//           type: "bank",
//           accountNumber: withdrawAccountNumber,
//           accountName: withdrawAccountName,
//           ifsc: withdrawAccountIFSC,
//         }
//       } else if (withdrawMethod === "upi") {
//         accountDetails = {
//           type: "upi",
//           upiId: withdrawUPI,
//         }
//       } else if (withdrawMethod === "card") {
//         accountDetails = {
//           type: "card",
//           cardNumber: withdrawCardNumber.replace(/\s+/g, "").slice(-4), // Only store last 4 digits for security
//         }
//       }

//       // Format amount correctly
//       const amountValue = Number.parseFloat(amount)

//       // Make API request
//       const response = await fetch("/api/profile/wallet/withdraw", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           amount: amountValue,
//           accountDetails,
//         }),
//       })

//       // Check if response is OK
//       if (!response.ok) {
//         // Get error details from response
//         const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
//         throw new Error(errorData.error || `Failed to process withdrawal: ${response.status} ${response.statusText}`)
//       }

//       // Parse the response data
//       const data = await response.json()
//       console.log("Withdrawal response data:", data)

//       // Show success message
//       toast({
//         title: "Withdrawal requested",
//         description: `Your withdrawal of ${formatCurrency(amountValue)} has been requested and is being processed.`,
//       })

//       // Reset state and close dialog
//       setAmount("")
//       setWithdrawMethod("bank")
//       setWithdrawAccountNumber("")
//       setWithdrawAccountName("")
//       setWithdrawAccountIFSC("")
//       setWithdrawUPI("")
//       setWithdrawCardNumber("")
//       setIsWithdrawDialogOpen(false)

//       // Refresh wallet data
//       fetchWalletData()
//     } catch (error: any) {
//       console.error("Withdrawal error:", error)

//       // Show error toast
//       toast({
//         title: "Withdrawal Error",
//         description: error.message || "Failed to process withdrawal. Please try again.",
//         variant: "destructive",
//       })
//     } finally {
//       setWithdrawLoading(false)
//     }
//   }

//   const handlePaymentSuccess = () => {
//     // Close dialog
//     setIsAddMoneyDialogOpen(false)

//     // Reset states
//     setClientSecret(null)
//     setTransactionId(null)
//     setRazorpayData(null)
//     setAmount("")
//     setAddMoneyLoading(false)

//     // Refresh wallet data
//     fetchWalletData()
//   }

//   const getTransactionIcon = (type: string) => {
//     switch (type) {
//       case "payment":
//         return <CreditCard className="w-5 h-5 text-blue-500" />
//       case "withdrawal":
//         return <ArrowUpRight className="w-5 h-5 text-red-500" />
//       case "deposit":
//         return <ArrowDownLeft className="w-5 h-5 text-green-500" />
//       case "transfer":
//         return <ArrowUpRight className="w-5 h-5 text-yellow-500" />
//       default:
//         return <Wallet className="w-5 h-5 text-gray-500" />
//     }
//   }

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case "completed":
//         return <CheckCircle className="w-4 h-4 text-green-500" />
//       case "pending":
//         return <Clock className="w-4 h-4 text-yellow-500" />
//       case "failed":
//         return <XCircle className="w-4 h-4 text-red-500" />
//       default:
//         return null
//     }
//   }

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "completed":
//         return (
//           <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
//             Completed
//           </Badge>
//         )
//       case "pending":
//         return (
//           <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
//             Pending
//           </Badge>
//         )
//       case "failed":
//         return (
//           <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
//             Failed
//           </Badge>
//         )
//       default:
//         return null
//     }
//   }

//   const debugStripeAPI = async () => {
//     const result = await testWalletAPI()
//     console.log("Stripe API Test Result:", result)

//     if (result.success && result.stripe) {
//       toast({
//         title: "Stripe API Test Successful",
//         description: `Transaction ID: ${result.stripe.transactionId}`,
//       })

//       // Set up Stripe payment with the response
//       if (result.stripe.clientSecret && result.stripe.transactionId && result.stripe.publishableKey) {
//         if (!stripePromise) {
//           stripePromise = loadStripe(result.stripe.publishableKey)
//         }
//         setClientSecret(result.stripe.clientSecret)
//         setTransactionId(result.stripe.transactionId)
//         setStripeKey(result.stripe.publishableKey)
//         setRazorpayData(null)
//         setAmount("100") // Fixed test amount
//         setIsAddMoneyDialogOpen(true)
//       }
//     } else {
//       toast({
//         title: "Stripe API Test Failed",
//         description: result.error || "Unknown error",
//         variant: "destructive",
//       })
//     }
//   }

//   const debugRazorpayAPI = async () => {
//     const result = await testRazorpayAPI()
//     console.log("Razorpay API Test Result:", result)

//     if (result.success && result.razorpay) {
//       toast({
//         title: "Razorpay API Test Successful",
//         description: `Transaction ID: ${result.razorpay.transactionId}`,
//       })

//       // Set up Razorpay payment with the response
//       if (result.razorpay.orderId && result.razorpay.transactionId && result.razorpay.keyId) {
//         setRazorpayData({
//           orderId: result.razorpay.orderId,
//           amount: result.razorpay.amount,
//           keyId: result.razorpay.keyId,
//           transactionId: result.razorpay.transactionId,
//           prefill: result.razorpay.prefill || {},
//         })
//         setTransactionId(result.razorpay.transactionId)
//         setClientSecret(null)
//         setAmount("100") // Fixed test amount
//         setIsAddMoneyDialogOpen(true)
//       }
//     } else {
//       toast({
//         title: "Razorpay API Test Failed",
//         description: result.error || "Unknown error",
//         variant: "destructive",
//       })
//     }
//   }

//   if (status === "unauthenticated") {
//     return (
//       <div className="container px-4 py-8 mx-auto">
//         <div className="max-w-md p-8 mx-auto text-center bg-white rounded-lg shadow">
//           <LogIn className="w-12 h-12 mx-auto mb-4 text-gray-400" />
//           <h3 className="mb-2 text-xl font-semibold">Authentication Required</h3>
//           <p className="mb-6 text-gray-600">Please log in to access your wallet.</p>
//           <Button onClick={() => router.push("/login")}>Go to Login</Button>
//         </div>
//       </div>
//     )
//   }

//   if (loading) {
//     return (
//       <div className="container px-4 py-8 mx-auto">
//         <div className="max-w-3xl mx-auto">
//           <div className="mb-6">
//             <Skeleton className="w-1/3 h-10 mb-2" />
//           </div>

//           <Skeleton className="w-full h-[200px] mb-6" />

//           <div className="space-y-4">
//             {[1, 2, 3].map((i) => (
//               <Skeleton key={i} className="w-full h-20" />
//             ))}
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="container px-3 sm:px-4 py-6 sm:py-8 mx-auto">
//       <div className="max-w-4xl mx-auto">
//         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
//           <motion.h1
//             className="text-3xl font-bold"
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//           >
//             Wallet
//           </motion.h1>
//           <div className="flex flex-wrap gap-2">
//             {/* Add Money Dialog */}
//             <Dialog open={isAddMoneyDialogOpen} onOpenChange={setIsAddMoneyDialogOpen}>
//               <DialogTrigger asChild>
//                 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//                   <Button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md">
//                     <PlusCircle className="w-4 h-4" />
//                     Add Money
//                   </Button>
//                 </motion.div>
//               </DialogTrigger>
//               <DialogContent className="sm:max-w-md">
//                 {!clientSecret && !razorpayData ? (
//                   // Step 1: Enter Amount Form
//                   <>
//                     <DialogHeader>
//                       <DialogTitle>Add Money to Wallet</DialogTitle>
//                       <DialogDescription>
//                         Select an amount or enter a custom amount to add to your wallet.
//                       </DialogDescription>
//                     </DialogHeader>
//                     <div className="grid gap-6 py-4">
//                       {/* Predefined amount options */}
//                       <div>
//                         <Label className="block mb-2">Select Amount</Label>
//                         <div className="grid grid-cols-3 gap-2">
//                           {predefinedAmounts.map((amt) => (
//                             <Button
//                               key={amt}
//                               variant={amount === amt.toString() && !showCustomAmount ? "default" : "outline"}
//                               onClick={() => handlePredefinedAmountClick(amt)}
//                               className="w-full transition-all duration-200 hover:bg-primary/90 hover:scale-105"
//                             >
//                               ${amt}
//                             </Button>
//                           ))}
//                           <Button
//                             variant={showCustomAmount ? "default" : "outline"}
//                             onClick={handleCustomAmountClick}
//                             className="w-full transition-all duration-200 hover:bg-primary/90 hover:scale-105"
//                           >
//                             Custom
//                           </Button>
//                         </div>
//                       </div>

//                       {/* Custom amount input */}
//                       {showCustomAmount && (
//                         <div className="grid items-center grid-cols-4 gap-4">
//                           <Label htmlFor="amount" className="text-right">
//                             Custom Amount
//                           </Label>
//                           <div className="relative col-span-3">
//                             <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
//                             <Input
//                               id="amount"
//                               value={amount}
//                               onChange={(e) => setAmount(e.target.value)}
//                               className="pl-8"
//                               placeholder="Enter amount"
//                               type="number"
//                               min="1"
//                               autoFocus
//                             />
//                           </div>
//                         </div>
//                       )}

//                       {/* Payment Method Selection */}
//                       <div className="grid items-center grid-cols-4 gap-4">
//                         <Label className="text-right">Payment Method</Label>
//                         <div className="col-span-3">
//                           <RadioGroup
//                             value={paymentMethod}
//                             onValueChange={(value) => setPaymentMethod(value as "stripe" | "razorpay")}
//                             className="flex flex-col space-y-2"
//                           >
//                             <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 transition-colors">
//                               <RadioGroupItem value="stripe" id="stripe" />
//                               <Label htmlFor="stripe" className="flex items-center">
//                                 <span className="mr-2">Stripe (Credit/Debit Card)</span>
//                                 <CreditCard className="w-4 h-4 text-blue-500" />
//                               </Label>
//                             </div>
//                             <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 transition-colors">
//                               <RadioGroupItem value="razorpay" id="razorpay" />
//                               <Label htmlFor="razorpay" className="flex items-center">
//                                 <span className="mr-2">Razorpay (UPI/Wallet/Cards)</span>
//                                 <Wallet className="w-4 h-4 text-green-500" />
//                               </Label>
//                             </div>
//                           </RadioGroup>
//                         </div>
//                       </div>
//                     </div>
//                     <DialogFooter>
//                       <Button
//                         onClick={handleAddMoney}
//                         disabled={addMoneyLoading || !amount || Number.parseFloat(amount) <= 0}
//                         className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
//                       >
//                         {addMoneyLoading ? "Processing..." : "Continue to Payment"}
//                       </Button>
//                     </DialogFooter>
//                   </>
//                 ) : clientSecret ? (
//                   // Step 2A: Stripe Payment Form
//                   <>
//                     <DialogHeader>
//                       <DialogTitle>Complete Payment with Stripe</DialogTitle>
//                       <DialogDescription>
//                         Please enter your payment details to add {amount && `$${Number.parseFloat(amount).toFixed(2)}`}{" "}
//                         to your wallet.
//                       </DialogDescription>
//                     </DialogHeader>
//                     <div className="py-4">
//                       {stripePromise && clientSecret && (
//                         <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
//                           <CheckoutForm
//                             amount={Number.parseFloat(amount)}
//                             transactionId={transactionId!}
//                             onSuccess={handlePaymentSuccess}
//                           />
//                         </Elements>
//                       )}
//                     </div>
//                   </>
//                 ) : razorpayData ? (
//                   // Step 2B: Razorpay Payment Form
//                   <>
//                     <DialogHeader>
//                       <DialogTitle>Complete Payment with Razorpay</DialogTitle>
//                       <DialogDescription>
//                         Please complete the payment to add {amount && `$${Number.parseFloat(amount).toFixed(2)}`} to
//                         your wallet.
//                       </DialogDescription>
//                     </DialogHeader>
//                     <RazorpayCheckout
//                       amount={razorpayData.amount}
//                       transactionId={razorpayData.transactionId}
//                       orderId={razorpayData.orderId}
//                       keyId={razorpayData.keyId}
//                       prefill={razorpayData.prefill}
//                       onSuccess={handlePaymentSuccess}
//                     />
//                   </>
//                 ) : null}
//               </DialogContent>
//             </Dialog>

//             {/* Withdraw Money Dialog */}
//             <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
//               <DialogTrigger asChild>
//                 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//                   <Button className="flex items-center gap-2" variant="outline">
//                     <ArrowDownIcon className="w-4 h-4" />
//                     Withdraw
//                   </Button>
//                 </motion.div>
//               </DialogTrigger>
//               <DialogContent className="sm:max-w-md">
//                 <DialogHeader>
//                   <DialogTitle>Withdraw Money</DialogTitle>
//                   <DialogDescription>
//                     Enter the amount and account details to withdraw from your wallet.
//                   </DialogDescription>
//                 </DialogHeader>
//                 <div className="grid gap-6 py-4">
//                   {/* Withdraw amount */}
//                   <div className="grid grid-cols-4 gap-4">
//                     <Label htmlFor="withdraw-amount" className="text-right">
//                       Amount
//                     </Label>
//                     <div className="relative col-span-3">
//                       <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
//                       <Input
//                         id="withdraw-amount"
//                         value={amount}
//                         onChange={(e) => setAmount(e.target.value)}
//                         className="pl-8"
//                         placeholder="Enter amount"
//                         type="number"
//                         min="1"
//                         max={walletData?.wallet.balance.toString() || "0"}
//                       />
//                     </div>
//                   </div>

//                   {/* Warning for big withdrawal */}
//                   {amount && Number.parseFloat(amount) > 1000 && (
//                     <div className="flex p-3 text-sm border rounded-md bg-amber-50 border-amber-200 text-amber-800">
//                       <AlertCircle className="w-4 h-4 mr-2" />
//                       <p>Larger withdrawals may take 1-3 business days to process.</p>
//                     </div>
//                   )}

//                   {/* Withdrawal method selection */}
//                   <div>
//                     <Label className="block mb-3">Withdrawal Method</Label>
//                     <RadioGroup
//                       value={withdrawMethod}
//                       onValueChange={(value) => setWithdrawMethod(value as "bank" | "upi" | "card")}
//                       className="flex flex-col space-y-3"
//                     >
//                       <div className="flex items-center p-3 space-x-2 border rounded-md hover:bg-gray-50 transition-colors">
//                         <RadioGroupItem value="bank" id="bank" />
//                         <Label htmlFor="bank" className="flex items-center">
//                           <PiggyBank className="w-4 h-4 mr-2 text-blue-600" />
//                           <span>Bank Transfer</span>
//                         </Label>
//                       </div>
//                       <div className="flex items-center p-3 space-x-2 border rounded-md hover:bg-gray-50 transition-colors">
//                         <RadioGroupItem value="upi" id="upi" />
//                         <Label htmlFor="upi" className="flex items-center">
//                           <SmartphoneIcon className="w-4 h-4 mr-2 text-green-600" />
//                           <span>UPI</span>
//                         </Label>
//                       </div>
//                       <div className="flex items-center p-3 space-x-2 border rounded-md hover:bg-gray-50 transition-colors">
//                         <RadioGroupItem value="card" id="card" />
//                         <Label htmlFor="card" className="flex items-center">
//                           <CreditCardIcon className="w-4 h-4 mr-2 text-purple-600" />
//                           <span>Credit/Debit Card</span>
//                         </Label>
//                       </div>
//                     </RadioGroup>
//                   </div>

//                   {/* Account details based on selected method */}
//                   {withdrawMethod === "bank" && (
//                     <div className="space-y-4">
//                       <div className="grid items-center grid-cols-4 gap-4">
//                         <Label htmlFor="account-name" className="text-right">
//                           Account Name
//                         </Label>
//                         <div className="col-span-3">
//                           <Input
//                             id="account-name"
//                             value={withdrawAccountName}
//                             onChange={(e) => setWithdrawAccountName(e.target.value)}
//                             placeholder="Enter account holder name"
//                           />
//                         </div>
//                       </div>
//                       <div className="grid items-center grid-cols-4 gap-4">
//                         <Label htmlFor="account-number" className="text-right">
//                           Account Number
//                         </Label>
//                         <div className="col-span-3">
//                           <Input
//                             id="account-number"
//                             value={withdrawAccountNumber}
//                             onChange={(e) => setWithdrawAccountNumber(e.target.value)}
//                             placeholder="Enter account number"
//                           />
//                         </div>
//                       </div>
//                       <div className="grid items-center grid-cols-4 gap-4">
//                         <Label htmlFor="account-ifsc" className="text-right">
//                           IFSC Code
//                         </Label>
//                         <div className="col-span-3">
//                           <Input
//                             id="account-ifsc"
//                             value={withdrawAccountIFSC}
//                             onChange={(e) => setWithdrawAccountIFSC(e.target.value)}
//                             placeholder="Enter IFSC code"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {withdrawMethod === "upi" && (
//                     <div className="grid items-center grid-cols-4 gap-4">
//                       <Label htmlFor="upi-id" className="text-right">
//                         UPI ID
//                       </Label>
//                       <div className="col-span-3">
//                         <Input
//                           id="upi-id"
//                           value={withdrawUPI}
//                           onChange={(e) => setWithdrawUPI(e.target.value)}
//                           placeholder="name@ybl or name@upi"
//                         />
//                       </div>
//                     </div>
//                   )}

//                   {withdrawMethod === "card" && (
//                     <div className="grid items-center grid-cols-4 gap-4">
//                       <Label htmlFor="card-number" className="text-right">
//                         Card Number
//                       </Label>
//                       <div className="col-span-3">
//                         <Input
//                           id="card-number"
//                           value={withdrawCardNumber}
//                           onChange={(e) => setWithdrawCardNumber(e.target.value)}
//                           placeholder="XXXX XXXX XXXX XXXX"
//                         />
//                       </div>
//                     </div>
//                   )}
//                 </div>
//                 <DialogFooter>
//                   <Button
//                     onClick={handleWithdrawMoney}
//                     disabled={
//                       withdrawLoading ||
//                       !amount ||
//                       Number.parseFloat(amount) <= 0 ||
//                       (!!walletData && Number.parseFloat(amount) > walletData.wallet.balance)
//                     }
//                   >
//                     {withdrawLoading ? "Processing..." : "Withdraw"}
//                   </Button>
//                 </DialogFooter>
//               </DialogContent>
//             </Dialog>

//             {/* Stats Toggle Button */}
//             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//               <Button
//                 variant={showStats ? "default" : "outline"}
//                 onClick={() => setShowStats(!showStats)}
//                 className="flex items-center gap-2"
//               >
//                 <BarChart3 className="w-4 h-4" />
//                 {showStats ? "Hide Stats" : "Show Stats"}
//               </Button>
//             </motion.div>
//           </div>
//         </div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.1 }}
//         >
//           <Card className="mb-8 overflow-hidden">
//             <CardContent className="p-0">
//               <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 sm:p-6 text-white">
//                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//                   <div>
//                     <p className="text-sm text-white/80">Current Balance</p>
//                     <h2 className="text-3xl sm:text-4xl font-bold">
//                       {formatCurrency(walletData?.wallet.balance || 0)}
//                     </h2>
//                   </div>
//                   <div className="bg-white/20 p-3 sm:p-4 rounded-full">
//                     <Wallet className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
//                   <Button
//                     className="flex items-center justify-center gap-2 border-white text-white hover:bg-green/50"
//                     onClick={() => setIsAddMoneyDialogOpen(true)}
//                   >
//                     <PlusCircle className="w-4 h-4" />
//                     Add Money
//                   </Button>
//                   <Button
//                     // variant="outline"
//                     className="flex items-center justify-center gap-2 border-white text-white hover:bg-purple/50"
//                     onClick={() => setIsWithdrawDialogOpen(true)}
//                     disabled={!walletData || walletData.wallet.balance <= 0}
//                   >
//                     <ArrowDownIcon className="w-4 h-4" />
//                     Withdraw
//                   </Button>
//                   {/* Stats Toggle Button */}
//                   {/* <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}> */}
//                   <Button
//                     // variant={showStats ? "default" : "outline"}
//                     onClick={() => setShowStats(!showStats)}
//                     className="flex items-center justify-center gap-2 border-white text-white hover:bg-purple/50"
//                   >
//                     <BarChart3 className="w-4 h-4" />
//                     {showStats ? "Hide Stats" : "Show Stats"}
//                   </Button>
//                   {/* </motion.div> */}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>

//         <AnimatePresence>
//           {showStats && (
//             <motion.div
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: "auto" }}
//               exit={{ opacity: 0, height: 0 }}
//               transition={{ duration: 0.3 }}
//               className="overflow-hidden mb-8"
//             >
//               <MonthlyReport transactions={walletData?.transactions || []} />
//             </motion.div>
//           )}
//         </AnimatePresence>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.2 }}
//         >
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
//             <h2 className="text-2xl font-semibold">Transaction History</h2>
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant="outline" size="sm" className="flex items-center gap-1">
//                   <Filter className="h-4 w-4" />
//                   <span>Filter</span>
//                   <ChevronDown className="h-4 w-4 ml-1" />
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end">
//                 <DropdownMenuItem onClick={() => setActiveTab("all")}>All Transactions</DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => setActiveTab("payments")}>Payments</DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => setActiveTab("withdrawals")}>Withdrawals</DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => setActiveTab("deposits")}>Deposits</DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>

//           <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
//             <div className="overflow-x-auto pb-2">
//               <TabsList className="mb-4 w-full sm:w-auto">
//                 <TabsTrigger value="all" className="transition-all">
//                   All
//                 </TabsTrigger>
//                 <TabsTrigger value="payments" className="transition-all">
//                   Payments
//                 </TabsTrigger>
//                 <TabsTrigger value="withdrawals" className="transition-all">
//                   Withdrawals
//                 </TabsTrigger>
//                 <TabsTrigger value="deposits" className="transition-all">
//                   Deposits
//                 </TabsTrigger>
//               </TabsList>
//             </div>

//             <TabsContent value="all">{renderTransactions(walletData?.transactions || [])}</TabsContent>

//             <TabsContent value="payments">
//               {renderTransactions((walletData?.transactions || []).filter((t) => t.type === "payment"))}
//             </TabsContent>

//             <TabsContent value="withdrawals">
//               {renderTransactions((walletData?.transactions || []).filter((t) => t.type === "withdrawal"))}
//             </TabsContent>

//             <TabsContent value="deposits">
//               {renderTransactions((walletData?.transactions || []).filter((t) => t.type === "deposit"))}
//             </TabsContent>
//           </Tabs>
//         </motion.div>
//       </div>
//     </div>
//   )

//   function renderTransactions(transactions: Transaction[]) {
//     if (transactions.length === 0) {
//       return (
//         <Card>
//           <CardContent className="flex flex-col items-center justify-center p-6 text-center">
//             <Wallet className="w-12 h-12 mb-4 text-gray-400" />
//             <h3 className="mb-2 text-xl font-semibold">No transactions</h3>
//             <p className="text-gray-600">You don't have any transactions in this category.</p>
//           </CardContent>
//         </Card>
//       )
//     }

//     return (
//       <div className="space-y-4">
//         <AnimatePresence>
//           {transactions.map((transaction, index) => (
//             <motion.div
//               key={transaction._id}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               transition={{ duration: 0.3, delay: index * 0.05 }}
//             >
//               <Card
//                 className="overflow-hidden hover:shadow-md transition-all duration-300 border-l-4"
//                 style={{
//                   borderLeftColor:
//                     transaction.type === "deposit"
//                       ? "#10b981"
//                       : transaction.type === "withdrawal" || transaction.type === "payment"
//                         ? "#ef4444"
//                         : "#6366f1",
//                 }}
//               >
//                 <CardContent className="p-3 sm:p-4">
//                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
//                     <div
//                       className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 sm:mr-4 rounded-full"
//                       style={{
//                         background:
//                           transaction.type === "deposit"
//                             ? "linear-gradient(135deg, #dcfce7, #10b981)"
//                             : transaction.type === "withdrawal" || transaction.type === "payment"
//                               ? "linear-gradient(135deg, #fee2e2, #ef4444)"
//                               : "linear-gradient(135deg, #e0e7ff, #6366f1)",
//                       }}
//                     >
//                       {getTransactionIcon(transaction.type)}
//                     </div>
//                     <div className="flex-1">
//                       <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
//                         <h3 className="font-medium truncate">{transaction.description}</h3>
//                         <div className="sm:ml-auto">{getStatusBadge(transaction.status)}</div>
//                       </div>
//                       <div className="flex flex-wrap items-center text-sm text-gray-600">
//                         <span>{formatDate(transaction.createdAt)}</span>
//                         {transaction.trip && (
//                           <>
//                             <span className="mx-1">•</span>
//                             <span className="truncate">Trip: {transaction.trip.name}</span>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                     <div className="text-right mt-2 sm:mt-0">
//                       <div
//                         className={`text-lg font-semibold ${transaction.type === "deposit"
//                           ? "text-green-600"
//                           : transaction.type === "withdrawal" || transaction.type === "payment"
//                             ? "text-red-600"
//                             : ""
//                           }`}
//                       >
//                         {transaction.type === "deposit"
//                           ? "+"
//                           : transaction.type === "withdrawal" || transaction.type === "payment"
//                             ? "-"
//                             : ""}
//                         {formatCurrency(transaction.amount)}
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           ))}
//         </AnimatePresence>
//       </div>
//     )
//   }
// }

// Import SessionProvider at the top
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

  const fetchWalletData = async () => {
    if (status !== "authenticated") return

    try {
      setLoading(true)
      const response = await fetch("/api/profile/wallet")

      if (!response.ok) {
        if (response.status === 401) {
          // Auth error - session might have expired
          router.push("/login")
          return
        }
        throw new Error("Failed to load wallet data")
      }

      const data = await response.json()
      setWalletData(data)
    } catch (error) {
      console.error("Error fetching wallet data:", error)
      toast({
        title: "Error",
        description: "Failed to load wallet data",
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
            onAddMoney={() => setIsAddMoneyDialogOpen(true)}
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
