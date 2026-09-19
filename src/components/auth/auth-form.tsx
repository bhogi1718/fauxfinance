"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn, signUp } from "@/lib/auth/auth-client";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

type Mode = "login" | "signup";
type Errors = Partial<Record<"name" | "email" | "password" | "confirmPassword" | "_", string>>;

const SAFE_REDIRECT = /^\/(?!\/)[^\s]*$/;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const next = params.get("next");
  const redirectTo = next && SAFE_REDIRECT.test(next) ? next : "/dashboard";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;

    const schema = mode === "login" ? signInSchema : signUpSchema;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setErrors(flatten(parsed.error));
      return;
    }

    setSubmitting(true);
    const handlers = {
      onSuccess: () => {
        router.push(redirectTo);
        router.refresh();
      },
      onError: ({ error }: { error: { code?: string; message?: string; status?: number } }) => {
        setSubmitting(false);
        if (error.status === 429) {
          setErrors({ _: "Too many attempts. Please wait a minute and try again." });
        } else if (mode === "login") {
          setErrors({ _: "Incorrect email or password." });
        } else if (error.code === "USER_ALREADY_EXISTS") {
          setErrors({ email: "An account with this email already exists." });
        } else {
          setErrors({ _: error.message ?? "Something went wrong. Please try again." });
        }
      },
    };

    if (mode === "login") {
      const data = parsed.data as z.infer<typeof signInSchema>;
      await signIn.email({ email: data.email, password: data.password }, handlers);
    } else {
      const data = parsed.data as z.infer<typeof signUpSchema>;
      await signUp.email({ name: data.name, email: data.email, password: data.password }, handlers);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FieldGroup>
        {mode === "signup" && (
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" name="name" autoComplete="name" placeholder="Ada Lovelace" aria-invalid={!!errors.name} />
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </Field>
        )}
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            aria-invalid={!!errors.password}
          />
          {errors.password && <FieldError>{errors.password}</FieldError>}
        </Field>
        {mode === "signup" && (
          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} />
            {errors.confirmPassword && <FieldError>{errors.confirmPassword}</FieldError>}
          </Field>
        )}
      </FieldGroup>

      {errors._ && (
        <p role="alert" className="text-sm text-destructive">
          {errors._}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="animate-spin" aria-hidden />}
        {mode === "login" ? "Sign in" : "Create account"}
      </Button>
    </form>
  );
}

function flatten(error: z.ZodError): Errors {
  const out: Errors = {};
  for (const issue of error.issues) {
    const key = (issue.path[0] as keyof Errors) ?? "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
