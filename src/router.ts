import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { createElement } from "react";
import RootLayout from "./components/RootLayout";
import EditorPage from "./App";
import GalleryPage from "./components/Gallery";
import AuthPage from "./components/AuthPage";

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: () =>
    createElement(
      "div",
      { className: "not-found" },
      createElement("h2", null, "404 — Page not found"),
    ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: EditorPage,
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gallery",
  component: GalleryPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: AuthPage,
});

const routeTree = rootRoute.addChildren([indexRoute, galleryRoute, loginRoute]);

export const router = createRouter({ routeTree });

// Register the router for full type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Re-export Outlet for use in RootLayout
export { Outlet };
