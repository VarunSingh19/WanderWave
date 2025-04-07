"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Wallet, ArrowUpRight, CheckCircle } from "lucide-react"

interface Trip {
  _id: string
  name: string
  wallet: {
    balance: number
    pendingWithdrawal: boolean
    withdrawalApprovals: string[]
  }
  members: {
    user: {
      _id: string
      name: string
      email: string
      profileImage?: string
    }
    role: string
    status: string
  }[]
}

export default function TripWalletPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0)
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false)
  const tripId = params.id as string

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }

    if (status === "authenticated") {
      fetchTrip()
    }
  }, [status, router, tripId])

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`)
      const data = await response.json()

      if (response.ok) {
        setTrip(data.trip)
      } else {
        router.push("/trips")
      }
    } catch (error) {
      console.error("Error fetching trip:", error)
      router.push("/trips")
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!trip) return

    setIsProcessingWithdrawal(true)

    try {
      if (withdrawAmount <= 0 || withdrawAmount > trip.wallet.balance) {
        throw new Error(`Amount must be between 1 and ${trip.wallet.balance}`)
      }

      const response = await fetch(`/api/trips/${tripId}/wallet/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: withdrawAmount }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to initiate withdrawal")
      }

      toast({
        title: "Withdrawal initiated",
        description: "Waiting for member approvals",
      })

      setIsWithdrawDialogOpen(false)
      fetchTrip()
    } catch (error: any) {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsProcessingWithdrawal(false)
    }
  }

  const handleApproveWithdrawal = async () => {
    if (!trip) return

    try {
      const response = await fetch(`/api/trips/${tripId}/wallet/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to approve withdrawal")
      }

      toast({
        title: "Withdrawal approved",
        description: result.allApproved
          ? "All members have approved. Withdrawal completed."
          : "Your approval has been recorded.",
      })

      fetchTrip()
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="mb-6">
          <Skeleton className="w-1/3 h-10 mb-2" />
          <Skeleton className="w-1/2 h-6" />
        </div>

        <Skeleton className="w-full h-[300px] mb-6" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="p-8 text-center bg-white rounded-lg shadow">
          <h3 className="mb-2 text-xl font-semibold">Trip not found</h3>
          <p className="mb-4 text-gray-600">
            The trip you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/trips")}>Back to Trips</Button>
        </div>
      </div>
    )
  }

  const isAuthor = trip.members.some((member) => member.user._id === session?.user.id && member.role === "author")

  const hasApproved = trip.wallet.withdrawalApprovals.includes(session?.user.id || "")

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/trips/${tripId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trip
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{trip.name} - Wallet</h1>
        <p className="mt-2 text-gray-600">Manage trip funds and withdrawals</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trip Wallet</CardTitle>
            <CardDescription>Current balance and withdrawal options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <h2 className="text-3xl font-bold">{formatCurrency(trip.wallet.balance)}</h2>
              </div>
              <Wallet className="w-12 h-12 text-primary" />
            </div>

            {isAuthor && trip.wallet.balance > 0 && !trip.wallet.pendingWithdrawal && (
              <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Withdraw Funds
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                      Enter the amount you want to withdraw from the trip wallet. All trip members must approve the
                      withdrawal.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="mb-4">
                      <p className="mb-2 text-sm font-medium">Available Balance</p>
                      <p className="text-xl font-bold">{formatCurrency(trip.wallet.balance)}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Withdrawal Amount</p>
                      <Input
                        type="number"
                        min="1"
                        max={trip.wallet.balance}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(Number.parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleWithdraw} disabled={isProcessingWithdrawal}>
                      {isProcessingWithdrawal ? "Processing..." : "Initiate Withdrawal"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>

        {trip.wallet.pendingWithdrawal && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Withdrawal</CardTitle>
              <CardDescription>Approval status for current withdrawal request</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Status</p>
                <Badge className="mt-1">Pending Approval</Badge>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">Approvals</p>
                <div className="flex items-center mt-1">
                  <p className="font-medium">
                    {trip.wallet.withdrawalApprovals.length} of{" "}
                    {trip.members.filter((m) => m.status === "accepted").length} members
                  </p>
                </div>
              </div>

              {!hasApproved && (
                <Button onClick={handleApproveWithdrawal} className="w-full">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Withdrawal
                </Button>
              )}

              {hasApproved && (
                <div className="p-3 text-center bg-gray-100 rounded-md">
                  <p className="text-sm text-gray-600">You have approved this withdrawal</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

