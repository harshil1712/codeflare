import { forwardRef } from "react";
import { Link } from "@tanstack/react-router";
import type { LinkComponentProps } from "@cloudflare/kumo";

/**
 * Bridges Kumo's `Link` / `LinkButton` to TanStack Router (registered via `LinkProvider`).
 * Internal paths navigate client-side; absolute URLs fall back to a plain anchor.
 */
const AppLink = forwardRef<HTMLAnchorElement, LinkComponentProps>(function AppLink(
  { href = "", to: _to, ...rest },
  ref,
) {
  if (/^[a-z][a-z\d+.-]*:/i.test(href)) {
    return <a ref={ref} href={href} {...rest} />;
  }
  return <Link ref={ref} to={href} {...rest} />;
});

export default AppLink;
