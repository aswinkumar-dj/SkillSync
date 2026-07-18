export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ApiErrorPayload = {
  error?: {
    message?: string;
    details?: {
      fieldErrors?: Record<string, string[] | undefined>;
      formErrors?: string[];
    };
  };
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const buildValidationMessage = (payload: ApiErrorPayload | null) => {
  const fieldErrors = payload?.error?.details?.fieldErrors;
  const formErrors = payload?.error?.details?.formErrors ?? [];

  if (fieldErrors) {
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages && messages.length > 0) {
        return `${field}: ${messages[0]}`;
      }
    }
  }

  if (formErrors.length > 0) {
    return formErrors[0];
  }

  return null;
};

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(`Could not reach the server at ${apiBaseUrl}.`, 0, {
        cause: error.message,
      });
    }

    throw new ApiError(`Could not reach the server at ${apiBaseUrl}.`, 0, null);
  }

  const payload = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;

  if (!response.ok) {
    const validationMessage = buildValidationMessage(payload as ApiErrorPayload | null);
    const message =
      payload && typeof payload === "object" && "error" in payload && payload.error?.message
        ? payload.error.message
        : validationMessage ?? "Request failed.";

    throw new ApiError(validationMessage ?? message, response.status, payload);
  }

  return payload as T;
}
