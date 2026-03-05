import { Toast, Toasty } from "@cloudflare/kumo";

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

export default ToastList;
