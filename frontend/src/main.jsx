// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./routes/App";
import "./index.css";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster richColors />
  </React.StrictMode>
);