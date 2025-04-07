"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TripsDebug() {
    const { data: session, status } = useSession()
    const [apiResponse, setApiResponse] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchTrips = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/trips")
            const data = await response.json()

            setApiResponse(data)

            if (!response.ok) {
                setError(`API returned ${response.status}: ${data.error || 'Unknown error'}`)
            }
        } catch (error: any) {
            setError(`Failed to fetch: ${error.message}`)
            console.error("Error fetching trips:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container px-4 py-8 mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Trip API Debug</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <strong>Session Status:</strong> {status}
                        </div>
                        {session && (
                            <div>
                                <strong>User ID:</strong> {session.user?.id || "Not available"}
                            </div>
                        )}

                        <Button
                            onClick={fetchTrips}
                            disabled={loading || status !== "authenticated"}
                        >
                            {loading ? "Loading..." : "Fetch Trips API"}
                        </Button>

                        {error && (
                            <div className="p-3 text-white bg-red-500 rounded">
                                {error}
                            </div>
                        )}

                        {apiResponse && (
                            <div>
                                <h3 className="mb-2 text-lg font-medium">API Response:</h3>
                                <pre className="p-4 overflow-auto bg-gray-100 rounded max-h-96">
                                    {JSON.stringify(apiResponse, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}