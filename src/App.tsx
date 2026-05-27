import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import FruitSliceGame from "@/pages/FruitSliceGame";
import RunGame from "@/pages/RunGame";
import QuizGame from "@/pages/QuizGame";
import DoctorGame from "@/pages/DoctorGame";
import Encyclopedia from "@/pages/Encyclopedia";
import Profile from "@/pages/Profile";
import MatchingGame from "@/pages/MatchingGame";
import MinerGame from "@/pages/MinerGame";
import PuzzleGame from "@/pages/PuzzleGame";
import HammerGame from "@/pages/HammerGame";
import TitlesPage from "@/pages/TitlesPage";
import BadgesPage from "@/pages/BadgesPage";

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
        <Route path="/game/matching" element={<MatchingGame />} />
        <Route path="/game/miner" element={<MinerGame />} />
        <Route path="/game/puzzle" element={<PuzzleGame />} />
        <Route path="/game/hammer" element={<HammerGame />} />
        <Route path="/titles" element={<TitlesPage />} />
        <Route path="/badges" element={<BadgesPage />} />
      </Routes>
    </Router>
  );
}
