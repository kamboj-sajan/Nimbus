import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, KeyRound, Mail, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import AuthLayout from "@/components/auth/auth-layout";
import { FormError, IconInput, SubmitButton } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { authApi } from "@/lib/api";
import { errorMessage } from "@/lib/utils";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validation";

const backToSignIn = (
  <Link to="/sign-in" className="flex items-center gap-2 hover:text-foreground">
    <ArrowLeft className="size-4" />
    Back to sign in
  </Link>
);

export default function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const request = useMutation({ mutationFn: authApi.forgotPassword });

  if (request.isSuccess) {
    return (
      <AuthLayout
        badge="Password recovery"
        badgeIcon={KeyRound}
        title="Check your email"
        description={
          <>
            If an account exists for <span className="font-medium text-foreground">{form.getValues("email")}</span>,
            a reset link is on its way. It expires in 1 hour.
          </>
        }
        footer={backToSignIn}
      >
        <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
          <CheckCircle className="size-8 text-emerald-400" />
        </div>
        <Button
          variant="outline"
          className="w-full"
          disabled={request.isPending}
          onClick={() => request.mutate(form.getValues())}
        >
          <Send className="size-4" />
          Resend email
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="Password recovery"
      badgeIcon={KeyRound}
      title="Forgot your password?"
      description="No worries — enter your email and we'll send you a reset link"
      footer={backToSignIn}
    >
      <FormError message={request.error ? errorMessage(request.error) : null} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => request.mutate(values))} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <IconInput icon={Mail} type="email" placeholder="you@example.com" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton loading={request.isPending} loadingText="Sending…">
            <Send className="size-4" />
            Send reset link
          </SubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
}
