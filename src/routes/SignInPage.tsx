import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Input, SensitiveInput } from "@cloudflare/kumo";
import { authClient } from "../../lib/auth-client";
import AuthCard from "../components/AuthCard";

function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await authClient.signIn.email({ email, password });
      if (signInError) {
        setError(signInError.message ?? "Sign in failed. Please check your credentials.");
        return;
      }
      await router.navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to save screenshots and access your gallery."
      submitLabel="Sign in"
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      switchPrompt="Don't have an account?"
      switchLabel="Sign up"
      switchHref="/register"
    >
      <Input
        id="auth-email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        autoComplete="email"
      />
      <SensitiveInput
        id="auth-password"
        label="Password"
        value={password}
        onValueChange={setPassword}
        placeholder="Your password"
        required
        autoComplete="current-password"
      />
    </AuthCard>
  );
}

export default SignInPage;
