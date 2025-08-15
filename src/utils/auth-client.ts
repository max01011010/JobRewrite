export type User = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  email_verified?: boolean;
};

type Ok = { ok: true };

export class AuthClient {
  constructor(private base = "https://ares-checker.onrender.com") {}

  private async json<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(this.base + path, {
      credentials: "include", // This is already included!
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
      ...init,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let errorMessage = `${res.status} ${text || res.statusText}`;
      try {
        const errorJson = JSON.parse(text);
        if (errorJson.detail) {
          errorMessage = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch (e) {
        // Not a JSON error, use default message
      }
      throw new Error(errorMessage);
    }
    return res.json() as Promise<T>;
  }

  signup(input: { email: string; first_name: string; last_name: string; password: string }) {
    return this.json<Ok>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  login(input: { email: string; password: string }) {
    return this.json<Ok>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  // Updated me() method to directly return User
  me() {
    return this.json<User>("/me", { method: "GET" });
  }

  logout() {
    return this.json<Ok>("/auth/logout", { method: "POST" });
  }

  // New method for email verification
  verifyEmail(token: string) {
    return this.json<Ok>(`/auth/verify-email?token=${token}`, {
      method: "GET",
    });
  }
}