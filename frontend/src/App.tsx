import { BrowserRouter, Route, Routes } from "react-router";
import RoulettePage from "./pages/RoulettePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoulettePage />} />
      </Routes>
    </BrowserRouter>
  );
}
