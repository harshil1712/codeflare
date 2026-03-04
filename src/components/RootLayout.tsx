import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  CaretDown,
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
  const isLogin = location.pathname === "/login";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMenuToggle = () => setMenuOpen((open) => !open);

  const handleMenuBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!menuRef.current?.contains(e.relatedTarget as Node)) {
      setMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
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
              className={`header-nav-link${!isGallery && !isLogin ? " header-nav-link-active" : ""}`}
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
                <div
                  className="user-menu"
                  ref={menuRef}
                  onBlur={handleMenuBlur}
                >
                  <button
                    className="user-menu-trigger"
                    type="button"
                    onClick={handleMenuToggle}
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                  >
                    <UserCircle size={16} weight="bold" />
                    <span className="user-menu-name">
                      {session.user.name || session.user.email}
                    </span>
                    <CaretDown
                      size={12}
                      weight="bold"
                      className={`user-menu-caret${menuOpen ? " user-menu-caret-open" : ""}`}
                    />
                  </button>
                  {menuOpen && (
                    <div className="user-menu-dropdown">
                      <button
                        className="user-menu-dropdown-item"
                        onClick={handleSignOut}
                        type="button"
                      >
                        <SignOut size={14} weight="bold" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="header-nav-link">
                  Sign in
                </Link>
              )}
            </>
          )}
          <a
            href="https://github.com/harshil1712/codeflare"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-github-link"
            aria-label="View on GitHub"
          >
            <GithubLogo size={18} />
          </a>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

export default RootLayout;
