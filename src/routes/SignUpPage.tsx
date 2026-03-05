import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Banner, Button, Input, SensitiveInput } from "@cloudflare/kumo";
import { authClient } from "../../lib/auth-client";

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
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message ?? "Sign up failed. Please try again.");
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
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">
            Create an account to save your screenshots.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
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

          {error && <Banner variant="error">{error}</Banner>}

          <Button
            type="submit"
            variant="primary"
            size="base"
            disabled={loading}
            className="auth-submit"
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="auth-toggle">
          Already have an account?{" "}
          <Link to="/login" className="auth-toggle-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUpPage;
