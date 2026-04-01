// api-response.ts
// Typed response helpers to replace inline NextResponse.json boilerplate.
//
// Usage:
//   return apiResponse.unauthorized();
//   return apiResponse.badRequest("Phone is required.");
//   return apiResponse.notFound("Club not found.");
//   return apiResponse.forbidden();
//   return apiResponse.ok({ membershipId });
//   return apiResponse.serverError(error.message);

import { NextResponse } from "next/server";

export const apiResponse = {
  ok<T>(data: T) {
    return NextResponse.json(data, { status: 200 });
  },

  unauthorized(message = "Unauthorized") {
    return NextResponse.json({ error: message }, { status: 401 });
  },

  badRequest(message: string) {
    return NextResponse.json({ error: message }, { status: 400 });
  },

  forbidden(message = "Forbidden.") {
    return NextResponse.json({ error: message }, { status: 403 });
  },

  notFound(message = "Not found.") {
    return NextResponse.json({ error: message }, { status: 404 });
  },

  conflict(message: string) {
    return NextResponse.json({ error: message }, { status: 409 });
  },

  serverError(message = "Internal server error.") {
    return NextResponse.json({ error: message }, { status: 500 });
  },
};
