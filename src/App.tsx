import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import FruitSliceGame from "@/pages/FruitSliceGame";
import RunGame from "@/pages/RunGame";
import QuizGame from "@/pages/QuizGame";
import DoctorGame from "@/pages/DoctorGame";
import Encyclopedia from "@/pages/Encyclopedia";
import Profile from "@/pages/Profile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/fruit-slice" element={<FruitSliceGame />} />
        <Route path="/game/run" element={<RunGame />} />
        <Route path="/game/quiz" element={<QuizGame />} />
        <Route path="/game/doctor" element={<DoctorGame />} />
        <Route path="/encyclopedia" element={<Encyclopedia />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}
