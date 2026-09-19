"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { authClient } from "@/lib/auth/auth-client";
import { formatCents } from "@/lib/format";
import { STARTING_CASH_CENTS } from "@/lib/trading/constants";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validation/auth";

type Errors = Record<string, string>;

function flatten(error: z.ZodError): Errors {
  const out: Errors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    out[key] ??= issue.message;
  }
  return out;
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = updateProfileSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setErrors(flatten(parsed.error));
    setErrors({});
    setSaving(true);
    const { error } = await authClient.updateUser({ name: parsed.data.name });
    setSaving(false);
    if (error) return toast.error(error.message ?? "Couldn't save your profile.");
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear on the leaderboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Display name</FieldLabel>
              <Input id="name" name="name" defaultValue={name} autoComplete="name" aria-invalid={!!errors.name} />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" value={email} readOnly disabled />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function PasswordForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = changePasswordSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) return setErrors(flatten(parsed.error));
    setErrors({});
    setSaving(true);
    const { error } = await authClient.changePassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      revokeOtherSessions: true,
    });
    setSaving(false);
    if (error) {
      if (error.code === "INVALID_PASSWORD") return setErrors({ currentPassword: "That isn't your current password." });
      return toast.error(error.message ?? "Couldn't change your password.");
    }
    form.reset();
    toast.success("Password changed", { description: "Other devices have been signed out." });
  }

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Changing it signs out every other device.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.currentPassword}>
              <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
              <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" aria-invalid={!!errors.currentPassword} />
              {errors.currentPassword && <FieldError>{errors.currentPassword}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.newPassword}>
              <FieldLabel htmlFor="newPassword">New password</FieldLabel>
              <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.newPassword} />
              {errors.newPassword && <FieldError>{errors.newPassword}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} />
              {errors.confirmPassword && <FieldError>{errors.confirmPassword}</FieldError>}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Change password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function DangerZone() {
  const router = useRouter();
  const qc = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function reset() {
    setResetting(true);
    try {
      await api("/api/account/reset", { method: "POST" });
      await qc.invalidateQueries();
      toast.success("Portfolio reset", { description: `You're back to ${formatCents(STARTING_CASH_CENTS)}.` });
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setResetting(false);
    }
  }

  async function remove() {
    setDeleting(true);
    const { error } = await authClient.deleteUser({});
    if (error) {
      setDeleting(false);
      return toast.error(error.message ?? "Couldn't delete your account.");
    }
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="border-loss/30">
      <CardHeader>
        <CardTitle>Danger zone</CardTitle>
        <CardDescription>These can&apos;t be undone.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Reset portfolio</p>
            <p className="text-sm text-muted-foreground">
              Clears every position and trade and restores {formatCents(STARTING_CASH_CENTS)} in cash. Your watchlist stays.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" />}>Reset portfolio</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset your portfolio?</AlertDialogTitle>
                <AlertDialogDescription>
                  All holdings, trade history, and performance data will be permanently deleted and your cash set back to{" "}
                  {formatCents(STARTING_CASH_CENTS)}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={reset} disabled={resetting}>
                  {resetting && <Loader2 className="animate-spin" />}
                  Reset everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div>
            <p className="font-medium">Delete account</p>
            <p className="text-sm text-muted-foreground">Removes your account and all of its data.</p>
          </div>
          <AlertDialog onOpenChange={() => setConfirmText("")}>
            <AlertDialogTrigger render={<Button variant="destructive" />}>Delete account</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes your account, portfolio, and history. Type <span className="font-mono font-medium text-foreground">DELETE</span> to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" aria-label="Type DELETE to confirm" autoComplete="off" />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={remove} disabled={deleting || confirmText !== "DELETE"}>
                  {deleting && <Loader2 className="animate-spin" />}
                  Delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
