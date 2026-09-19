import { z } from "zod";

export const emailSchema = z.email("Enter a valid email address.").trim().toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Passwords can't be longer than 128 characters.");

export const nameSchema = z.string().trim().min(2, "Tell us your name.").max(60, "That name is too long.");

export const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const updateProfileSchema = z.object({ name: nameSchema });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
