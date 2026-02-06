"use client"

import { signInWithGoogle } from "@/actions/auth/google-auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { SignInSchema } from "@/schema"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import { Loader2, Mail, Lock } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { getRoleRedirect } from "@/config/auth"
import type { Role } from "@/types/auth"
import { useSession } from "@/components/providers/session-provider"

export function LoginInForm() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { refetch } = useSession()

    const form = useForm<z.infer<typeof SignInSchema>>({
        resolver: zodResolver(SignInSchema),
        defaultValues: {
            email: "",
            password: "",
        }
    })

    async function onSubmit(values: z.infer<typeof SignInSchema>) {
        setIsLoading(true);
        const toastId = toast.loading("Signing in...");

        try {
            const { error, data } = await authClient.signIn.email({
                email: values.email,
                password: values.password,
            });

            if (error) {
                toast.error(error.message || "Invalid email or password", { id: toastId });
                return;
            }

            if (data?.user) {
                toast.success("Signed in successfully", { id: toastId });

                // Get role from the signed-in user data
                const user = data.user as { role?: Role };
                const redirectPath = getRoleRedirect(user.role);

                // Update session state immediately, then navigate
                await refetch();
                router.replace(redirectPath);
            }
        } catch (error) {
            toast.error("An unexpected error occurred", { id: toastId });
            console.error("Sign in error:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full space-y-6">
            {/* Header Section */}
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Welcome back
                </h1>
                <p className="text-sm text-neutral-400">
                    Enter your credentials to access your account
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-neutral-300 text-sm">Email</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500 group-focus-within:text-emerald-400 transition-colors" />
                                            <Input
                                                placeholder="name@example.com"
                                                type="email"
                                                {...field}
                                                className="pl-10 h-11 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-neutral-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all rounded-xl"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-neutral-300 text-sm">Password</FormLabel>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500 group-focus-within:text-emerald-400 transition-colors" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...field}
                                                className="pl-10 h-11 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-neutral-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all rounded-xl"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 text-base font-semibold bg-gradient-to-r from-emerald-400 to-teal-400 text-black hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all rounded-xl cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : "Sign In"}
                    </Button>
                </form>
            </Form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/[0.08]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-3 text-neutral-500">Or continue with</span>
                </div>
            </div>

            <Button
                variant="outline"
                type="button"
                className="w-full h-11 font-medium bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] text-white transition-all rounded-xl cursor-pointer"
                onClick={signInWithGoogle}
            >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Sign in with Google
            </Button>

            <div className="text-center text-[10px] text-neutral-600 pt-2">
                By continuing, you agree to our Terms and Privacy Policy.
            </div>
        </div>
    )
}
