import axios from "axios";

type LaravelValidationErrors = Record<
  string,
  string[] | string
>;

type ApiErrorResponse = {
  message?: string;
  errors?: LaravelValidationErrors;
};

type FriendlyError = {
  title: string;
  message: string;
};

const DEFAULT_ERROR =
  "Something went wrong. Please try again.";

function containsServerDetails(
  message: string
): boolean {
  const unsafePatterns = [
    "sqlstate",
    "undefined column",
    "relation",
    "insert into",
    "update \"",
    "select * from",
    "/var/www/",
    "vendor/laravel",
    "illuminate\\",
    "queryexception",
    "pdoexception",
    "stack trace",
    "syntax error",
    "array to string conversion",
  ];

  const normalized = message.toLowerCase();

  return unsafePatterns.some((pattern) =>
    normalized.includes(pattern)
  );
}

function getFirstValidationMessage(
  errors?: LaravelValidationErrors
): string | null {
  if (!errors) {
    return null;
  }

  for (const value of Object.values(errors)) {
    if (Array.isArray(value)) {
      const message = value.find(
        (item): item is string =>
          typeof item === "string"
          && item.trim() !== ""
      );

      if (message) {
        return message;
      }
    }

    if (
      typeof value === "string"
      && value.trim() !== ""
    ) {
      return value;
    }
  }

  return null;
}

export function getFriendlyApiError(
  error: unknown,
  fallback: string = DEFAULT_ERROR
): FriendlyError {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return {
      title: "Error",
      message: fallback,
    };
  }

  const status = error.response?.status;
  const data = error.response?.data;

  /*
   * Laravel validation errors.
   *
   * These messages come directly from your backend validation,
   * including email.unique and phonenumber.unique.
   */
  if (status === 422) {
    const validationMessage =
      getFirstValidationMessage(data?.errors);

    if (
      validationMessage
      && !containsServerDetails(validationMessage)
    ) {
      return {
        title: "Check your information",
        message: validationMessage,
      };
    }

    return {
      title: "Check your information",
      message:
        "Some information is invalid. Please review the form and try again.",
    };
  }

  /*
   * No response means a network/timeout problem.
   */
  if (!error.response) {
    return {
      title: "Connection problem",
      message:
        "We could not reach the server. Check your internet connection and try again.",
    };
  }

  if (status === 429) {
    return {
      title: "Too many attempts",
      message:
        "Please wait a moment before trying again.",
    };
  }

  /*
   * Never display raw database or server errors.
   */
  if (
    status !== undefined
    && status >= 500
  ) {
    return {
      title: "Service unavailable",
      message:
        "The service is temporarily unavailable. Please try again shortly.",
    };
  }

  /*
   * Use a backend message only when it is safe.
   */
  if (
    typeof data?.message === "string"
    && data.message.trim() !== ""
    && !containsServerDetails(data.message)
  ) {
    return {
      title: "Request failed",
      message: data.message,
    };
  }

  return {
    title: "Request failed",
    message: fallback,
  };
}