import { BrowserRouter, Route, Routes } from "react-router";
import RoulettePage from "./pages/RoulettePage";
import { OverlayProvider } from "./components/Overlay/OverlayContext";
import { OverlayLayer } from "./components/Overlay/OverlayLayer";
import RouletteAnalyticsPage from "./pages/RouletteAnalyticsPage";

export default function App() {
  return (
    <OverlayProvider>
      <BrowserRouter>
        <OverlayLayer />
        <Routes>
          <Route path="/" element={<RoulettePage />} />
          <Route path="/analytics" element={<RouletteAnalyticsPage />} />
        </Routes>
      </BrowserRouter>
    </OverlayProvider>
  );
}