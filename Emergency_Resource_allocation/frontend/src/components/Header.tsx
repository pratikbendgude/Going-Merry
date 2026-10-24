import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Hospital, Menu, X } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/hospitals', label: 'Hospitals' },
    { to: '/resources', label: 'Resources' },
    { to: '/emergency-cases', label: 'Emergency Cases' },
    { to: '/allocations', label: 'Allocations' },
    { to: '/transfers', label: 'Transfers' },
  ];

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand identity */}
        <NavLink to="/dashboard" className="brand-block">
          <div className="brand-icon-box">
            <Hospital className="h-5 w-5" />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <span className="brand-title">Emergency Resource Allocation</span>
              <span className="brand-live-badge">
                <span className="brand-live-dot"></span>
                LIVE OPS
              </span>
            </div>
            <p className="brand-subtitle">Hospital Emergency Management System</p>
          </div>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav-link-item ${isActive ? 'active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile menu hamburger toggle button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-toggle-btn"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <nav className="mobile-nav-panel" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? 'active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
