import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AlertCircle, Clock, User, Building, Plus, Filter, X, Trash2, } from 'lucide-react';
export default function EmergencyCases() {
    const [statusFilter, setStatusFilter] = useState('');
    const [triageFilter, setTriageFilter] = useState('');
    const [hospitalFilter, setHospitalFilter] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [notification, setNotification] = useState(null);
    const queryClient = useQueryClient();
    const { data: cases = [], isLoading, error, } = useQuery({
        queryKey: ['emergency-cases', statusFilter, triageFilter, hospitalFilter],
        queryFn: () => api.getEmergencyCases({
            status: statusFilter || undefined,
            triage_level: triageFilter || undefined,
            hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
        }),
        refetchInterval: 15000,
    });
    const { data: hospitals = [] } = useQuery({
        queryKey: ['hospitals'],
        queryFn: () => api.getHospitals(),
    });
    const createMutation = useMutation({
        mutationFn: (data) => api.createEmergencyCase(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emergency-cases'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setShowCreateForm(false);
            setNotification({ type: 'success', text: 'Emergency case logged and queued for triage.' });
        },
        onError: (err) => {
            setNotification({ type: 'error', text: err.message });
        },
    });
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => api.updateEmergencyCase(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emergency-cases'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setNotification({ type: 'success', text: 'Patient clinical status updated.' });
        },
        onError: (err) => {
            setNotification({ type: 'error', text: err.message });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteEmergencyCase(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emergency-cases'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setNotification({ type: 'success', text: 'Case record removed.' });
        },
        onError: (err) => {
            setNotification({ type: 'error', text: err.message });
        },
    });
    if (isLoading) {
        return (_jsx("div", { className: "page-container", children: _jsxs("div", { className: "state-container", children: [_jsx("div", { className: "spinner" }), _jsx("p", { className: "empty-state-text", children: "Loading emergency patient cases..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "page-container", children: _jsxs("div", { className: "state-container", children: [_jsx(AlertCircle, { className: "h-12 w-12", style: { color: 'var(--color-critical)', marginBottom: '12px' } }), _jsx("h2", { className: "empty-state-text", children: "Failed to load emergency cases" }), _jsx("p", { className: "empty-state-sub", children: error.message })] }) }));
    }
    const sortedCases = [...cases].sort((a, b) => {
        const triageOrder = { red: 0, yellow: 1, green: 2 };
        return (triageOrder[a.triage_level] ?? 9) - (triageOrder[b.triage_level] ?? 9);
    });
    return (_jsxs("div", { className: "page-container", children: [_jsxs("div", { className: "page-header", children: [_jsxs("div", { className: "page-header-text", children: [_jsx("h1", { className: "page-title", children: "Emergency Cases Intake & Triage" }), _jsx("p", { className: "page-subtitle", children: "Track patient triage urgency, clinical admission status, and facility assignments" })] }), _jsx("div", { className: "page-actions", children: _jsxs("button", { className: "btn btn-primary", onClick: () => setShowCreateForm(!showCreateForm), children: [_jsx(Plus, { className: "h-4 w-4" }), _jsx("span", { children: "Report Patient Case" })] }) })] }), notification && (_jsxs("div", { className: `ops-banner ${notification.type === 'success' ? 'ops-banner-success' : 'ops-banner-critical'}`, children: [_jsx("div", { className: "ops-banner-left", children: _jsx("span", { className: "ops-banner-title", children: notification.text }) }), _jsx("button", { onClick: () => setNotification(null), style: { background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }, "aria-label": "Dismiss", children: _jsx(X, { className: "h-4 w-4" }) })] })), showCreateForm && (_jsx(CreateCaseForm, { hospitals: hospitals, onSubmit: (data) => createMutation.mutate(data), onCancel: () => setShowCreateForm(false), isLoading: createMutation.isPending })), _jsxs("div", { className: "filters-bar", children: [_jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "triage-filter", className: "filter-label", children: [_jsx(AlertCircle, { className: "h-3.5 w-3.5" }), "Triage Severity Level"] }), _jsxs("select", { id: "triage-filter", value: triageFilter, onChange: (e) => setTriageFilter(e.target.value), className: "input", children: [_jsx("option", { value: "", children: "All Triage Levels" }), _jsx("option", { value: "red", children: "Red (Critical / Immediate Resuscitation)" }), _jsx("option", { value: "yellow", children: "Yellow (Urgent / Serious Care)" }), _jsx("option", { value: "green", children: "Green (Stable / Non-urgent)" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "status-filter", className: "filter-label", children: [_jsx(Filter, { className: "h-3.5 w-3.5" }), "Clinical Admission Status"] }), _jsxs("select", { id: "status-filter", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "input", children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "open", children: "Open (Awaiting Bed / Allocation)" }), _jsx("option", { value: "admitted", children: "Admitted" }), _jsx("option", { value: "transfer_pending", children: "Transfer Pending" }), _jsx("option", { value: "discharged", children: "Discharged" })] })] }), _jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "hospital-filter", className: "filter-label", children: [_jsx(Building, { className: "h-3.5 w-3.5" }), "Hospital Facility"] }), _jsxs("select", { id: "hospital-filter", value: hospitalFilter, onChange: (e) => setHospitalFilter(e.target.value), className: "input", children: [_jsx("option", { value: "", children: "All Hospitals" }), hospitals.map((h) => (_jsxs("option", { value: h.hospital_id, children: [h.name, " (", h.city, ")"] }, h.hospital_id)))] })] })] }), sortedCases.length === 0 ? (_jsxs("div", { className: "state-container", children: [_jsx(AlertCircle, { className: "h-12 w-12", style: { color: 'var(--color-text-muted)', marginBottom: '12px' } }), _jsx("p", { className: "empty-state-text", children: "No emergency cases match the selected filters" }), _jsx("p", { className: "empty-state-sub", children: "Adjust your filters or report a new patient case above." })] })) : (_jsx("div", { className: "cases-stack", children: sortedCases.map((emergencyCase) => (_jsx(CaseCard, { emergencyCase: emergencyCase, hospitals: hospitals, onUpdateStatus: (status) => updateStatusMutation.mutate({ id: emergencyCase.case_id, status }), onDelete: () => {
                        if (confirm(`Remove case #${emergencyCase.case_id} (${emergencyCase.patient_name})?`)) {
                            deleteMutation.mutate(emergencyCase.case_id);
                        }
                    }, isUpdating: updateStatusMutation.isPending }, emergencyCase.case_id))) }))] }));
}
function CaseCard({ emergencyCase, hospitals, onUpdateStatus, onDelete, isUpdating, }) {
    const hospital = hospitals.find((h) => h.hospital_id === emergencyCase.hospital_id);
    const reportedTime = new Date(emergencyCase.reported_at);
    const borderClass = emergencyCase.triage_level === 'red'
        ? 'case-card-critical'
        : emergencyCase.triage_level === 'yellow'
            ? 'case-card-urgent'
            : 'case-card-stable';
    const triageBadgeClass = emergencyCase.triage_level === 'red'
        ? 'badge-critical'
        : emergencyCase.triage_level === 'yellow'
            ? 'badge-warning'
            : 'badge-success';
    const statusBadgeClass = emergencyCase.status === 'open'
        ? 'badge-warning'
        : emergencyCase.status === 'admitted'
            ? 'badge-info'
            : emergencyCase.status === 'transfer_pending'
                ? 'badge-critical'
                : 'badge-neutral';
    return (_jsxs("div", { className: `case-card ${borderClass}`, children: [_jsxs("div", { className: "case-main", children: [_jsxs("div", { className: "case-top-row", children: [_jsxs("span", { className: "td-mono", style: { color: 'var(--color-text-secondary)', fontSize: '0.8rem' }, children: ["#", emergencyCase.case_id] }), _jsxs("span", { className: `badge ${triageBadgeClass}`, children: [emergencyCase.triage_level, " Triage"] }), _jsx("span", { className: `badge ${statusBadgeClass}`, children: emergencyCase.status.replace('_', ' ') })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(User, { className: "h-4 w-4", style: { color: 'var(--color-secondary)' } }), _jsx("span", { className: "case-patient-name", children: emergencyCase.patient_name })] }), _jsxs("div", { className: "case-meta-row", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(Building, { className: "h-3.5 w-3.5", style: { color: 'var(--color-text-muted)' } }), _jsx("span", { children: hospital?.name || `Hospital #${emergencyCase.hospital_id}` })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(Clock, { className: "h-3.5 w-3.5", style: { color: 'var(--color-text-muted)' } }), _jsxs("span", { children: ["Reported ", reportedTime.toLocaleDateString(), " at", ' ', reportedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] })] })] })] }), _jsxs("div", { className: "case-actions", children: [_jsx("label", { htmlFor: `case-status-${emergencyCase.case_id}`, style: { fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }, children: "Status:" }), _jsxs("select", { id: `case-status-${emergencyCase.case_id}`, value: emergencyCase.status, disabled: isUpdating, onChange: (e) => onUpdateStatus(e.target.value), className: "input", style: { width: 'auto', height: '32px', fontSize: '0.8rem', padding: '0 8px' }, children: [_jsx("option", { value: "open", children: "Open" }), _jsx("option", { value: "admitted", children: "Admitted" }), _jsx("option", { value: "transfer_pending", children: "Transfer Pending" }), _jsx("option", { value: "discharged", children: "Discharged" })] }), _jsx("button", { onClick: onDelete, title: "Delete Case Record", className: "btn btn-secondary btn-sm", style: { padding: '4px 8px', height: '32px', color: 'var(--color-critical)' }, children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) })] })] }));
}
function CreateCaseForm({ hospitals, onSubmit, onCancel, isLoading, }) {
    const [formData, setFormData] = useState({
        patient_name: '',
        hospital_id: hospitals[0]?.hospital_id ? String(hospitals[0].hospital_id) : '',
        triage_level: 'yellow',
        status: 'open',
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.patient_name.trim() || !formData.hospital_id)
            return;
        onSubmit({
            patient_name: formData.patient_name.trim(),
            hospital_id: Number(formData.hospital_id),
            triage_level: formData.triage_level,
            status: formData.status,
        });
    };
    return (_jsxs("div", { className: "ops-card", style: { borderColor: 'var(--color-secondary-light)' }, children: [_jsxs("div", { className: "ops-card-header", children: [_jsxs("h3", { className: "ops-card-title", children: [_jsx(User, { className: "h-4 w-4", style: { color: 'var(--color-secondary)' } }), _jsx("span", { children: "Intake Emergency Patient" })] }), _jsx("button", { onClick: onCancel, style: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }, "aria-label": "Close form", children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { className: "form-grid-2", children: [_jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "patient_name", className: "form-field-label", children: "Patient Full Name *" }), _jsx("input", { id: "patient_name", type: "text", required: true, value: formData.patient_name, onChange: (e) => setFormData({ ...formData, patient_name: e.target.value }), className: "input", placeholder: "e.g. Aditi Kulkarni" })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "hospital_id", className: "form-field-label", children: "Receiving Hospital Facility *" }), _jsxs("select", { id: "hospital_id", required: true, value: formData.hospital_id, onChange: (e) => setFormData({ ...formData, hospital_id: e.target.value }), className: "input", children: [_jsx("option", { value: "", children: "Select receiving hospital..." }), hospitals.map((h) => (_jsxs("option", { value: h.hospital_id, children: [h.name, " - ", h.city] }, h.hospital_id)))] })] })] }), _jsxs("div", { className: "form-grid-2", children: [_jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "triage_level", className: "form-field-label", children: "Initial Triage Severity Level *" }), _jsxs("select", { id: "triage_level", required: true, value: formData.triage_level, onChange: (e) => setFormData({ ...formData, triage_level: e.target.value }), className: "input", children: [_jsx("option", { value: "red", children: "Red (Critical - Immediate Resuscitation / Bed)" }), _jsx("option", { value: "yellow", children: "Yellow (Urgent - Serious Condition)" }), _jsx("option", { value: "green", children: "Green (Stable - Non-urgent)" })] })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "case_status", className: "form-field-label", children: "Initial Status" }), _jsxs("select", { id: "case_status", required: true, value: formData.status, onChange: (e) => setFormData({ ...formData, status: e.target.value }), className: "input", children: [_jsx("option", { value: "open", children: "Open (Awaiting Bed / Resource Assignment)" }), _jsx("option", { value: "admitted", children: "Admitted" }), _jsx("option", { value: "transfer_pending", children: "Transfer Pending" })] })] })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--color-border-light)' }, children: [_jsx("button", { type: "button", onClick: onCancel, className: "btn btn-secondary", disabled: isLoading, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: isLoading, children: isLoading ? 'Registering...' : 'Register Patient Case' })] })] })] }));
}
