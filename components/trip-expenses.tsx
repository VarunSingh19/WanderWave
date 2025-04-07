"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { formatCurrency, formatDate } from "@/lib/utils"
import { PlusCircle, DollarSign, Receipt, CreditCard } from "lucide-react"

interface Expense {
  _id: string
  title: string
  description?: string
  amount: number
  date: string
  addedBy: {
    _id: string
    name: string
    email: string
    profileImage?: string
  }
  shares: {
    user: {
      _id: string
      name: string
      email: string
      profileImage?: string
    }
    amount: number
    amountPaid: number
    status: string
  }[]
}

interface Member {
  user: {
    _id: string
    name: string
    email: string
    profileImage?: string
  }
  role: string
  status: string
}

interface TripExpensesProps {
  tripId: string
  expenses: Expense[]
  members: Member[]
  onUpdate: () => void
}

const expenseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export default function TripExpenses({ tripId, expenses, members, onUpdate }: TripExpensesProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: 0,
    },
  })

  const handleAddExpense = async (data: ExpenseFormValues) => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to add expense")
      }

      toast({
        title: "Expense added",
        description: "The expense has been added successfully",
      })

      form.reset()
      setIsDialogOpen(false)
      onUpdate()
    } catch (error: any) {
      toast({
        title: "Failed to add expense",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePayExpense = async () => {
    if (!selectedExpense) return

    setIsProcessingPayment(true)

    try {
      // Find user's share
      const userShare = selectedExpense.shares.find((share) => share.user._id === session?.user.id)

      if (!userShare) {
        throw new Error("You don't have a share in this expense")
      }

      const remainingAmount = userShare.amount - userShare.amountPaid

      if (paymentAmount <= 0 || paymentAmount > remainingAmount) {
        throw new Error(`Amount must be between 1 and ${remainingAmount}`)
      }

      const response = await fetch(`/api/trips/${tripId}/expenses/${selectedExpense._id}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: paymentAmount }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to process payment")
      }

      // Here you would typically handle the payment gateway integration
      // For now, we'll just show a success message
      toast({
        title: "Payment initiated",
        description: "Please complete the payment process",
      })

      setIsPaymentDialogOpen(false)
      onUpdate()
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const acceptedMembers = members.filter((member) => member.status === "accepted")

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>Enter the details of the expense to split among trip members.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddExpense)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Dinner at Restaurant" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional details about the expense" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Expense"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Receipt className="w-12 h-12 mb-4 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold">No expenses yet</h3>
            <p className="mb-4 text-gray-600">
              Add your first expense to start tracking and splitting costs with your trip members.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => {
            // Find the current user's share
            const userShare = expense.shares.find((share) => share.user._id === session?.user.id)

            return (
              <Card key={expense._id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">{expense.title}</h3>
                        <Badge variant="outline" className="capitalize">
                          {formatDate(expense.date)}
                        </Badge>
                      </div>
                      {expense.description && <p className="mt-1 text-sm text-gray-600">{expense.description}</p>}
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <Avatar className="w-5 h-5 mr-2">
                          <AvatarImage src={expense.addedBy.profileImage} alt={expense.addedBy.name} />
                          <AvatarFallback>{expense.addedBy.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>Added by {expense.addedBy.name}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="text-xl font-semibold">{formatCurrency(expense.amount)}</div>

                      {userShare && (
                        <div className="mt-1 text-sm">
                          <div className="flex items-center gap-1">
                            <span>Your share: {formatCurrency(userShare.amount)}</span>
                            <Badge
                              variant={userShare.status === "completed" ? "outline" : "secondary"}
                              className="ml-2"
                            >
                              {userShare.status === "completed"
                                ? "Paid"
                                : userShare.status === "partial"
                                  ? `Partially Paid (${formatCurrency(userShare.amountPaid)})`
                                  : "Unpaid"}
                            </Badge>
                          </div>

                          {userShare.status !== "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                setSelectedExpense(expense)
                                setPaymentAmount(userShare.amount - userShare.amountPaid)
                                setIsPaymentDialogOpen(true)
                              }}
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              Pay Now
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              {selectedExpense && <>Pay your share for "{selectedExpense.title}"</>}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FormLabel>Amount</FormLabel>
            <div className="flex items-center mt-2">
              <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
              <Input
                type="number"
                min="1"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number.parseFloat(e.target.value))}
              />
            </div>
            {selectedExpense && (
              <p className="mt-2 text-sm text-gray-600">
                Your total share:{" "}
                {formatCurrency(
                  selectedExpense.shares.find((share) => share.user._id === session?.user.id)?.amount || 0,
                )}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayExpense} disabled={isProcessingPayment}>
              {isProcessingPayment ? "Processing..." : "Pay Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

