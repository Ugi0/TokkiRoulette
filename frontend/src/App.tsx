import { BrowserRouter, Route, Routes } from "react-router";
import RoulettePage from "./pages/RoulettePage";
import { OverlayProvider } from "./components/Overlay/OverlayContext";
import { OverlayLayer } from "./components/Overlay/OverlayLayer";

export default function App() {
  return (
    <OverlayProvider>
      <BrowserRouter>
        <OverlayLayer />
        <Routes>
          <Route path="/" element={<RoulettePage />} />
        </Routes>
      </BrowserRouter>
    </OverlayProvider>
  );
}