import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { createElement } from "react";
import RootLayout from "./components/RootLayout";
import EditorPage from "./routes/EditorPage";
import GalleryPage from "./routes/GalleryPage";
import SignInPage from "./routes/SignInPage";
import SignUpPage from "./routes/SignUpPage";

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
  component: SignInPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: SignUpPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  galleryRoute,
  loginRoute,
  registerRoute,
]);

export const router = createRouter({ routeTree });

// Register the router for full type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
