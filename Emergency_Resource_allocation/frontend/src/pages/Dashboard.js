import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '../lib/simpleApi';
import { Hospital, Bed, Activity, Ambulance, AlertCircle, Users, Droplet, Clock } from 'lucide-react';
export default function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetchDashboard();
    }, []);
    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const data = await api.getDashboard();
            setMetrics(data);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "dashboard-container", children: _jsxs("div", { className: "loading-state", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading dashboard..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "dashboard-container", children: _jsxs("div", { className: "error-state", children: [_jsx(AlertCircle, { className: "h-12 w-12 text-red-500 mb-4" }), _jsx("p", { className: "text-lg font-medium", children: "Failed to load dashboard" }), _jsx("p", { className: "text-sm text-gray-600", children: error })] }) }));
    }
    if (!metrics)
        return null;
    const bedUtilization = ((metrics.occupied_beds / metrics.total_beds) * 100).toFixed(1);
    const ventilatorUtilization = ((metrics.in_use_ventilators / metrics.total_ventilators) * 100).toFixed(1);
    const ambulanceAvailability = ((metrics.available_ambulances / metrics.total_ambulances) * 100).toFixed(1);
    return (_jsxs("div", { className: "dashboard-container", children: [_jsxs("div", { className: "page-header", children: [_jsx("h1", { className: "page-title", children: "Operational Dashboard" }), _jsx("p", { className: "page-subtitle", children: "Real-time emergency resource status" })] }), _jsxs("div", { className: "metrics-grid", children: [_jsxs("div", { className: "metric-card critical", children: [_jsx("div", { className: "metric-icon-wrapper bg-red-100", children: _jsx(AlertCircle, { className: "h-6 w-6 text-red-600" }) }), _jsxs("div", { className: "metric-content", children: [_jsx("p", { className: "metric-label", children: "Critical Cases" }), _jsx("p", { className: "metric-value", children: metrics.open_cases + metrics.transfer_pending_cases }), _jsxs("p", { className: "metric-detail", children: [metrics.open_cases, " open, ", metrics.transfer_pending_cases, " pending transfer"] })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon-wrapper bg-blue-100", children: _jsx(Bed, { className: "h-6 w-6 text-blue-600" }) }), _jsxs("div", { className: "metric-content", children: [_jsx("p", { className: "metric-label", children: "Available Beds" }), _jsx("p", { className: "metric-value", children: metrics.available_beds }), _jsxs("p", { className: "metric-detail", children: [metrics.occupied_beds, " occupied of ", metrics.total_beds, " total (", bedUtilization, "% utilized)"] })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon-wrapper bg-green-100", children: _jsx(Activity, { className: "h-6 w-6 text-green-600" }) }), _jsxs("div", { className: "metric-content", children: [_jsx("p", { className: "metric-label", children: "Available Ventilators" }), _jsx("p", { className: "metric-value", children: metrics.available_ventilators }), _jsxs("p", { className: "metric-detail", children: [metrics.in_use_ventilators, " in use of ", metrics.total_ventilators, " total (", ventilatorUtilization, "% utilized)"] })] })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-icon-wrapper bg-amber-100", children: _jsx(Ambulance, { className: "h-6 w-6 text-amber-600" }) }), _jsxs("div", { className: "metric-content", children: [_jsx("p", { className: "metric-label", children: "Ambulances Ready" }), _jsx("p", { className: "metric-value", children: metrics.available_ambulances }), _jsxs("p", { className: "metric-detail", children: [metrics.total_ambulances, " total (", ambulanceAvailability, "% available)"] })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mt-6", children: [_jsx("div", { className: "info-card", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Registered Hospitals" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: metrics.total_hospitals })] }), _jsx(Hospital, { className: "h-10 w-10 text-gray-400" })] }) }), _jsx("div", { className: "info-card", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Total Emergency Cases" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: metrics.total_emergency_cases }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [metrics.admitted_cases, " admitted"] })] }), _jsx(Users, { className: "h-10 w-10 text-gray-400" })] }) }), _jsx("div", { className: "info-card", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Blood Units Available" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: metrics.available_blood_units }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [metrics.total_blood_units, " total units"] })] }), _jsx(Droplet, { className: "h-10 w-10 text-gray-400" })] }) })] }), metrics.pending_transfers > 0 && (_jsxs("div", { className: "mt-6 alert alert-warning", children: [_jsx(Clock, { className: "h-5 w-5" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Pending Transfers" }), _jsxs("p", { className: "text-sm", children: [metrics.pending_transfers, " patient transfer(s) in progress"] })] })] })), metrics.available_beds < 5 && (_jsxs("div", { className: "mt-4 alert alert-error", children: [_jsx(AlertCircle, { className: "h-5 w-5" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Low Bed Availability" }), _jsxs("p", { className: "text-sm", children: ["Only ", metrics.available_beds, " bed(s) available across all facilities"] })] })] }))] }));
}
