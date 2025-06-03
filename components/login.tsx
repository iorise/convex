"use client";

import * as React from "react";

import { loginSchema } from "@/lib/validations/auth";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "./ui/button";

export function SignInForm() {

  const { signIn } = useAuthActions();

   return (
    <Button
      className="flex-1"
      variant="outline"
      type="button"
      onClick={() => void signIn("google")}
    >
      Google
    </Button>
  );
}