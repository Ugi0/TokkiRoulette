import { BrowserRouter, Route, Routes } from "react-router";
import RoulettePage from "./pages/RoulettePage";
import HomePage from "./pages/HomePage";

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
