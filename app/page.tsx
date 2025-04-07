import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Wallet, MessageSquare } from "lucide-react"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="container px-4 py-12 mx-auto">
      <section className="py-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Plan Your Trips Together</h1>
        <p className="max-w-2xl mx-auto mb-8 text-xl text-gray-600">
          Create trips, invite friends, manage expenses, and chat in real-time.
        </p>
        {session ? (
          <Link href="/trips/new">
            <Button size="lg" className="px-8">
              Create a Trip <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Sign Up <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8">
                Login
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section className="py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="p-6 text-center bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Collaborative Planning</h3>
            <p className="text-gray-600">
              Invite friends to join your trips and plan together. Assign roles and manage permissions.
            </p>
          </div>

          <div className="p-6 text-center bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Expense Management</h3>
            <p className="text-gray-600">
              Track expenses, split costs equally, and manage payments with integrated payment processing.
            </p>
          </div>

          <div className="p-6 text-center bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Real-time Chat</h3>
            <p className="text-gray-600">Communicate with trip members in real-time through the built-in group chat.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

