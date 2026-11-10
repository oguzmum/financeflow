import { Route, Routes } from "react-router";
import { StartPage } from "./pages/StartPage";

export function App() {
  return (
    <Routes>
      <Route path="*" element={<StartPage />} />
    </Routes>
  );
}
