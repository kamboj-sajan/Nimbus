import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Mail, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/auth-layout";
import { FormError, IconInput, PasswordInput, SubmitButton } from "@/components/auth/fields";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { APP_NAME } from "@/config/brand";
import { authApi } from "@/lib/api";
import { session } from "@/lib/session";
import { errorMessage } from "@/lib/utils";
import { loginSchema, type LoginValues } from "@/lib/validation";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/code";

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ token, user }) => {
      session.set({ token, user });
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      navigate(redirectTo, { replace: true });
    },
  });

  return (
    <AuthLayout
      badge="Welcome back"
      badgeIcon={Zap}
      title="Sign in"
      description={`Pick up right where you left off in ${APP_NAME}`}
      footer={
        <span>
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </span>
      }
    >
      <FormError message={login.error ? errorMessage(login.error) : null} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => login.mutate(values))} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email or username</FormLabel>
                <FormControl>
                  <IconInput icon={Mail} placeholder="you@example.com" autoComplete="username" autoFocus {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput placeholder="Your password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton loading={login.isPending} loadingText="Signing in…">
            Sign in
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </SubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
}
