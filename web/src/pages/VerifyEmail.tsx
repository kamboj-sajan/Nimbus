import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Loader2, MailCheck, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const verify = useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => authApi.verifyEmail(token),
    enabled: !!token,
    retry: false,
  });

  const state = !token ? "error" : verify.isPending ? "loading" : verify.isError ? "error" : "success";

  return (
    <AuthLayout
      badge="Email verification"
      badgeIcon={MailCheck}
      title={state === "loading" ? "Verifying…" : state === "success" ? "Email verified" : "Verification failed"}
      description={
        state === "success"
          ? verify.data?.message
          : state === "error"
            ? token
              ? errorMessage(verify.error)
              : "This link is missing its token."
            : "Hang tight while we confirm your email."
      }
    >
      <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-ide-border bg-ide-hover">
        {state === "loading" && <Loader2 className="size-8 animate-spin text-link" />}
        {state === "success" && <CheckCircle className="size-8 text-[#248a3d] dark:text-[#30d158]" />}
        {state === "error" && <XCircle className="size-8 text-destructive" />}
      </div>
      <Button asChild className="w-full" disabled={state === "loading"}>
        <Link to="/sign-in">Continue to sign in</Link>
      </Button>
    </AuthLayout>
  );
}
