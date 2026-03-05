import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Banner, Button, Input, SensitiveInput } from "@cloudflare/kumo";
import { authClient } from "../../lib/auth-client";

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
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });
      if (signInError) {
        setError(
          signInError.message ??
            "Sign in failed. Please check your credentials.",
        );
        return;
      }

      router.navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2 className="auth-title">Sign in to CodeFlare</h2>
          <p className="auth-subtitle">
            Sign in to save screenshots and access your gallery.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
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

          {error && <Banner variant="error">{error}</Banner>}

          <Button
            type="submit"
            variant="primary"
            size="base"
            disabled={loading}
            className="auth-submit"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="auth-toggle">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="auth-toggle-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignInPage;
