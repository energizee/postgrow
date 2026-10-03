import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import { ActivityPage } from "./pages/bulletin/ActivityPage";
import { BulletinPage } from "./pages/bulletin/BulletinPage";
import { NewActivityPage } from "./pages/bulletin/NewActivityPage";
import { ContributePage } from "./pages/ContributePage";
import { HouseholdPage } from "./pages/HouseholdPage";
import { LeaderboardsPage } from "./pages/LeaderboardsPage";
import { MapPage } from "./pages/MapPage";
import { HouseholdChoicePage } from "./pages/onboarding/HouseholdChoicePage";
import { WelcomePage } from "./pages/onboarding/WelcomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { SectorPage } from "./pages/SectorPage";

const router = createBrowserRouter([
  { path: "/welcome", element: <WelcomePage /> },
  { path: "/welcome/household", element: <HouseholdChoicePage /> },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <MapPage /> },
      { path: "sector/:sectorId", element: <SectorPage /> },
      { path: "leaderboards", element: <LeaderboardsPage /> },
      { path: "contribute", element: <ContributePage /> },
      { path: "bulletin", element: <BulletinPage /> },
      { path: "bulletin/new", element: <NewActivityPage /> },
      { path: "bulletin/:activityId", element: <ActivityPage /> },
      { path: "reviews", element: <ReviewsPage /> },
      { path: "household", element: <HouseholdPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
