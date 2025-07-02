import { useToast as useOriginalToast } from "./use-toast";

// Create a fixed version of useToast that works better with our game components
export function useToastFixed() {
  const originalToast = useOriginalToast();
  
  return {
    ...originalToast,
    success: (message: string) => {
      originalToast.toast({
        title: "Success",
        description: message,
        variant: "default"
      });
    },
    error: (message: string) => {
      originalToast.toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    },
    info: (message: string) => {
      originalToast.toast({
        title: "Info",
        description: message,
        variant: "default"
      });
    },
    warning: (message: string) => {
      originalToast.toast({
        title: "Warning",
        description: message,
        variant: "destructive"
      });
    }
  };
}