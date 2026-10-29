import { lazy, Suspense, useState } from "react";
import LandingScreen from "./pages/LandingScreen.tsx";

const ReportersFlow = lazy(() => import("./pages/ReportersFlow.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const TrendsDashboard = lazy(() => import("./pages/TrendsDashboard-v2.tsx"));
const ResponseTeamAccess = lazy(() => import("./pages/ResponseTeamAccess.tsx"));
const OrganizationMapSetup = lazy(() => import("./pages/OrganizationMapSetup.tsx"));

type View = "landing" | "reporter" | "trends" | "team-access" | "dashboard" | "map-setup";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [demoAccessGranted, setDemoAccessGranted] = useState(false);
  const [trendsReturnView, setTrendsReturnView] = useState<View>("landing");

  const openTrends = (from: View) => {
    setTrendsReturnView(from);
    setView("trends");
  };

  const leaveDashboard = () => {
    setDemoAccessGranted(false);
    setView("landing");
  };

  return (
    <div className="app-root">
      <Suspense fallback={<div className="page-loading" role="status">Loading SafeCircle…</div>}>
        {view === "landing" && (
          <LandingScreen
            onReport={() => setView("reporter")}
            onDashboard={() => setView("team-access")}
            onTrends={() => openTrends("landing")}
          />
        )}
        {view === "reporter" && (
          <ReportersFlow onBack={() => setView("landing")} />
        )}
        {view === "trends" && (
          <TrendsDashboard onBack={() => setView(trendsReturnView)} />
        )}
        {view === "team-access" && (
          <ResponseTeamAccess onBack={() => setView("landing")} onContinue={() => {
            setDemoAccessGranted(true);
            setView("dashboard");
          }} />
        )}
        {view === "dashboard" && demoAccessGranted && (
          <Dashboard onBack={leaveDashboard} onTrends={() => openTrends("dashboard")} onMapSetup={() => setView("map-setup")} />
        )}
        {view === "map-setup" && demoAccessGranted && (
          <OrganizationMapSetup onBack={() => setView("dashboard")} />
        )}
      </Suspense>
    </div>
  );
}
