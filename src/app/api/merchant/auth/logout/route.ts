import { apiSuccess } from "@/lib/api/contract-response";

export async function POST() {
  const response = apiSuccess({ loggedOut: true });
  for (const key of [
    "merchant_token",
    "merchant_locale",
    "merchant_registered",
    "merchant_status"
  ]) {
    response.cookies.set(key, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(0)
    });
  }
  return response;
}
