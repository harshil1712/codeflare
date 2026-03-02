import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { GithubLogo, Images, PencilSimple } from "@phosphor-icons/react";

function RootLayout() {
  const location = useLocation();
  const isGallery = location.pathname === "/gallery";

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">CodeFlare</h1>
          <nav className="app-header-nav">
            <Link
              to="/"
              className={`header-nav-link${!isGallery ? " header-nav-link-active" : ""}`}
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
        <a
          href="https://github.com/harshil1712/codeflare"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-github-link"
          aria-label="View on GitHub"
        >
          <GithubLogo size={18} />
        </a>
      </header>
      <Outlet />
    </div>
  );
}

export default RootLayout;
