import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { Toast } from "@cloudflare/kumo";
import "@cloudflare/kumo/styles/standalone";
import "./index.css";
import "./App.css";
import { router } from "./router";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ToastList from "./components/ToastList";
import { toastManager } from "./toast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Toast.Provider toastManager={toastManager} timeout={4000} limit={3}>
        <RouterProvider router={router} />
        <Toast.Portal>
          <Toast.Viewport className="toast-viewport">
            <ToastList />
          </Toast.Viewport>
        </Toast.Portal>
      </Toast.Provider>
    </ErrorBoundary>
  </StrictMode>,
);
