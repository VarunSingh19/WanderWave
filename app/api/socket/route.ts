import { NextResponse, type NextRequest } from "next/server";

// App Router cannot directly initialize Socket.IO because it doesn't expose res.socket.
// Redirect to the Pages API route that sets up Socket.IO on the Node server.
export async function GET(req: NextRequest) {
  const url = new URL("/api/socket-io", req.url);
  return NextResponse.redirect(url, { status: 307 });
}
