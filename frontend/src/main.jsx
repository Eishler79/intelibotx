import React from "react";
import ReactDOM from "react-dom/client";
import App from "./routes/App.jsx";
import "./index.css";
import { NotificationProvider } from "./components/notifications/NotificationSystem.jsx";

// Incluir el Toaster para notificaciones
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
      <Toaster richColors />
    </NotificationProvider>
  </React.StrictMode>
);