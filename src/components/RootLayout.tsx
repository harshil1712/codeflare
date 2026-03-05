import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { DropdownMenu, Link as KumoLink } from "@cloudflare/kumo";
import {
  GithubLogo,
  Images,
  PencilSimple,
  SignOut,
  UserCircle,
} from "@phosphor-icons/react";
import { authClient } from "../../lib/auth-client";

function RootLayout() {
  const location = useLocation();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const isGallery = location.pathname === "/gallery";
  const isAuth =
    location.pathname === "/login" || location.pathname === "/register";

  const handleSignOut = async () => {
    await authClient.signOut();
    router.navigate({ to: "/" });
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">
            <Link to="/">CodeFlare</Link>
          </h1>
          <nav className="app-header-nav">
            <Link
              to="/"
              className={`header-nav-link${!isGallery && !isAuth ? " header-nav-link-active" : ""}`}
            >
              <PencilSimple size={15} weight="bold" />
              Editor
            </Link>
            <Link
              to="/gallery"
              className={`header-nav-link${isGallery ? " header-nav-link-active" : ""}`}
            >
              <Images size={15} weight="bold" />
              Gallery
            </Link>
          </nav>
        </div>

        <div className="app-header-right">
          {!isPending && (
            <>
              {session ? (
                <DropdownMenu>
                  <DropdownMenu.Trigger className="user-menu-trigger">
                    <UserCircle size={16} weight="bold" />
                    <span className="user-menu-name">
                      {session.user.name || session.user.email}
                    </span>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item
                        icon={SignOut}
                        variant="default"
                        onClick={handleSignOut}
                      >
                        Sign out
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu>
              ) : (
                <Link to="/login" className={`header-nav-link${isAuth ? " header-nav-link-active" : ""}`}>
                  Sign in
                </Link>
              )}
            </>
          )}
          <KumoLink
            href="https://github.com/harshil1712/codeflare"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-github-link"
            aria-label="View on GitHub"
            variant="plain"
          >
            <GithubLogo size={18} />
          </KumoLink>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

export default RootLayout;
