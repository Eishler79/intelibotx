// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./routes/App";
import "./index.css";
import { Toaster } from "sonner";
import { NotificationProvider } from "./components/notifications/NotificationSystem";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
    <Toaster richColors />
  </React.StrictMode>
);