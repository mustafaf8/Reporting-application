import { cookies } from "next/headers";
import { User } from "@/types";

export async function getServerSession(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    // Token'ı doğrula ve kullanıcı bilgilerini al
    const response = await fetch(
      `${process.env.API_BASE_URL || "http://localhost:5000"}/api/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data?.user || data.user || null;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getServerSession();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();

  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }

  return user;
}
