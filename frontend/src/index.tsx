import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "react-tooltip/dist/react-tooltip.css";
import "./index.css";
import Home from "./pages/home";
import Sync from "./pages/sync";
import reportWebVitals from "./reportWebVitals";
import { pushNotificationService } from "./utils/pushNotificationService";

// Register the service worker for PWA functionality
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    pushNotificationService
      .registerServiceWorker()
      .then((registration) => {
        console.log("Service Worker registered successfully:", registration);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sync" element={<Sync />} />
    </Routes>
  </BrowserRouter>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
