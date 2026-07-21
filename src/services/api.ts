import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from "axios";

import { getItemSafe, setItemSafe, removeItemSafe } from "@/utils/storage";
import { getDeviceDetails } from "@/utils/device";
import { ENV } from '@/src/config/env';

const TOKEN_KEY = "auth_token";

export const BASE_URL = ENV.API_URL;

if (__DEV__) {
  console.log("[API] Environment:", ENV.APP_ENV);
  console.log("[API] Base URL:", BASE_URL);
}

export const API: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000,
  headers: {
    Accept: "application/json",
  },
});

/**
 * Automatically add the authentication token to every request.
 */
API.interceptors.request.use(
  async (config) => {
    try {
      const token = await getItemSafe(TOKEN_KEY);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("[API] Failed to attach authentication token:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);


export async function verifyNewDeviceFace(
  formData: FormData
) {
  const preAuthToken =
    await getItemSafe("pre_auth_token");

  if (!preAuthToken) {
    throw new Error(
      "Device verification session is missing."
    );
  }

  const response = await API.post(
    "/auth/device/verify-face",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${preAuthToken}`,
      },
    }
  );

  await removeItemSafe("pre_auth_token");

  return response.data;
}

/**
 * Central API response and error handling.
 */
API.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    const data = error.response?.data;

    console.error(`[API] ${method ?? "REQUEST"} ${url ?? "unknown"}`, {
      status,
      message: data?.message ?? error.message,
      errors: data?.errors,
    });

    return Promise.reject(error);
  }
);

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

  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ) {
    return API.post<T>(url, data, config);
  }

  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ) {
    return API.put<T>(url, data, config);
  }

  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ) {
    return API.patch<T>(url, data, config);
  }

  delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return API.delete<T>(url, config);
  }

  async getToken(): Promise<string | null> {
    return getItemSafe(TOKEN_KEY);
  }

  async setToken(token: string): Promise<void> {
    if (!token) {
      return;
    }

    await setItemSafe(TOKEN_KEY, token);
  }

  async removeToken(): Promise<void> {
    await removeItemSafe(TOKEN_KEY);
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
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
  }

  return data;
}

  async forgetPassword(email: string) {
    return this.request("/forgot-password", {
      method: "POST",
      body: { email },
    });
  }

  async register(userData: unknown) {
      const response = await API.post("/register", userData);

      const preAuthToken =response.data?.pre_auth_token;

      if (preAuthToken) {
        await setItemSafe("pre_auth_token", preAuthToken);
      }

      /*
      * An incomplete registration must not
      * retain a full authentication token.
      */
      await removeItemSafe("auth_token");

      return response.data;
}

  async verifyEmail(payload: unknown) {
    return this.request("/verify-email", {
      method: "POST",
      body: payload,
    });
  }

  async resendEmailCode(payload: unknown) {
    return this.request("/resend-email-code", {
      method: "POST",
      body: payload,
    });
  }

  async updateEmail(payload: unknown) {
    return this.request("/update-email", {
      method: "POST",
      body: payload,
    });
  }

  async updatePhoneNumber(payload: unknown) {
    return this.request("/update-phone-number", {
      method: "POST",
      body: payload,
    });
  }

  async getIdCardTypes() {
    return this.request<any[]>("/id-card-types");
  }

 async verifyIdCard(formData: FormData) {
  const preAuthToken = await getItemSafe("pre_auth_token");

  if (!preAuthToken) {
    throw new Error(
      "Your verification session is missing. Please log in again."
    );
  }

  const response = await API.post("/verify-id-card", formData, {
      headers: {
        Accept: "application/json",
        Authorization:
          `Bearer ${preAuthToken}`,
      },
      timeout: 120_000,
    }
  );

  return response.data;
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

  // KYC endpoints

 async kycLiveness(formData: FormData) {
    const preAuthToken = await getItemSafe("pre_auth_token");

    if (!preAuthToken) {
    throw new Error(
      "Your verification session is missing. Please log in again."
    );
  }

  const response = await API.post("/kyc-liveness", formData, {
      headers: {
        Accept: "application/json",
        Authorization:
          `Bearer ${preAuthToken}`,
      },
      timeout: 120_000,
    }
  );

  return response.data;
}

  async verifyFaceForNewDevice(formData: FormData) {
    const response = await API.post(
      "/verify-face-new-device",
      formData,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
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
}

const apiService = new ApiService();

export default apiService;