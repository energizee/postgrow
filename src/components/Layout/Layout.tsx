import { Outlet, Link } from 'react-router-dom';
import './Layout.css'; 

export default function Layout() {
  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <header className="navbar">
        <div className="brand">
          <span className="brand-icon">🌱</span>
          <span>Postgrow</span>
        </div>
        
        <nav className="nav-links">
          <Link to="/" className="nav-link">Map</Link>
          <Link to="/household" className="nav-link">Household</Link>
        </nav>
      </header>

      {/* Dynamic Page Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}