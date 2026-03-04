import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type AuthMode = "login" | "signup";

export interface AuthFormState {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  remember: boolean;
}

const EMAIL_REGEX = /\S+@\S+\.\S+/;

export const validateAuthForm = (mode: AuthMode, form: AuthFormState): string | null => {
  if (!form.email.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(form.email.trim())) return "Please enter a valid email address.";
  if (!form.password.trim()) return "Password is required.";
  if (mode === "signup") {
    if (!form.fullName.trim()) return "Full name is required.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.confirmPassword !== form.password) return "Passwords do not match.";
  }
  return null;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
