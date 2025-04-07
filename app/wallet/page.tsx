"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Clock, CheckCircle, XCircle } from "lucide-react"

interface Transaction {
  _id: string
  type: string
  amount: number
  status: string
  description: string
  createdAt: string
  trip?: {
    _id: string
    name: string
  }
  expense?: {
    _id: string
    title: string
  }
}

interface WalletData {
  wallet: {
    balance: number
  }
  transactions: Transaction[]
}

export default function WalletPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }

    if (status === "authenticated") {
      fetchWalletData()
    }
  }, [status, router])

  const fetchWalletData = async () => {
    try {
      const response = await fetch("/api/profile/wallet")
      const data = await response.json()

      if (response.ok) {
        setWalletData(data)
      }
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <CreditCard className="w-5 h-5 text-blue-500" />
      case "withdrawal":
        return <ArrowUpRight className="w-5 h-5 text-red-500" />
      case "deposit":
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />
      case "transfer":
        return <ArrowUpRight className="w-5 h-5 text-yellow-500" />
      default:
        return <Wallet className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Skeleton className="w-1/3 h-10 mb-2" />
          </div>

          <Skeleton className="w-full h-[200px] mb-6" />

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-20" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Wallet</h1>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <h2 className="text-3xl font-bold">{formatCurrency(walletData?.wallet.balance || 0)}</h2>
              </div>
              <Wallet className="w-12 h-12 text-primary" />
            </div>
          </CardContent>
        </Card>

        <h2 className="mb-4 text-2xl font-semibold">Transaction History</h2>

        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
          </TabsList>

          <TabsContent value="all">{renderTransactions(walletData?.transactions || [])}</TabsContent>

          <TabsContent value="payments">
            {renderTransactions((walletData?.transactions || []).filter((t) => t.type === "payment"))}
          </TabsContent>

          <TabsContent value="withdrawals">
            {renderTransactions((walletData?.transactions || []).filter((t) => t.type === "withdrawal"))}
          </TabsContent>

          <TabsContent value="deposits">
            {renderTransactions((walletData?.transactions || []).filter((t) => t.type === "deposit"))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )

  function renderTransactions(transactions: Transaction[]) {
    if (transactions.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Wallet className="w-12 h-12 mb-4 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold">No transactions</h3>
            <p className="text-gray-600">You don't have any transactions in this category.</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction._id}>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 mr-4 bg-gray-100 rounded-full">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium">{transaction.description}</h3>
                    <div className="ml-2">{getStatusBadge(transaction.status)}</div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span>{formatDate(transaction.createdAt)}</span>
                    {transaction.trip && (
                      <>
                        <span className="mx-1">•</span>
                        <span>Trip: {transaction.trip.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-semibold ${
                      transaction.type === "deposit"
                        ? "text-green-600"
                        : transaction.type === "withdrawal" || transaction.type === "payment"
                          ? "text-red-600"
                          : ""
                    }`}
                  >
                    {transaction.type === "deposit"
                      ? "+"
                      : transaction.type === "withdrawal" || transaction.type === "payment"
                        ? "-"
                        : ""}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
}

