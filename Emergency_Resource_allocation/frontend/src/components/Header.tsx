import { Link } from 'react-router-dom';
import { Menu, ChevronDown, Hospital, Bed, Syringe, ClipboardList } from 'lucide-react';

export default function Header() {
  return (
    <header className="header bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center flex-wrap">
          <div className="flex items-center space-x-3">
            <Hospital className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Emergency Resource Allocation
              </h1>
              <p className="text-sm opacity-80">
                Hospital Emergency Management System
              </p>
            </div>
          </div>
          <nav className="hidden md:flex space-x-4">
            <Link
              to="/dashboard"
              className="hover:text-blue-200 transition-colors px-3 py-2 rounded-md"
            >
              Dashboard
            </Link>
            <Link
              to="/hospitals"
              className="hover:text-blue-200 transition-colors px-3 py-2 rounded-md"
            >
              Hospitals
            </Link>
            <Link
              to="/resources"
              className="hover:text-blue-200 transition-colors px-3 py-2 rounded-md"
            >
              Resources
            </Link>
            <Link
              to="/emergency-cases"
              className="hover:text-blue-200 transition-colors px-3 py-2 rounded-md"
            >
              Emergency Cases
            </Link>
            <Link
              to="/allocations"
              className="hover:text-blue-200 transition-colors px-3 py-2 rounded-md"
            >
              Allocations
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}