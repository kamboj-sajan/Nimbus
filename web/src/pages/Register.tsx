import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, AtSign, Mail, MailCheck, Sparkles, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/auth-layout";
import { FormError, IconInput, PasswordInput, PasswordStrength, SubmitButton } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { APP_NAME } from "@/config/brand";
import { authApi } from "@/lib/api";
import { errorMessage } from "@/lib/utils";
import { registerSchema, type RegisterValues } from "@/lib/validation";

export default function RegisterPage() {
  const navigate = useNavigate();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", username: "", email: "", password: "", confirmPassword: "" },
  });

  const register = useMutation({
    mutationFn: ({ confirmPassword: _confirm, ...values }: RegisterValues) => authApi.register(values),
    onSuccess: (data) => {
      if (!data.requiresVerification) {
        toast.success(data.message);
        navigate("/sign-in");
      }
    },
  });

  if (register.data?.requiresVerification) {
    return (
      <AuthLayout
        badge="Almost there"
        badgeIcon={MailCheck}
        title="Check your inbox"
        description={
          <>
            We sent a verification link to <span className="font-medium text-foreground">{form.getValues("email")}</span>.
          </>
        }
      >
        <Button asChild variant="outline" className="w-full">
          <Link to="/sign-in">Back to sign in</Link>
        </Button>
      </AuthLayout>
    );
  }

  const password = form.watch("password");

  return (
    <AuthLayout
      badge="Join the community"
      badgeIcon={Sparkles}
      title="Create your account"
      description={`Start coding in the cloud with ${APP_NAME} — no setup required`}
      footer={
        <span>
          Already have an account?{" "}
          <Link to="/sign-in" className="font-medium text-link hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      <FormError message={register.error ? errorMessage(register.error) : null} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => register.mutate(values))} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <IconInput icon={User} placeholder="Ada Lovelace" autoComplete="name" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <IconInput icon={AtSign} placeholder="ada_l" autoComplete="username" {...field} />
                </FormControl>
                <FormDescription className="text-xs">Used for your workspace URL. Lowercase letters, numbers and _.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <IconInput icon={Mail} type="email" placeholder="you@example.com" autoComplete="email" {...field} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="At least 8 characters" autoComplete="new-password" {...field} />
                </FormControl>
                <PasswordStrength password={password} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="Repeat your password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton loading={register.isPending} loadingText="Creating account…">
            Create account
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </SubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
}
