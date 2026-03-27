import { apiSuccess } from "@/lib/api/contract-response";

export async function POST(request: Request) {
  try {
    await request.text();
    return apiSuccess({ received: true });
  } catch {
    return apiSuccess({ received: true });
  }
}
