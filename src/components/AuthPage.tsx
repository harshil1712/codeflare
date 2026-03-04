import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button, Input } from "@cloudflare/kumo";
import { authClient } from "../../lib/auth-client";

type AuthMode = "signin" | "signup";

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
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
      if (mode === "signup") {
        const { error: signUpError } = await authClient.signUp.email({
          name,
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message ?? "Sign up failed. Please try again.");
          return;
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message ?? "Sign in failed. Please check your credentials.");
          return;
        }
      }

      // Redirect to home after successful auth
      router.navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2 className="auth-title">
            {mode === "signin" ? "Sign in to CodeFlare" : "Create your account"}
          </h2>
          <p className="auth-subtitle">
            {mode === "signin"
              ? "Sign in to save screenshots and access your gallery."
              : "Create an account to save your screenshots."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === "signup" && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-name">
                Name
              </label>
              <Input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">
              Email
            </label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">
              Password
            </label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="base"
            disabled={loading}
            className="auth-submit"
          >
            {loading
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>

        <p className="auth-toggle">
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button className="auth-toggle-btn" onClick={toggleMode} type="button">
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
