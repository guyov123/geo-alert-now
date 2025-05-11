
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPushNotifications } from "./services/pushNotificationService";

// Initialize push notifications with better error handling
(async () => {
  try {
    console.log("Initializing push notifications...");
    await initPushNotifications();
    console.log("Push notifications initialized successfully");
  } catch (error) {
    console.error("Failed to initialize push notifications:", error);
  }
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
