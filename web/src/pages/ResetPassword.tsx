import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/auth/auth-layout";
import { FormError, PasswordInput, PasswordStrength, SubmitButton } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { authApi } from "@/lib/api";
import { errorMessage } from "@/lib/utils";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validation";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const reset = useMutation({
    mutationFn: (values: ResetPasswordValues) => authApi.resetPassword({ token, password: values.password }),
  });

  if (reset.isSuccess) {
    return (
      <AuthLayout badge="All set" badgeIcon={ShieldCheck} title="Password updated" description={reset.data.message}>
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#248a3d]/10 dark:bg-[#30d158]/15">
          <CheckCircle className="size-8 text-[#248a3d] dark:text-[#30d158]" />
        </div>
        <Button asChild className="w-full">
          <Link to="/sign-in">Sign in</Link>
        </Button>
      </AuthLayout>
    );
  }

  const password = form.watch("password");

  return (
    <AuthLayout
      badge="Secure reset"
      badgeIcon={ShieldCheck}
      title="Choose a new password"
      description="Make it something you haven't used before"
      footer={<Link to="/sign-in" className="hover:text-foreground">Back to sign in</Link>}
    >
      <FormError message={!token ? "This reset link is missing its token. Request a new one." : reset.error ? errorMessage(reset.error) : null} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => reset.mutate(values))} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="At least 8 characters" autoComplete="new-password" autoFocus {...field} />
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
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="Repeat your new password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton loading={reset.isPending} loadingText="Updating…">
            Update password
          </SubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
}
