import axios, { AxiosError, AxiosInstance, AxiosRequestConfig,} from "axios";

import { getItemSafe, setItemSafe, removeItemSafe } from "@/utils/storage";
import { getDeviceDetails } from "@/utils/device";
import { ENV } from '@/src/config/env';


const TOKEN_KEY = "auth_token";

export const BASE_URL = ENV.API_URL;

if (__DEV__) {
  console.log("[API] Environment:", ENV.APP_ENV);
  console.log("[API] Base URL:", BASE_URL);
}

export const API: AxiosInstance =
  axios.create({
    baseURL: BASE_URL,
    timeout: 120_000,
    headers: {
      Accept: "application/json",
    },
  });

API.interceptors.request.use(
  async (config) => {
    const token = await getItemSafe(
      TOKEN_KEY
    );

    config.headers.set(
      "Accept",
      "application/json"
    );

    if (token) {
      config.headers.set(
        "Authorization",
        `Bearer ${token}`
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const diagnostic = {
      baseURL: error.config?.baseURL,
      url: error.config?.url,
      fullURL:
        `${error.config?.baseURL ?? ""}` +
        `${error.config?.url ?? ""}`,
      method:
        error.config?.method?.toUpperCase(),
      status:
        error.response?.status ?? 0,
      responseData:
        error.response?.data ?? null,
      message: error.message,
      code: error.code,
      hasResponse:
        Boolean(error.response),
      hasRequest:
        Boolean(error.request),
    };

    console.error(
      "[API ERROR]",
      JSON.stringify(
        diagnostic,
        null,
        2
      )
    );

    return Promise.reject(error);
  }
);


export async function verifyNewDeviceFace(formData: FormData) {
  console.log("[verifyNewDeviceFace] formData", formData);
  const preAuthToken =
    await getItemSafe("pre_auth_token");

  if (!preAuthToken) {
    throw new Error(
      "Device verification session is missing."
    );
  }

  const url = `${BASE_URL}/auth/device/verify-face`;
  console.log("[verifyNewDeviceFace] POST", url);

  const response = await API.post(
    "/auth/device/verify-face",
    formData,
    {
      headers: {
        Authorization: `Bearer ${preAuthToken}`,
      },
    }
  );

  console.log("[verifyNewDeviceFace] response status", response.status);

  await removeItemSafe("pre_auth_token");

  return response.data;
}




type RequestOptions = {
  method?: AxiosRequestConfig["method"];
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
};

type ApiError = {
  status: number;
  message: string;
  errors: Record<string, string[]>;
};

export type ResendPhoneCodePayload = {
  user_id: string | number;
};

export type ResendPhoneCodeResponse = {
  status: number;
  message: string;
  user_id: string | number;
};

export type VerifyPhonePayload = {
  user_id: string | number;
  code: string;
};

export type VerifyPhoneResponse = {
  status: number;
  message: string;
  user_id?: string | number;
  user?: Record<string, unknown>;
};

export type UpdatePhoneNumberPayload = {
  user_id: string | number;
  phone: string;
};

export type UpdatePhoneNumberResponse = {
  status: number;
  message: string;
  user_id?: string | number;
  user?: Record<string, unknown>;
};


export type UserResponse = {
  id: string | number;
  email: string;
  phonenumber?: string;
  [key: string]: unknown;
};

export type VerifyEmailPayload = {
  user_id: string | number;
  code: string;
};

export type VerifyEmailResponse = {
  status: number;
  message: string;
  user_id: string | number;
  user: UserResponse;
};

export type ResendEmailCodePayload = {
  user_id: string | number;
  method?: "email";
};

export type ResendEmailCodeResponse = {
  status: number;
  message: string;
  user_id?: string | number;
  user?: UserResponse;
};

export type UpdateEmailPayload = {
  user_id: string | number;
  email: string;
};

export type UpdateEmailResponse = {
  status: number;
  message: string;
  user_id?: string | number;
  user?: UserResponse;
};

export type LoginSecurityStatusResponse = {
  status: number;
  data: {
    pin_enabled: boolean;
    pin_locked_until?: string | null;
  };
};

export type BasicMessageResponse = {
  status: number;
  message: string;
};

export type PinLoginPayload = {
  login: string;
  pin: string;
  device_id: string;
  device_secret: string;
};

export type PinLoginResponse = {
  status: number;
  message?: string;
  token?: string;
  access_token?: string;
  user?: unknown;
  next_step?: string;
  verification_required?: boolean;
};

export type UserSummary = {
  id: number;
  email?: string;
  phonenumber?: string;
  firstname?: string;
  surname?: string;
  [key: string]: unknown;
};

export type AuthResponse = {
  status: number;
  message?: string;

  token?: string;
  access_token?: string;
  auth_token?: string;
  plainTextToken?: string;

  user?: UserSummary;

  verification_required?: boolean;
  next_step?: string;
  pre_auth_token?: string;

  code?: string;
  remaining_attempts?: number;
  locked_until?: string | null;
};

export type LoginSecurityResponse = {
  status: number;
  data: {
    pin_enabled: boolean;
    pin_locked_until?: string | null;
  };
};

export type TrustedDeviceResponse = {
  status: number;
  message: string;
  data: {
    device_id: string;
    device_secret: string;
  };
};

export function extractAuthToken(
  response: AuthResponse
): string | null {
  return (
    response.token ||
    response.access_token ||
    response.auth_token ||
    response.plainTextToken ||
    null
  );
}





class ApiService {
  public readonly baseURL: string;
  public readonly defaults: AxiosInstance["defaults"];

  constructor() {
    this.baseURL = BASE_URL;
    this.defaults = API.defaults;
  }

  get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return API.get<T>(url, config);
  }

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return API.post<T>(url, data, config);
  }

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return API.put<T>(url, data, config);
  }

  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return API.patch<T>(url, data, config);
  }

  delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return API.delete<T>(url, config);
  }

  async getToken(): Promise<string | null> {
    return getItemSafe(TOKEN_KEY);
  }

  async setToken(token: string): Promise<void> {
    if (!token) return;
    await setItemSafe(TOKEN_KEY, token);
  }

  async removeToken(): Promise<void> {
    await removeItemSafe(TOKEN_KEY);
  }

  async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = "GET",
      body,
      headers = {},
      params,
    } = options;

    try {
      const response = await API.request<T>({
        url: endpoint,
        method,
        data: body,
        headers,
        params,
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;

      const apiError: ApiError = {
        status: axiosError.response?.status ?? 0,
        message:
          axiosError.response?.data?.message ??
          axiosError.message ??
          "Something went wrong",
        errors: axiosError.response?.data?.errors ?? {},
      };

      throw apiError;
    }
  }


  private async preAuthRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const preAuthToken = await getItemSafe("pre_auth_token");

  if (!preAuthToken) {
    throw {
      status: 401,
      message:
        "Your verification session is missing. Please register or log in again.",
      errors: {},
    } satisfies ApiError;
  }

  return this.request<T>(endpoint, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Accept: "application/json",
      Authorization: `Bearer ${preAuthToken}`,
    },
  });
}

  // Authentication endpoints

  async login(email: string, password: string) {
  const device = await getDeviceDetails();

  const response = await API.post("/login", {
    email,
    password,
    ...device,
  });

  const data = response.data;

  if (data?.authentication_state === "authenticated" && data?.token) {
    await setItemSafe("auth_token", data.token);
    await removeItemSafe("pre_auth_token");
  } else if (
    data?.authentication_state === "pre_auth" &&
    data?.pre_auth_token
  ) {
    await setItemSafe("pre_auth_token", data.pre_auth_token);
    await removeItemSafe("auth_token");
  } else if (
    data?.requires_device_verification &&
    data?.pre_auth_token
  ) {
    await setItemSafe("pre_auth_token", data.pre_auth_token);
    await removeItemSafe("auth_token");
  }

  return data;
}

  async forgetPassword(email: string): Promise<{ success: boolean; user_email?: string; message?: string }> {
    return this.request<{ success: boolean; user_email?: string; message?: string }>("/forgot-password", {
      method: "POST",
      body: { email },
    });
  }

  async resetPassword(
    email: string,
    token: string,
    password: string,
    passwordConfirmation: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.request("/reset-password", {
      method: "POST",
      body: {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      },
    });
  }

  async register(userData: unknown) {
      const response = await API.post("/register", userData);

      const preAuthToken = response.data?.pre_auth_token;

      if (!preAuthToken) {
        throw new Error("No verification token was returned by the server.");
      }

      await removeItemSafe("auth_token");

      await removeItemSafe("pre_auth_token");

      await setItemSafe("pre_auth_token", String(preAuthToken));

      const storedToken = await getItemSafe("pre_auth_token");

      if (storedToken !== String(preAuthToken)) {
        throw new Error("The verification token could not be stored correctly.");
      }

      return response.data;
}

  async verifyEmail( payload: VerifyEmailPayload): Promise<VerifyEmailResponse> {
      return this.preAuthRequest<VerifyEmailResponse>(
        "/verify-email",
        {
          method: "POST",
          body: payload,
        }
      );
    }

async resendEmailCode( payload: ResendEmailCodePayload): Promise<ResendEmailCodeResponse> {
    return this.preAuthRequest<ResendEmailCodeResponse>(
      "/resend-email-code",
      {
        method: "POST",
        body: payload,
      }
    );
  }

async updateEmail(payload: UpdateEmailPayload): Promise<UpdateEmailResponse> {
      return this.preAuthRequest<UpdateEmailResponse>(
        "/update-email",
        {
          method: "POST",
          body: payload,
        }
      );
    }

 async resendPhoneCode(payload: ResendPhoneCodePayload): Promise<ResendPhoneCodeResponse> {
      return this.preAuthRequest<ResendPhoneCodeResponse>(
        "/send-phone-code",
        {
          method: "POST",
          body: payload,
        }
      );
    }

async verifyPhone(payload: VerifyPhonePayload): Promise<VerifyPhoneResponse> {
      return this.preAuthRequest<VerifyPhoneResponse>(
        "/verify-phone",
        {
          method: "POST",
          body: payload,
        }
      );
    }

async updatePhoneNumber(  payload: UpdatePhoneNumberPayload): Promise<UpdatePhoneNumberResponse> {
      return this.preAuthRequest<UpdatePhoneNumberResponse>(
        "/update-phone-number",
        {
          method: "POST",
          body: payload,
        }
      );
    }


    async getLoginSecurity(): Promise<LoginSecurityStatusResponse> {
        return API
          .get<LoginSecurityStatusResponse>("/login-security")
          .then((response) => response.data);
      }

  async setLoginPin(payload: {
        current_password: string;
        pin: string;
        pin_confirmation: string;
      }): Promise<BasicMessageResponse> {
        return API
          .post<BasicMessageResponse>("/login-security/pin", payload)
          .then((response) => response.data);
      }

  async disableLoginPin(payload: {
        current_password: string;
      }): Promise<BasicMessageResponse> {
        return API
          .delete<BasicMessageResponse>("/login-security/pin", {
            data: payload,
          })
          .then((response) => response.data);
      }

  async loginWithPin(
  payload: PinLoginPayload
) {
  const response =
    await API.post(
      "/login/pin",
      payload
    );

  return response.data;
}


  async getCurrentUser() {
    return API
      .get("/user")
      .then((response) => response.data);
  }

  async registerTrustedLoginDevice(payload: {
    device_id: string;
    device_name?: string;
    platform?: string;
    app_version?: string;
  }): Promise<TrustedDeviceResponse> {
    return API
      .post<TrustedDeviceResponse>(
        "/trusted-login-devices",
        payload
      )
      .then((response) => response.data);
  }

  async revokeTrustedLoginDevice(payload: {
    device_id: string;
  }) {
    return API
      .delete(
        "/trusted-login-devices/current",
        {
          data: payload,
        }
      )
      .then((response) => response.data);
  }

    // KYC endpoints

 async kycLiveness(formData: FormData) {
  const preAuthToken =
    await getItemSafe("pre_auth_token");

  console.log("[KYC] Token exists:", Boolean(preAuthToken));

  console.log("[KYC] Token format valid:", Boolean(
      preAuthToken &&
      preAuthToken.includes("|")
    )
  );

  console.log("[KYC] Token length:", preAuthToken?.length ?? 0);

  if (!preAuthToken) {
    throw new Error(
      "Your verification session is missing. Please restart registration."
    );
  }

  if (!preAuthToken.includes("|")) {
    throw new Error(
      "Your verification session is invalid. Please restart registration."
    );
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 120_000);

  try {
    const response = await this.post<any>("/kyc-liveness", formData, {
      headers: {
        Authorization: `Bearer ${preAuthToken}`,
      },
      signal: controller.signal,
      timeout: 120_000,
    });

    console.log("[KYC] Response:", JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    if (
      error?.name === "AbortError" ||
      error?.name === "CanceledError" ||
      error?.code === "ERR_CANCELED"
    ) {
      throw new Error(
        "The face upload timed out. Please check your connection and try again."
      );
    }

    const data = error.response?.data;
    const message = data?.message ?? error.message ?? "Face verification failed.";

    console.error("[KYC] Upload failed:", {
      name: error?.name,
      message,
      status: error.response?.status,
      data,
    });

    const err = new Error(message) as Error & {
      status?: number;
      data?: unknown;
    };

    err.status = error.response?.status;
    err.data = data;

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
  async getIdCardTypes() {
    return this.request<any[]>("/id-card-types");
  }



async verifyIdCard(formData: FormData) {
  const preAuthToken =
    await getItemSafe("pre_auth_token");

  if (!preAuthToken) {
    throw new Error(
      "Your verification session is missing. Please log in again."
    );
  }

  console.log(
    "[ID KYC] Upload URL:",
    `${BASE_URL}/verify-id-card`
  );

  console.log(
    "[ID KYC] Token exists:",
    Boolean(preAuthToken)
  );

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 180_000);

  try {
    const response = await API.post(
      "/verify-id-card",
      formData,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${preAuthToken}`,

          /*
           * Do not manually add multipart boundary.
           * Axios/React Native will generate it.
           */
          "Content-Type": "multipart/form-data",
        },
        signal: controller.signal,
        timeout: 180_000,
        transformRequest: (data) => data,
      }
    );

    console.log(
      "[ID KYC] HTTP status:",
      response.status
    );

    console.log(
      "[ID KYC] Verification response:",
      JSON.stringify(
        response.data,
        null,
        2
      )
    );

    return response.data;
  } catch (error: any) {
    if (
      error?.name === "AbortError" ||
      error?.name === "CanceledError" ||
      error?.code === "ERR_CANCELED" ||
      error?.code === "ECONNABORTED"
    ) {
      throw new Error(
        "The ID-card upload timed out. Please check your connection and try again."
      );
    }

    const responseData =
      error?.response?.data;

    const message =
      responseData?.message ??
      error?.message ??
      "ID verification failed.";

    console.error(
      "[ID KYC] Upload failed:",
      {
        name: error?.name,
        message,
        status:
          error?.response?.status ??
          error?.status,
        data:
          responseData ??
          error?.data,
      }
    );

    const uploadError =
      new Error(message) as Error & {
        status?: number;
        data?: unknown;
      };

    uploadError.status =
      error?.response?.status ??
      error?.status;

    uploadError.data =
      responseData ??
      error?.data;

    throw uploadError;
  } finally {
    clearTimeout(timeoutId);
  }
}



  async updateProfile(formData: FormData) {
    const response = await API.post("/update-profile", formData, {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  }

  async logout() {
    try {
      await API.post("/logout");
    } catch (error) {
      console.warn("[API] Server logout failed:", error);
    } finally {
      await this.removeToken();
    }
  }

  async deleteAccount() {
    return this.request("/account/delete-request", {
      method: "POST",
    });
  }



  // Property endpoints

  async getProperties(filters: Record<string, unknown> = {}) {
    return API.get("/properties", {
      params: filters,
    });
  }

  async getProperty(id: number | string) {
    return API.get(`/properties/${id}`);
  }

  async getPropertySlots(
    propertyId: number | string,
    userId: number | string
  ) {
    return API.get(`/property/${propertyId}/slots/${userId}`);
  }

  async submitAppointment(payload: unknown) {
    return API.post("/submit-appointment", payload);
  }

  async getPropertyDropdowns() {
    return API.get("/property/dropdowns");
  }

  async getPropertyArea(stateId: number | string) {
    return API.get("/property/areas", {
      params: {
        state_id: stateId,
      },
    });
  }

  async createProperty(formData: FormData) {
    const response = await API.post("/properties", formData, {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  }

  async getMyProperties() {
    const response = await API.get("/my-properties");
    return response.data;
  }

  async myProperties() {
    return API.get("/my-properties");
  }

  async deletePropertyRequest(
    id: number | string,
    reason: string
  ) {
    return API.post(`/properties/${id}/delete-request`, {
      reason,
    });
  }

  async propertyAppointments(id: number | string) {
    return API.get(`/properties/${id}/appointments`);
  }

  async propertyDetails(id: number | string) {
    return API.get(`/properties/${id}`);
  }

  async updateProperty(id: number | string, data: unknown) {
    return API.post(`/properties/${id}/update`, data);
  }

  async propertyStatus(id: number | string) {
    return API.get(`/properties/${id}/status`);
  }

  

  async verifyFaceForNewDevice(formData: FormData) {
    const response = await API.post(
      "/verify-face-new-device",
      formData,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    return response.data;
  }

  // Wallet endpoints

  async getWalletStatement() {
    const response = await API.get("/wallet/statement");
    return response.data;
  }

  // Policy endpoints

  async getPolicies() {
    return API.get("/policies");
  }

  async getPolicy(slug: string) {
    return API.get(`/policies/${slug}`);
  }

  // Vacancy endpoints

  async getVacancies() {
    return API.get("/vacancies");
  }

  async applyVacancy(
    vacancyId: number | string,
    formData: FormData
  ) {
    return API.post(`/vacancies/${vacancyId}/apply`, formData, {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    });
  }

  // Contact endpoint

  async sendContactMessage(data: unknown) {
    const response = await API.post("/contact", data);
    return response.data;
  }

  // Chat endpoints

  async getMyChatGroups() {
    return API.get("/chat-groups");
  }

  async createChatGroup(data: unknown) {
    return API.post("/chat-groups", data);
  }

  async addChatGroupMembers(
    groupId: number | string,
    userIds: Array<number | string>
  ) {
    return API.post(`/chat-groups/${groupId}/members`, {
      user_ids: userIds,
    });
  }

  async getChatGroupMessages(groupId: number | string) {
    return API.get(`/chat-groups/${groupId}/messages`);
  }

  async sendGroupMessage(
    groupId: number | string,
    message: string
  ) {
    return API.post(`/chat-groups/${groupId}/messages`, {
      message,
    });
  }

  // Notification endpoints

  async markNotificationAsRead(id: number | string) {
    return API.post(`/notifications/${id}/read`);
  }

  async getNotifications() {
    const response = await API.get("/notifications");
    return response.data;
  }

  // Dashboard endpoints

  async getDashboardSummary() {
    const response = await API.get("/dashboard/summary");
    return response.data;
  }





  async testPreAuthToken() {
  const preAuthToken =
    await getItemSafe(
      "pre_auth_token"
    );

  if (!preAuthToken) {
    throw new Error(
      "No pre-auth token stored."
    );
  }

  const response =
    await API.get(
      "/pre-auth-test",
      {
        headers: {
          Authorization:
            `Bearer ${preAuthToken}`,
        },
      }
    );

  return response.data;
}
}

const apiService = new ApiService();

export default apiService;