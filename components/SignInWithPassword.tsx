"use client"

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { Label } from "./ui/label";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function SignInWithPassword({
  provider,
  handleSent,
  handlePasswordReset,
  customSignUp: customSignUp,
  passwordRequirements,
}: {
  provider?: string;
  handleSent?: (email: string) => void;
  handlePasswordReset?: () => void;
  customSignUp?: React.ReactNode;
  passwordRequirements?: string;
}) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslations("UI");
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitting(true);
        const formData = new FormData(event.currentTarget);
        signIn(provider ?? "password", formData)
          .then(() => {
            router.replace("/");
            handleSent?.(formData.get("email") as string);
          })
          .catch((error) => {
            console.error(error);
            let toastTitle: string;
            if (
              error instanceof ConvexError &&
              error.data === "INVALID_PASSWORD"
            ) {
              toastTitle =
                "Invalid password - check the requirements and try again.";
            } else {
               const msg = (error as Error).message;
               const accountExistsPattern = /Account .* already exists/i;
                if (msg.includes("TooManyFailedAttempt")) {
                    toastTitle = t("TooManyFailedAttempt");
                } else if (msg.includes("InvalidSecret")) {
                    toastTitle = t("InvalidSecret");
                } else if (msg.includes("InvalidAccountId")) {
                    toastTitle = t("InvalidAccountId");
                } else if (msg.includes("Invalid password")) {
                    toastTitle = t("InvalidPassword");
                } else if (accountExistsPattern.test(msg)) {
                    toastTitle = t("AccountExists");
                } else {
                    // fallback
                    toastTitle =
                    flow === "signIn"
                        ? t("CouldNotSignIn")
                        : t("CouldNotSignUp");
                }

            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
      }}
    >
      <Label htmlFor="email">{t("email")}</Label>
      <Input name="email" id="email" className="mb-4" autoComplete="email" />
      {flow === "signUp" && (
        <>
            <Label htmlFor="userName">{t("userName")}</Label>
            <Input name="displayName" id="userName" className="mb-4" autoComplete="username" />
        </>
      )}
      <div className="flex items-center justify-between">
        <Label htmlFor="password">{t("password")}</Label>
        {handlePasswordReset && flow === "signIn" ? (
          <Button
            className="p-0 h-auto"
            type="button"
            variant="link"
            onClick={handlePasswordReset}
          >
            Forgot your password?
          </Button>
        ) : null}
      </div>
      <Input
        type="password"
        name="password"
        id="password"
        autoComplete={flow === "signIn" ? "current-password" : "new-password"}
      />
      {flow === "signUp" && passwordRequirements !== null && (
        <span className="text-gray-500 font-thin text-sm">
          {passwordRequirements}
        </span>
      )}
      {flow === "signUp" && customSignUp}
      <input name="flow" value={flow} type="hidden" />
      <Button type="submit" disabled={submitting} className="mt-4">
        {flow === "signIn" ? "Sign in" : "Sign up"}
      </Button>
      <Button
        variant="link"
        type="button"
        onClick={() => {
          setFlow(flow === "signIn" ? "signUp" : "signIn");
        }}
      >
        {flow === "signIn"
          ? "Don't have an account? Sign up"
          : "Already have an account? Sign in"}
      </Button>
    </form>
  );
}