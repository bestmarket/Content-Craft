import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

// In production (Vercel), point all API calls at the Railway API server.
// In development (Replit), VITE_API_URL is unset so relative /api paths are used.
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

// Wire up JWT token from localStorage so all API calls include Bearer auth
setAuthTokenGetter(() => localStorage.getItem("token"));

createRoot(document.getElementById("root")!).render(<App />);
