import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession, useStore } from "../../store/context";
import { Dock } from "./Dock";
import { TopBar } from "./TopBar";
import "./Layout.css";

// Shell for everything after onboarding
export default function Layout() {
  const { user, household } = useSession();
  const { storageFull } = useStore();
  const { pathname } = useLocation();

  if (!user || !user.postcodeAreaId) return <Navigate to="/welcome" replace />;
  if (!household) return <Navigate to="/welcome/household" replace />;

  const focused = pathname.startsWith("/contribute");

  return (
    <div className="shell">
      <a href="#main" className="shell__skip">
        Skip to content
      </a>
      {!focused && <TopBar />}
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      {!focused && <Dock />}
      {storageFull && (
        <p className="shell__alert" role="alert">
          Storage is full. Reset the demo from your profile to keep saving.
        </p>
      )}
    </div>
  );
}
