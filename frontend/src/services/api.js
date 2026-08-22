const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

export const storage = {
  getToken() {
    return localStorage.getItem("kish_auth_token");
  },
  setSession({ token, user }) {
    localStorage.setItem("kish_auth_token", token);
    localStorage.setItem("kish_auth_user", JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem("kish_auth_token");
    localStorage.removeItem("kish_auth_user");
  },
  getUser() {
    const raw = localStorage.getItem("kish_auth_user");
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};

async function request(path, options = {}) {
  const token = storage.getToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.detail || Object.values(data || {}).flat().join("، ");
    throw new Error(message || "خطا در ارتباط با سرور");
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
      return request(`/accounts/users/${id}/`, { method: "DELETE" });
    },
  },
  terms: {
    list() {
      return request("/classes/terms/");
    },
    create(payload) {
      return request("/classes/terms/", {
        method: "POST",
        body: json(payload),
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
    remove(id) {
      return request(`/classes/classrooms/${id}/`, { method: "DELETE" });
    },
  },
  enrollments: {
    list() {
      return request("/classes/enrollments/");
    },
    create(payload) {
      return request("/classes/enrollments/", {
        method: "POST",
        body: json(payload),
      });
    },
  },
  sessions: {
    list() {
      return request("/attendance/sessions/");
    },
    create(payload) {
      return request("/attendance/sessions/", {
        method: "POST",
        body: json(payload),
      });
    },
  },
  attendance: {
    list() {
      return request("/attendance/records/");
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
  },
  questions: {
    create(payload) {
      return request("/exams/questions/", {
        method: "POST",
        body: json(payload),
      });
    },
  },
  submissions: {
    list() {
      return request("/exams/submissions/");
    },
    create(payload) {
      return request("/exams/submissions/", {
        method: "POST",
        body: json(payload),
      });
    },
    grade(id) {
      return request(`/exams/submissions/${id}/grade/`, { method: "POST" });
    },
  },
  answers: {
    create(payload) {
      return request("/exams/answers/", {
        method: "POST",
        body: json(payload),
      });
    },
  },
};

export function getFullName(user) {
  if (!user) return "نامشخص";
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return fullName || user.username || "نامشخص";
}

export function rolePanelPath(role) {
  return {
    student: "/panel/student",
    teacher: "/panel/teacher",
    secretary: "/panel/secretary",
    admin: "/panel/admin",
  }[role] || "/";
}
