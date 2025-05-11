
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeApiKey } from "./apiKeyInit.ts";
import { initPushNotifications } from "./services/pushNotificationService";

// Initialize API key asynchronously
(async () => {
  try {
    await initializeApiKey();
  } catch (error) {
    console.error("Failed to initialize API key:", error);
  }
})();

// Initialize push notifications
(async () => {
  try {
    await initPushNotifications();
  } catch (error) {
    console.error("Failed to initialize push notifications:", error);
  }
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
