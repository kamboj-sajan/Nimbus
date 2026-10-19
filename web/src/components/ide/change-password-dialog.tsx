import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormError, PasswordInput, PasswordStrength, SubmitButton } from "@/components/auth/fields";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { authApi } from "@/lib/api";
import { errorMessage } from "@/lib/utils";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validation";

export default function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });
  const change = useMutation({
    mutationFn: ({ oldPassword, newPassword }: ChangePasswordValues) => authApi.changePassword({ oldPassword, newPassword }),
    onSuccess: () => {
      toast.success("Password changed");
      onOpenChange(false);
    },
  });

  const { reset } = form;
  const { reset: resetMutation } = change;
  useEffect(() => {
    if (open) {
      reset();
      resetMutation();
    }
  }, [open, reset, resetMutation]);

  const fields = [
    { name: "oldPassword", label: "Current password", autoComplete: "current-password" },
    { name: "newPassword", label: "New password", autoComplete: "new-password" },
    { name: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Use at least 8 characters with a letter and a number.</DialogDescription>
        </DialogHeader>
        <FormError message={change.error ? errorMessage(change.error) : null} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => change.mutate(values))} className="space-y-4">
            {fields.map(({ name, label, autoComplete }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete={autoComplete} {...field} />
                    </FormControl>
                    {name === "newPassword" && <PasswordStrength password={field.value} />}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <SubmitButton loading={change.isPending} loadingText="Saving…">
              Update password
            </SubmitButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
