const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1") &&
  window.location.port !== "8000"
    ? "http://localhost:8000/api"
    : "/api");

export const storage = {
  getToken() {
    return localStorage.getItem("kish_auth_token");
  },

  getUser() {
    const raw = localStorage.getItem("kish_auth_user");

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem("kish_auth_user");
      return null;
    }
  },

  getSession() {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      return null;
    }

    return {
      token,
      user,
    };
  },

  setSession({ token, user }) {
    if (!token || !user) {
      throw new Error("اطلاعات ورود نامعتبر است.");
    }

    localStorage.setItem("kish_auth_token", token);
    localStorage.setItem("kish_auth_user", JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem("kish_auth_token");
    localStorage.removeItem("kish_auth_user");
  },

  isAuthenticated() {
    return Boolean(this.getToken() && this.getUser());
  },
};

async function request(path, options = {}) {
  const token = storage.getToken();

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),

    ...(token
      ? {
          Authorization: `Token ${token}`,
        }
      : {}),

    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      storage.clearSession();
    }

    const message =
      typeof data === "string"
        ? data
        : data?.detail ||
          Object.values(data || {})
            .flat()
            .join("، ");

    const error = new Error(message || "خطا در ارتباط با سرور");

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

const json = (body) => JSON.stringify(body);

export const api = {
  login(credentials) {
    return request("/accounts/login/", {
      method: "POST",
      body: json(credentials),
    });
  },

  users: {
    list() {
      return request("/accounts/users/");
    },

    get(id) {
      return request(`/accounts/users/${id}/`);
    },

    create(payload) {
      return request("/accounts/users/", {
        method: "POST",
        body: json(payload),
      });
    },

    update(id, payload) {
      return request(`/accounts/users/${id}/`, {
        method: "PATCH",
        body: json(payload),
      });
    },

    remove(id) {
      return request(`/accounts/users/${id}/`, {
        method: "DELETE",
      });
    },

    delete(id) {
      return request(`/accounts/users/${id}/`, {
        method: "DELETE",
      });
    },
  },

  terms: {
    list() {
      return request("/classes/terms/");
    },

    get(id) {
      return request(`/classes/terms/${id}/`);
    },

    create(payload) {
      return request("/classes/terms/", {
        method: "POST",
        body: json(payload),
      });
    },

    update(id, payload) {
      return request(`/classes/terms/${id}/`, {
        method: "PATCH",
        body: json(payload),
      });
    },

    remove(id) {
      return request(`/classes/terms/${id}/`, {
        method: "DELETE",
      });
    },

    delete(id) {
      return request(`/classes/terms/${id}/`, {
        method: "DELETE",
      });
    },
  },

  classrooms: {
    list() {
      return request("/classes/classrooms/");
    },

    get(id) {
      return request(`/classes/classrooms/${id}/`);
    },

    create(payload) {
      return request("/classes/classrooms/", {
        method: "POST",
        body: json(payload),
      });
    },

    update(id, payload) {
      return request(`/classes/classrooms/${id}/`, {
        method: "PATCH",
        body: json(payload),
      });
    },

    remove(id) {
      return request(`/classes/classrooms/${id}/`, {
        method: "DELETE",
      });
    },

    delete(id) {
      return request(`/classes/classrooms/${id}/`, {
        method: "DELETE",
      });
    },
  },

  enrollments: {
    list() {
      return request("/classes/enrollments/");
    },

    get(id) {
      return request(`/classes/enrollments/${id}/`);
    },

    create(payload) {
      return request("/classes/enrollments/", {
        method: "POST",
        body: json(payload),
      });
    },

    update(id, payload) {
      return request(`/classes/enrollments/${id}/`, {
        method: "PATCH",
        body: json(payload),
      });
    },

    remove(id) {
      return request(`/classes/enrollments/${id}/`, {
        method: "DELETE",
      });
    },

    delete(id) {
      return request(`/classes/enrollments/${id}/`, {
        method: "DELETE",
      });
    },
  },

  sessions: {
    list() {
      return request("/attendance/sessions/");
    },

    get(id) {
      return request(`/attendance/sessions/${id}/`);
    },

    create(payload) {
      return request("/attendance/sessions/", {
        method: "POST",
        body: json(payload),
      });
    },

    update(id, payload) {
      return request(`/attendance/sessions/${id}/`, {
        method: "PATCH",
        body: json(payload),
      });
    },

    remove(id) {
      return request(`/attendance/sessions/${id}/`, {
        method: "DELETE",
      });
    },

    delete(id) {
      return request(`/attendance/sessions/${id}/`, {
        method: "DELETE",
      });
    },
  },

  attendance: {
    list() {
      return request("/attendance/records/");
    },

    get(id) {
      return request(`/attendance/records/${id}/`);
    },

    create(payload) {
      return request("/attendance/records/", {
        method: "POST",
        body: json(payload),
      });
    },

    update(id, payload) {
      return request(`/attendance/records/${id}/`, {
        method: "PATCH",
        body: json(payload),
      });
    },

    remove(id) {
      return request(`/attendance/records/${id}/`, {
        method: "DELETE",
      });
    },

    delete(id) {
      return request(`/attendance/records/${id}/`, {
        method: "DELETE",
      });
    },
  },

  attendances: {
    list() {
      return request("/attendance/records/");
    },

    get(id) {
      return request(`/attendance/records/${id}/`);
    },

    create(payload) {
      return request("/attendance/records/", {
        method: "POST",
        body: json(payload),
      });
    },

    update(id, payload) {
      return request(`/attendance/records/${id}/`, {
        method: "PATCH",
        body: json(payload),
      });
    },

    remove(id) {
      return request(`/attendance/records/${id}/`, {
        method: "DELETE",
      });
    },

    delete(id) {
      return request(`/attendance/records/${id}/`, {
        method: "DELETE",
      });
    },
  },

  exams: {
    list() {
      return request("/exams/exams/");
    },

    get(id) {
      return request(`/exams/exams/${id}/`);
    },

    studentView(id) {
      return request(`/exams/exams/${id}/student_view/`);
    },

    create(payload) {
      return request("/exams/exams/", {
        method: "POST",
        body: json(payload),
      });
    },

    update(id, payload) {
      return request(`/exams/exams/${id}/`, {
        method: "PATCH",
        body: json(payload),
      });
    },

    remove(id) {
      return request(`/exams/exams/${id}/`, {
        method: "DELETE",
      });
    },

    delete(id) {
      return request(`/exams/exams/${id}/`, {
        method: "DELETE",
      });
    },
  },

  questions: {
    list() {
      return request("/exams/questions/");
    },

    get(id) {
      return request(`/exams/questions/${id}/`);
    },

    create(payload) {
      return request("/exams/questions/", {
        method: "POST",
        body: json(payload),
      });
    },

    update(id, payload) {
      return request(`/exams/questions/${id}/`, {
        method: "PATCH",
        body: json(payload),
      });
    },

    remove(id) {
      return request(`/exams/questions/${id}/`, {
        method: "DELETE",
      });
    },

    delete(id) {
      return request(`/exams/questions/${id}/`, {
        method: "DELETE",
      });
    },
  },

  submissions: {
    list() {
      return request("/exams/submissions/");
    },

    get(id) {
      return request(`/exams/submissions/${id}/`);
    },

    create(payload) {
      return request("/exams/submissions/", {
        method: "POST",
        body: json(payload),
      });
    },

    update(id, payload) {
      return request(`/exams/submissions/${id}/`, {
        method: "PATCH",
        body: json(payload),
      });
    },

    remove(id) {
      return request(`/exams/submissions/${id}/`, {
        method: "DELETE",
      });
    },

    delete(id) {
      return request(`/exams/submissions/${id}/`, {
        method: "DELETE",
      });
    },

    grade(id) {
      return request(`/exams/submissions/${id}/grade/`, {
        method: "POST",
      });
    },
  },

  answers: {
    list() {
      return request("/exams/answers/");
    },

    get(id) {
      return request(`/exams/answers/${id}/`);
    },

    create(payload) {
      return request("/exams/answers/", {
        method: "POST",
        body: json(payload),
      });
    },

    update(id, payload) {
      return request(`/exams/answers/${id}/`, {
        method: "PATCH",
        body: json(payload),
      });
    },

    remove(id) {
      return request(`/exams/answers/${id}/`, {
        method: "DELETE",
      });
    },

    delete(id) {
      return request(`/exams/answers/${id}/`, {
        method: "DELETE",
      });
    },
  },
};

export function getFullName(user) {
  if (!user) return "نامشخص";

  const fullName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim();

  return fullName || user.username || "نامشخص";
}

export function rolePanelPath(role) {
  return (
    {
      student: "/panel/student",
      teacher: "/panel/teacher",
      secretary: "/panel/secretary",
      admin: "/panel/admin",
    }[role] || "/"
  );
}