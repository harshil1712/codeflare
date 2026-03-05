import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { Toast, Toasty } from "@cloudflare/kumo";
import "@cloudflare/kumo/styles/standalone";
import "./index.css";
import { router } from "./router";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { toastManager } from "./toast";

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return (
    <>
      {toasts.map((toast: Toast.Root.ToastObject) => (
        <Toast.Root key={toast.id} toast={toast} className="toast-root">
          <Toasty>
            {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
            {toast.description && (
              <Toast.Description>{toast.description}</Toast.Description>
            )}
            <Toast.Close aria-label="Dismiss" />
          </Toasty>
        </Toast.Root>
      ))}
    </>
  );
}

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
