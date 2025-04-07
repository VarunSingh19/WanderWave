"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { TripCategory } from "@/lib/models/trip.model"
import { Skeleton } from "@/components/ui/skeleton"

const tripSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date({
      required_error: "End date is required",
    }),
    category: z.nativeEnum(TripCategory),
    isPublic: z.boolean().default(false),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })

type TripFormValues = z.infer<typeof tripSchema>

interface Trip {
  _id: string
  name: string
  description: string
  startDate: string
  endDate: string
  category: string
  isPublic: boolean
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

export default function EditTripPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const tripId = params.id as string

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      name: "",
      description: "",
      category: TripCategory.OTHER,
      isPublic: false,
    },
  })

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

        // Set form values
        form.reset({
          name: data.trip.name,
          description: data.trip.description,
          startDate: new Date(data.trip.startDate),
          endDate: new Date(data.trip.endDate),
          category: data.trip.category as TripCategory,
          isPublic: data.trip.isPublic,
        })
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

  const onSubmit = async (data: TripFormValues) => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update trip")
      }

      toast({
        title: "Trip updated successfully",
        description: "Your trip has been updated",
      })

      router.push(`/trips/${tripId}`)
    } catch (error: any) {
      toast({
        title: "Failed to update trip",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="mb-6">
          <Skeleton className="w-1/3 h-10 mb-2" />
          <Skeleton className="w-1/2 h-6" />
        </div>

        <Skeleton className="w-full h-[600px]" />
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

  // Check if user is author or co-leader
  const isAuthorOrCoLeader = trip.members.some(
    (member) => member.user._id === session?.user.id && (member.role === "author" || member.role === "co_leader"),
  )

  if (!isAuthorOrCoLeader) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="p-8 text-center bg-white rounded-lg shadow">
          <h3 className="mb-2 text-xl font-semibold">Permission Denied</h3>
          <p className="mb-4 text-gray-600">
            You don't have permission to edit this trip. Only trip authors and co-leaders can edit trip details.
          </p>
          <Button onClick={() => router.push(`/trips/${tripId}`)}>Back to Trip</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/trips/${tripId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trip
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Trip</h1>
        <p className="mt-2 text-gray-600">Update your trip details</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
          <CardDescription>Edit the details of your trip</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => form.getValues("startDate") && date < form.getValues("startDate")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TripCategory).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <FormLabel>Make Trip Public</FormLabel>
                      <FormDescription>
                        Public trips can be viewed by other users in the explore section
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Updating Trip..." : "Update Trip"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

