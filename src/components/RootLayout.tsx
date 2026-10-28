import { Outlet, useLocation, useRouter } from "@tanstack/react-router";
import {
  Button,
  DropdownMenu,
  Link,
  LinkButton,
  LinkProvider,
  Tooltip,
  TooltipProvider,
} from "@cloudflare/kumo";
import { GithubLogo, Images, PencilSimple, SignIn, SignOut } from "@phosphor-icons/react";
import { authClient } from "../../lib/auth-client";
import AppLink from "./AppLink";

const NAV_ITEMS = [
  { href: "/", label: "Editor", icon: PencilSimple },
  { href: "/gallery", label: "Gallery", icon: Images },
] as const;

function RootLayout() {
  const location = useLocation();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    await router.navigate({ to: "/" });
  };

  const displayName = session?.user.name || session?.user.email || "";

  return (
    <LinkProvider component={AppLink}>
      <TooltipProvider>
        <div className="app-root">
          <header className="app-header">
            <Link href="/" variant="plain" className="app-logo" aria-label="CodeFlare home">
              <span className="app-logo-mark" aria-hidden="true" />
              CodeFlare
            </Link>

            <nav className="app-nav" aria-label="Main">
              {NAV_ITEMS.map(({ href, label, icon }) => {
                const active = location.pathname === href;
                return (
                  <LinkButton
                    key={href}
                    href={href}
                    variant="ghost"
                    size="sm"
                    icon={icon}
                    aria-current={active ? "page" : undefined}
                    className="app-nav-link"
                  >
                    {label}
                  </LinkButton>
                );
              })}
            </nav>

            <div className="app-header-actions">
              <Tooltip
                content="View on GitHub"
                side="bottom"
                render={
                  <LinkButton
                    href="https://github.com/harshil1712/codeflare"
                    external
                    variant="ghost"
                    size="sm"
                    shape="square"
                    icon={GithubLogo}
                    aria-label="View on GitHub"
                  />
                }
              />

              {!isPending &&
                (session ? (
                  <DropdownMenu>
                    <DropdownMenu.Trigger
                      render={
                        <Button variant="outline" size="sm" className="user-menu-trigger">
                          <span className="user-avatar" aria-hidden="true">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                          <span className="user-menu-name">{displayName}</span>
                        </Button>
                      }
                    />
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item icon={SignOut} onClick={handleSignOut}>
                        Sign out
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu>
                ) : (
                  <LinkButton href="/login" variant="secondary" size="sm" icon={SignIn}>
                    Sign in
                  </LinkButton>
                ))}
            </div>
          </header>
          <Outlet />
        </div>
      </TooltipProvider>
    </LinkProvider>
  );
}

export default RootLayout;
