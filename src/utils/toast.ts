import { toast } from "sonner";

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string, duration: number = 4000) => {
  toast.error(message, { duration });
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};