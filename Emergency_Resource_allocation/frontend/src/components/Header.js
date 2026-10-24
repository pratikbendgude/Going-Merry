import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("header", { className: "app-header", children: [_jsxs("div", { className: "header-inner", children: [_jsxs(NavLink, { to: "/dashboard", className: "brand-block", children: [_jsx("div", { className: "brand-icon-box", children: _jsx(Hospital, { className: "h-5 w-5" }) }), _jsxs("div", { className: "brand-text", children: [_jsxs("div", { className: "brand-title-row", children: [_jsx("span", { className: "brand-title", children: "Emergency Resource Allocation" }), _jsxs("span", { className: "brand-live-badge", children: [_jsx("span", { className: "brand-live-dot" }), "LIVE OPS"] })] }), _jsx("p", { className: "brand-subtitle", children: "Hospital Emergency Management System" })] })] }), _jsx("nav", { className: "desktop-nav", "aria-label": "Main navigation", children: navLinks.map((link) => (_jsx(NavLink, { to: link.to, className: ({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`, children: link.label }, link.to))) }), _jsx("button", { type: "button", onClick: () => setMobileMenuOpen(!mobileMenuOpen), className: "mobile-toggle-btn", "aria-label": mobileMenuOpen ? 'Close menu' : 'Open menu', "aria-expanded": mobileMenuOpen, children: mobileMenuOpen ? _jsx(X, { className: "h-5 w-5" }) : _jsx(Menu, { className: "h-5 w-5" }) })] }), mobileMenuOpen && (_jsx("nav", { className: "mobile-nav-panel", "aria-label": "Mobile navigation", children: navLinks.map((link) => (_jsx(NavLink, { to: link.to, onClick: () => setMobileMenuOpen(false), className: ({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`, children: link.label }, link.to))) }))] }));
}
