import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { MapPage } from './pages/MapPage';
import { HouseholdPage } from './pages/HouseholdPage'; 

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, 
    children: [
      {
        index: true, 
        element: <MapPage />,
      },
      
      {
        path: "household", 
        element: <HouseholdPage />, 
      }
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}