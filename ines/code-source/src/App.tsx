import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/Home";
import Galerie from "./pages/Galerie";
import Tarifs from "./pages/Tarifs";
import Reservation from "./pages/Reservation";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="galerie" element={<Galerie />} />
          <Route path="soins" element={<Tarifs />} />
          <Route path="reservation" element={<Reservation />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
