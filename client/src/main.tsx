
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { initializeTheme } from "./lib/themes";
import { LoadingProvider } from "./hooks/use-loading";
import { Provider } from "react-redux";
import { store } from "./lib/store";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Initialize theme from localStorage or default
initializeTheme();

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <App />
        <ToastContainer position="bottom-right" theme="dark" />
      </LoadingProvider>
    </QueryClientProvider>
  </Provider>
);
