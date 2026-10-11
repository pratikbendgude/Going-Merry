import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Hospitals from './pages/Hospitals';
import Resources from './pages/Resources';
import EmergencyCases from './pages/EmergencyCases';
import Allocations from './pages/Allocations';
import Header from './components/Header';
import './App.css';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(BrowserRouter, { children: _jsxs("div", { className: "App", children: [_jsx(Header, {}), _jsx("main", { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { replace: true, to: "/dashboard" }) }), _jsx(Route, { path: "/dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/hospitals", element: _jsx(Hospitals, {}) }), _jsx(Route, { path: "/resources", element: _jsx(Resources, {}) }), _jsx(Route, { path: "/emergency-cases", element: _jsx(EmergencyCases, {}) }), _jsx(Route, { path: "/allocations", element: _jsx(Allocations, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { replace: true, to: "/dashboard" }) })] }) })] }) }) }));
}
export default App;
