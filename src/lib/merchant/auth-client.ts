type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  message: string;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

type RequestOptions = {
  suppressUnauthorizedRedirect?: boolean;
};

function handleUnauthorized() {
  if (typeof window === "undefined") return;
  const segments = window.location.pathname.split("/");
  const locale = segments[1] || "en";
  window.location.href = `/${locale}/merchant/login`;
}

export async function postJson<T>(
  url: string,
  body: Record<string, unknown>,
  options?: RequestOptions
): Promise<ApiResult<T>> {
  return requestJson<T>("POST", url, body, options);
}

export async function putJson<T>(
  url: string,
  body: Record<string, unknown>,
  options?: RequestOptions
): Promise<ApiResult<T>> {
  return requestJson<T>("PUT", url, body, options);
}

async function requestJson<T>(
  method: "POST" | "PUT",
  url: string,
  body: Record<string, unknown>,
  options?: RequestOptions
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const payload = (await response.json()) as
      | {
          code: 0;
          message: string;
          data: T;
        }
      | {
          code: number;
          message: string;
        };

    if (!response.ok || payload.code !== 0 || !("data" in payload)) {
      if (
        !options?.suppressUnauthorizedRedirect &&
        (response.status === 401 || payload.code === 40101)
      ) {
        handleUnauthorized();
      }
      return {
        ok: false,
        message: payload.message || "Request failed"
      };
    }

    return {
      ok: true,
      data: payload.data
    };
  } catch {
    return {
      ok: false,
      message: "Network error"
    };
  }
}

export async function getJson<T>(url: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });
    const payload = (await response.json()) as
      | {
          code: 0;
          message: string;
          data: T;
        }
      | {
          code: number;
          message: string;
        };

    if (!response.ok || payload.code !== 0 || !("data" in payload)) {
      if (response.status === 401 || payload.code === 40101) {
        handleUnauthorized();
      }
      return {
        ok: false,
        message: payload.message || "Request failed"
      };
    }

    return {
      ok: true,
      data: payload.data
    };
  } catch {
    return {
      ok: false,
      message: "Network error"
    };
  }
}
