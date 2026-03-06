import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ParticleCanvas from "./components/ParticleCanvas";
import NavBar from "./components/NavBar";
import PlanPage from "./pages/PlanPage";
import PredictPage from "./pages/PredictPage";
import FinalizePage from "./pages/FinalizePage";
import AnalyticsPage from "./pages/AnalyticsPage";

export default function App() {
  return (
    <BrowserRouter>
      <div
        className="min-h-screen text-white relative overflow-x-hidden"
        style={{
          background: "radial-gradient(ellipse at 20% 50%, #0f0a2e 0%, #050510 50%, #030308 100%)",
          fontFamily: "'DM Sans', 'Sora', sans-serif",
        }}
      >
        {/* Global font & style injection */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Sora:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
          * { font-family: 'DM Sans', sans-serif; }
          .font-display { font-family: 'Sora', sans-serif; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
          input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 20px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #06b6d4); cursor: pointer; box-shadow: 0 0 12px rgba(139,92,246,0.6); margin-top: -8px; border: 2px solid rgba(255,255,255,0.3); }
          input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: linear-gradient(90deg, #7c3aed, #0891b2); }
          input[type=range]::-moz-range-thumb { height: 20px; width: 20px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #06b6d4); cursor: pointer; border: 2px solid rgba(255,255,255,0.3); }
          ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 2px; }
        `}</style>

        {/* Particle background — rendered once, shared across all pages */}
        <ParticleCanvas />

        {/* Navigation bar */}
        <NavBar />

        {/* Page content — padded below fixed navbar */}
        <div className="relative z-10 pt-14">
          <Routes>
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/predict" element={<PredictPage />} />
            <Route path="/finalize" element={<FinalizePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            {/* Default: redirect everything else to /plan */}
            <Route path="*" element={<Navigate to="/plan" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
