import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/simpleApi';
import { AlertCircle, Clock, User, Building, Plus, Filter } from 'lucide-react';
export default function EmergencyCases() {
    const [statusFilter, setStatusFilter] = useState('');
    const [triageFilter, setTriageFilter] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const queryClient = useQueryClient();
    const { data: cases = [], isLoading, error } = useQuery({
        queryKey: ['emergency-cases', statusFilter, triageFilter],
        queryFn: () => api.getEmergencyCasesWithParams({
            status: statusFilter === '' ? undefined : statusFilter,
            triage_level: triageFilter === '' ? undefined : triageFilter,
        }),
        refetchInterval: 30000, // Refresh every 30 seconds
    });
    const { data: hospitals = [] } = useQuery({
        queryKey: ['hospitals'],
        queryFn: () => api.getHospitals(),
    });
    const createMutation = useMutation({
        mutationFn: api.createEmergencyCase,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emergency-cases'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setShowCreateForm(false);
        },
    });
    if (isLoading) {
        return (_jsx("div", { className: "page-container", children: _jsxs("div", { className: "loading-state", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading emergency cases..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "page-container", children: _jsxs("div", { className: "error-state", children: [_jsx(AlertCircle, { className: "h-12 w-12 text-red-500 mb-4" }), _jsx("p", { className: "text-lg font-medium", children: "Failed to load emergency cases" }), _jsx("p", { className: "text-sm text-gray-600", children: error.message })] }) }));
    }
    const sortedCases = [...cases].sort((a, b) => {
        const triageOrder = { red: 0, yellow: 1, green: 2 };
        return triageOrder[a.triage_level] - triageOrder[b.triage_level];
    });
    return (_jsxs("div", { className: "page-container", children: [_jsxs("div", { className: "page-header", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-title", children: "Emergency Cases" }), _jsx("p", { className: "page-subtitle", children: "Active patient cases requiring attention" })] }), _jsxs("button", { className: "btn btn-primary", onClick: () => setShowCreateForm(!showCreateForm), children: [_jsx(Plus, { className: "h-4 w-4" }), "New Case"] })] }), showCreateForm && (_jsx(CreateCaseForm, { hospitals: hospitals || [], onSubmit: (data) => createMutation.mutate(data), onCancel: () => setShowCreateForm(false), isLoading: createMutation.isPending })), _jsxs("div", { className: "filters-bar", children: [_jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "triage", className: "filter-label", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), "Triage Level"] }), _jsxs("select", { id: "triage", value: triageFilter === '' ? undefined : triageFilter, onChange: (e) => setTriageFilter(e.target.value), className: "input", children: [_jsx("option", { value: "", children: "All levels" }), _jsx("option", { value: "red", children: "Red (Critical)" }), _jsx("option", { value: "yellow", children: "Yellow (Urgent)" }), _jsx("option", { value: "green", children: "Green (Stable)" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "status", className: "filter-label", children: [_jsx(Filter, { className: "h-4 w-4" }), "Status"] }), _jsxs("select", { id: "status", value: statusFilter === '' ? undefined : statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "input", children: [_jsx("option", { value: "", children: "All statuses" }), _jsx("option", { value: "open", children: "Open" }), _jsx("option", { value: "admitted", children: "Admitted" }), _jsx("option", { value: "transfer_pending", children: "Transfer Pending" }), _jsx("option", { value: "discharged", children: "Discharged" })] })] })] }), sortedCases.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx(AlertCircle, { className: "h-16 w-16 text-gray-300 mb-4" }), _jsx("p", { className: "text-lg font-medium text-gray-600", children: "No emergency cases found" }), _jsx("p", { className: "text-sm text-gray-500", children: "Cases will appear here when reported" })] })) : (_jsx("div", { className: "grid gap-4", children: sortedCases.map((emergencyCase) => (_jsx(CaseCard, { emergencyCase: emergencyCase, hospitals: hospitals || [] }, emergencyCase.case_id))) }))] }));
}
function CaseCard({ emergencyCase, hospitals }) {
    const hospital = hospitals.find(h => h.hospital_id === emergencyCase.hospital_id);
    const reportedTime = new Date(emergencyCase.reported_at);
    const triageColors = {
        red: 'bg-red-100 text-red-800 border-red-200',
        yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        green: 'bg-green-100 text-green-800 border-green-200',
    };
    const statusColors = {
        open: 'status-warning',
        admitted: 'status-info',
        transfer_pending: 'status-error',
        discharged: 'status-success',
    };
    return (_jsx("div", { className: `case-card border-l-4 ${triageColors[emergencyCase.triage_level]}`, children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900", children: ["Case #", emergencyCase.case_id] }), _jsx("span", { className: `triage-badge ${triageColors[emergencyCase.triage_level]}`, children: emergencyCase.triage_level.toUpperCase() }), _jsx("span", { className: `status-badge ${statusColors[emergencyCase.status]}`, children: emergencyCase.status.replace('_', ' ') })] }), _jsxs("div", { className: "case-details", children: [_jsxs("div", { className: "case-detail-item", children: [_jsx(User, { className: "h-4 w-4 text-gray-400" }), _jsx("span", { className: "font-medium", children: emergencyCase.patient_name })] }), _jsxs("div", { className: "case-detail-item", children: [_jsx(Building, { className: "h-4 w-4 text-gray-400" }), _jsx("span", { children: hospital?.name || `Hospital ${emergencyCase.hospital_id}` })] }), _jsxs("div", { className: "case-detail-item", children: [_jsx(Clock, { className: "h-4 w-4 text-gray-400" }), _jsxs("span", { children: ["Reported ", reportedTime.toLocaleDateString(), " at ", reportedTime.toLocaleTimeString()] })] })] })] }) }) }));
}
function CreateCaseForm({ hospitals, onSubmit, onCancel, isLoading, }) {
    const [formData, setFormData] = useState({
        hospital_id: '',
        patient_name: '',
        triage_level: 'yellow',
        status: 'open',
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            hospital_id: Number(formData.hospital_id),
        });
    };
    return (_jsxs("div", { className: "form-card mb-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Report New Emergency Case" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "patient_name", className: "form-label", children: "Patient Name" }), _jsx("input", { id: "patient_name", type: "text", required: true, value: formData.patient_name, onChange: (e) => setFormData({ ...formData, patient_name: e.target.value }), className: "input", placeholder: "Enter patient name" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "hospital_id", className: "form-label", children: "Hospital" }), _jsxs("select", { id: "hospital_id", required: true, value: formData.hospital_id, onChange: (e) => setFormData({ ...formData, hospital_id: e.target.value }), className: "input", children: [_jsx("option", { value: "", children: "Select hospital" }), hospitals.map((h) => (_jsxs("option", { value: h.hospital_id, children: [h.name, " - ", h.city] }, h.hospital_id)))] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "triage_level", className: "form-label", children: "Triage Level" }), _jsxs("select", { id: "triage_level", required: true, value: formData.triage_level, onChange: (e) => setFormData({ ...formData, triage_level: e.target.value }), className: "input", children: [_jsx("option", { value: "red", children: "Red - Critical" }), _jsx("option", { value: "yellow", children: "Yellow - Urgent" }), _jsx("option", { value: "green", children: "Green - Stable" })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "submit", className: "btn btn-primary", disabled: isLoading, children: isLoading ? 'Creating...' : 'Create Case' }), _jsx("button", { type: "button", onClick: onCancel, className: "btn btn-secondary", children: "Cancel" })] })] })] }));
}
