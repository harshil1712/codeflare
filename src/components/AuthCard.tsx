import type { FormEvent, ReactNode } from "react";
import { Banner, Button, Link, Surface, Text } from "@cloudflare/kumo";

interface AuthCardProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  loading: boolean;
  error: string | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  /** Footer prompt, e.g. "Don't have an account?" */
  switchPrompt: string;
  switchLabel: string;
  switchHref: string;
  /** Form fields. */
  children: ReactNode;
}

/** Shared layout for the sign-in and sign-up pages. */
function AuthCard({
  title,
  subtitle,
  submitLabel,
  loading,
  error,
  onSubmit,
  switchPrompt,
  switchLabel,
  switchHref,
  children,
}: AuthCardProps) {
  return (
    <div className="auth-page">
      <Surface className="auth-card">
        <header className="auth-card-header">
          <span className="app-logo-mark auth-logo-mark" aria-hidden="true" />
          <Text variant="heading" size="lg" as="h1">
            {title}
          </Text>
          <Text variant="secondary" size="sm">
            {subtitle}
          </Text>
        </header>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {children}
          {error && <Banner variant="error">{error}</Banner>}
          <Button type="submit" variant="primary" loading={loading} className="auth-submit">
            {submitLabel}
          </Button>
        </form>

        <div className="auth-switch">
          <Text variant="secondary" size="sm">
            {switchPrompt} <Link href={switchHref}>{switchLabel}</Link>
          </Text>
        </div>
      </Surface>
    </div>
  );
}

export default AuthCard;
