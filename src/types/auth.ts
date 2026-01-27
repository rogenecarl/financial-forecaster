import type { auth } from "@/lib/auth"
import type { Role } from "@/lib/generated/prisma/enums"

// Infer session type from Better Auth
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user & { role: Role }

// Re-export Role type for guards
export type { Role }
