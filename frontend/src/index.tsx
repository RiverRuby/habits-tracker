import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "react-tooltip/dist/react-tooltip.css";
import "./index.css";
import Home from "./pages/home";
import Sync from "./pages/sync";
import Vivek from "./pages/vivek";
import reportWebVitals from "./reportWebVitals";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sync" element={<Sync />} />
      <Route path="/vivek" element={<Vivek />} />
    </Routes>
  </BrowserRouter>,
);

// Register service worker for PWA capabilities
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
