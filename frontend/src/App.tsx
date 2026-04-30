import { BrowserRouter, Route, Routes } from "react-router";
import RoulettePage from "./pages/RoulettePage";
import RouletteAnalyticsPage from "./pages/RouletteAnalyticsPage.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoulettePage />} />
          <Route path="/analytics" element={<RouletteAnalyticsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
