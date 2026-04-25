import { BrowserRouter, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import RoulettePage from "./pages/RoulettePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/roulette" element={<RoulettePage />} />
      </Routes>
    </BrowserRouter>
  );
}
