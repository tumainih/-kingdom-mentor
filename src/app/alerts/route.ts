import { NextResponse } from "next/server";

/** Old/mistyped path — alerts live at /notifications. */
export function GET(request: Request) {
  return NextResponse.redirect(new URL("/notifications", request.url), 308);
}
