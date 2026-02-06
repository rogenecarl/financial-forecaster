import { authClient } from "@/lib/auth-client";
import { DEFAULT_REDIRECT } from "@/config/auth";

export const signInWithGoogle = async () => {
    await authClient.signIn.social({
        provider: "google",
        callbackURL: DEFAULT_REDIRECT,
    })
}