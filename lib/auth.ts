// Sistema de autenticación con almacenamiento local
export interface User {
  id: string
  username: string
  name: string
}

interface StoredUser extends User {
  password: string // Hasheada
}

// Función simple de hash (para producción usar bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function register(
  username: string,
  password: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  const users = getUsers()

  if (users.find((u) => u.username === username)) {
    return { success: false, error: "El usuario ya existe" }
  }

  const hashedPassword = await hashPassword(password)
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    username,
    password: hashedPassword,
    name,
  }

  users.push(newUser)
  localStorage.setItem("users", JSON.stringify(users))

  return { success: true }
}

export async function login(
  username: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  const users = getUsers()
  const hashedPassword = await hashPassword(password)

  const user = users.find((u) => u.username === username && u.password === hashedPassword)

  if (!user) {
    return { success: false, error: "Usuario o contraseña incorrectos" }
  }

  const sessionUser: User = {
    id: user.id,
    username: user.username,
    name: user.name,
  }

  localStorage.setItem("currentUser", JSON.stringify(sessionUser))

  return { success: true, user: sessionUser }
}

export function logout(): void {
  localStorage.removeItem("currentUser")
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("currentUser")
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return []

  const usersStr = localStorage.getItem("users")
  if (!usersStr) return []

  try {
    return JSON.parse(usersStr)
  } catch {
    return []
  }
}
