// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { uploadMedia } from "@/lib/cloudinary";
// import { authOptions } from "@/lib/auth";

// export async function POST(req: NextRequest) {
//   try {
//     // Check authentication
//     const session = await getServerSession(authOptions);
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Parse the request as form data
//     const formData = await req.formData();
//     const file = formData.get("file") as File | null;

//     if (!file) {
//       return NextResponse.json({ error: "No file provided" }, { status: 400 });
//     }

//     // Check file size (10MB max)
//     if (file.size > 10 * 1024 * 1024) {
//       return NextResponse.json(
//         { error: "File too large. Maximum size is 10MB" },
//         { status: 400 }
//       );
//     }

//     // Check file type
//     if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
//       return NextResponse.json(
//         { error: "Only image and video files are allowed" },
//         { status: 400 }
//       );
//     }

//     try {
//       // Convert file to base64
//       const bytes = await file.arrayBuffer();
//       const buffer = Buffer.from(bytes);
//       const base64Image = `data:${file.type};base64,${buffer.toString(
//         "base64"
//       )}`;

//       // Upload to Cloudinary
//       const resourceType = file.type.startsWith("video/") ? "video" : "image";
//       const mediaUrl = await uploadMedia(base64Image, resourceType);

//       if (!mediaUrl) {
//         throw new Error("Upload returned empty URL");
//       }

//       return NextResponse.json({
//         message: "Media uploaded successfully",
//         url: mediaUrl,
//       });
//     } catch (uploadError: any) {
//       console.error("Error during upload process:", uploadError);
//       return NextResponse.json(
//         { error: uploadError.message || "Failed to process upload" },
//         { status: 500 }
//       );
//     }
//   } catch (error: any) {
//     console.error("Error uploading media:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to upload media" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadMedia as cloudinaryUpload } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;
    const resourceType = file.type.startsWith("video/") ? "video" : "image";
    const url = await cloudinaryUpload(dataUri, resourceType);

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
