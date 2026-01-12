import { BrowserRouter, Route, Routes } from "react-router-dom";
import "react-tooltip/dist/react-tooltip.css";
import "./index.css";

// Classic design pages
import ClassicHome from "./designs/classic/pages/home";
import Sync from "./designs/classic/pages/sync";
import Vivek from "./designs/classic/pages/vivek";

// New design
import NewDesignApp from "./designs/new/App";

// Design toggle
import { useDesign } from "./state/design";

// Home page that toggles between designs
function Home() {
  const { design } = useDesign();

  if (design === "new") {
    return <NewDesignApp />;
  }

  return <ClassicHome />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sync" element={<Sync />} />
        <Route path="/vivek" element={<Vivek />} />
      </Routes>
    </BrowserRouter>
  );
}
