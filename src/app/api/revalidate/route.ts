import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get("secret");
  const path = searchParams.get("path");

  // Get configured secret key
  const expectedSecret = process.env.REVALIDATION_SECRET || "revalidate-secret-token";

  if (secret !== expectedSecret) {
    return NextResponse.json(
      { message: "Invalid revalidation secret token" },
      { status: 401 }
    );
  }

  if (!path) {
    return NextResponse.json(
      { message: "Missing required query parameter: path" },
      { status: 400 }
    );
  }

  try {
    // Revalidate the specified path on demand (e.g., /blog/my-post-slug or /blog)
    revalidatePath(path);
    return NextResponse.json({
      revalidated: true,
      path,
      now: Date.now(),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Error executing revalidatePath", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
