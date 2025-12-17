// API base URL - 백엔드 서버 주소
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 토큰 관리
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const setToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
};

export const removeToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
};

// API 호출 헬퍼 함수
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    ...options.headers,
  };

  // JSON 요청인 경우 Content-Type 추가
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // 인증이 필요한 경우 토큰 추가
  if (token && !endpoint.includes("/auth/")) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (fetchError: any) {
    // 네트워크 에러 (서버가 실행되지 않았거나 CORS 문제)
    throw new Error(
      `서버 연결 실패: ${fetchError.message || "서버에 연결할 수 없습니다"}`
    );
  }

  if (!response.ok) {
    // 에러 응답 파싱 시도
    let errorMessage = `API Error: ${response.status}`;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        errorMessage = error.message || error || errorMessage;
      } else {
        // JSON이 아닌 경우 텍스트로 읽기
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
    } catch (parseError) {
      // 파싱 실패 시 기본 메시지 사용
      errorMessage = response.statusText || `API Error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await apiCall<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  signup: async (email: string, password: string, userName: string) => {
    const data = await apiCall<{ token: string; user: any }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, userName }),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },
};

// Post API
export const postApi = {
  create: async (formData: FormData) => {
    const token = getToken();
    if (!token) {
      throw new Error("인증이 필요합니다");
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/post/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } catch (fetchError: any) {
      // 네트워크 에러 (서버가 실행되지 않았거나 CORS 문제)
      throw new Error(
        `서버 연결 실패: ${fetchError.message || "서버에 연결할 수 없습니다"}`
      );
    }

    if (!response.ok) {
      // 에러 응답 파싱 시도
      let errorMessage = `API Error: ${response.status}`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          errorMessage = error.message || error || errorMessage;
        } else {
          // JSON이 아닌 경우 텍스트로 읽기
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
      } catch (parseError) {
        // 파싱 실패 시 기본 메시지 사용
        errorMessage = response.statusText || `API Error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },
};

// My API
export const myApi = {
  getProfile: async () => {
    return apiCall<{ profile: any; stats: any }>("/my/profile", {
      method: "GET",
    });
  },

  updateProfile: async (data: {
    email?: string;
    hope_job?: string;
    password?: string;
  }) => {
    return apiCall<{ message: string; profile: any }>("/my/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  getGrass: async () => {
    return apiCall<{ grass: any[] }>("/my/grass", {
      method: "GET",
    });
  },

  getScraps: async () => {
    return apiCall<{ scraps: any[] }>("/my/scraps", {
      method: "GET",
    });
  },

  getNotifications: async () => {
    return apiCall<{ notifications: any[] }>("/my/notifications", {
      method: "GET",
    });
  },

  markNotificationRead: async (id: number) => {
    return apiCall<{ message: string }>(`/my/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  deleteNotification: async (id: number) => {
    return apiCall<{ message: string }>(`/my/notifications/${id}`, {
      method: "DELETE",
    });
  },

  getSchedules: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString();
    return apiCall<{ schedules: any[] }>(
      `/my/schedule${queryString ? `?${queryString}` : ""}`,
      {
        method: "GET",
      }
    );
  },

  createSchedule: async (data: {
    title: string;
    description?: string;
    scheduleDate: string;
  }) => {
    return apiCall<{ message: string; schedule: any }>("/my/schedule", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateSchedule: async (
    id: number,
    data: {
      title: string;
      description?: string;
      scheduleDate: string;
    }
  ) => {
    return apiCall<{ message: string; schedule: any }>(`/my/schedule/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteSchedule: async (id: number) => {
    return apiCall<{ message: string }>(`/my/schedule/${id}`, {
      method: "DELETE",
    });
  },
};
