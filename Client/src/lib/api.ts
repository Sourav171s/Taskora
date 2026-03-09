const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("taskora_token");

    const headers: any = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${baseURL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.removeItem("taskora_token");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
            window.location.href = "/";
        }
        return Promise.reject(new Error("Unauthorized"));
    }

    let data;
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    return { data, status: response.status };
}

const api = {
    get: (url: string) => fetchApi(url, { method: "GET" }),
    post: (url: string, body?: any) => fetchApi(url, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
    put: (url: string, body?: any) => fetchApi(url, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
    delete: (url: string) => fetchApi(url, { method: "DELETE" })
};

export default api;
