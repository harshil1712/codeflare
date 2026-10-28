import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Input, SensitiveInput } from "@cloudflare/kumo";
import { authClient } from "../../lib/auth-client";
import AuthCard from "../components/AuthCard";

function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({ name, email, password });
      if (signUpError) {
        setError(signUpError.message ?? "Sign up failed. Please try again.");
        return;
      }
      await router.navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Create an account to save your screenshots."
      submitLabel="Create account"
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      switchPrompt="Already have an account?"
      switchLabel="Sign in"
      switchHref="/login"
    >
      <Input
        id="auth-name"
        label="Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        required
        autoComplete="name"
      />
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
        placeholder="At least 8 characters"
        required
        autoComplete="new-password"
      />
    </AuthCard>
  );
}

export default SignUpPage;
