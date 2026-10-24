import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, } from '../lib/api';
import { ArrowRightLeft, Plus, Play, CheckCircle, XCircle, Ambulance as AmbulanceIcon, X, Filter, } from 'lucide-react';
export default function Transfers() {
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [notification, setNotification] = useState(null);
    // Form State
    const [fromHospitalId, setFromHospitalId] = useState('');
    const [toHospitalId, setToHospitalId] = useState('');
    const [caseId, setCaseId] = useState('');
    const [ambulanceId, setAmbulanceId] = useState('');
    const [shortageReason, setShortageReason] = useState('');
    const [formError, setFormError] = useState('');
    const queryClient = useQueryClient();
    // Queries
    const { data: transfers = [], isLoading: transfersLoading } = useQuery({
        queryKey: ['transfers', statusFilter],
        queryFn: () => api.getTransfers({ status: statusFilter || undefined }),
        refetchInterval: 15000,
    });
    const { data: hospitals = [] } = useQuery({
        queryKey: ['hospitals'],
        queryFn: () => api.getHospitals(),
    });
    const { data: cases = [] } = useQuery({
        queryKey: ['emergency-cases'],
        queryFn: () => api.getEmergencyCases(),
    });
    const { data: availableAmbulances = [] } = useQuery({
        queryKey: ['ambulances', 'available'],
        queryFn: () => api.getAmbulances({ status: 'available' }),
    });
    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['transfers'] });
        queryClient.invalidateQueries({ queryKey: ['emergency-cases'] });
        queryClient.invalidateQueries({ queryKey: ['ambulances'] });
        queryClient.invalidateQueries({ queryKey: ['beds'] });
        queryClient.invalidateQueries({ queryKey: ['ventilators'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };
    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => api.createTransfer(data),
        onSuccess: (transfer) => {
            invalidateAll();
            setNotification({
                type: 'success',
                text: `Transfer request #${transfer.transfer_id} created successfully.`,
            });
            setShowCreateModal(false);
            resetForm();
        },
        onError: (err) => setFormError(err.message || 'Failed to create transfer request'),
    });
    const startMutation = useMutation({
        mutationFn: (id) => api.startTransfer(id),
        onSuccess: (transfer) => {
            invalidateAll();
            setNotification({
                type: 'success',
                text: `Transfer #${transfer.transfer_id} is now in progress. Ambulance dispatched.`,
            });
        },
        onError: (err) => setNotification({ type: 'error', text: err.message }),
    });
    const completeMutation = useMutation({
        mutationFn: (id) => api.completeTransfer(id),
        onSuccess: (transfer) => {
            invalidateAll();
            setNotification({
                type: 'success',
                text: `Transfer #${transfer.transfer_id} completed. Patient admitted to destination hospital.`,
            });
        },
        onError: (err) => setNotification({ type: 'error', text: err.message }),
    });
    const cancelMutation = useMutation({
        mutationFn: (id) => api.cancelTransfer(id),
        onSuccess: (transfer) => {
            invalidateAll();
            setNotification({
                type: 'success',
                text: `Transfer #${transfer.transfer_id} cancelled. Resources and case status restored.`,
            });
        },
        onError: (err) => setNotification({ type: 'error', text: err.message }),
    });
    const resetForm = () => {
        setFromHospitalId('');
        setToHospitalId('');
        setCaseId('');
        setAmbulanceId('');
        setShortageReason('');
        setFormError('');
    };
    const handleCreateSubmit = (e) => {
        e.preventDefault();
        setFormError('');
        if (!fromHospitalId || !toHospitalId || !caseId) {
            setFormError('Please select source hospital, destination hospital, and patient case.');
            return;
        }
        if (fromHospitalId === toHospitalId) {
            setFormError('Source and destination hospitals cannot be identical.');
            return;
        }
        createMutation.mutate({
            from_hospital_id: Number(fromHospitalId),
            to_hospital_id: Number(toHospitalId),
            case_id: Number(caseId),
            ambulance_id: ambulanceId ? Number(ambulanceId) : null,
            shortage_reason: shortageReason || undefined,
        });
    };
    const getHospitalName = (id) => hospitals.find((h) => h.hospital_id === id)?.name || `Hospital #${id}`;
    const getCaseName = (id) => {
        const c = cases.find((item) => item.case_id === id);
        return c ? `${c.patient_name} (${c.triage_level.toUpperCase()})` : `Case #${id}`;
    };
    const isMutating = createMutation.isPending ||
        startMutation.isPending ||
        completeMutation.isPending ||
        cancelMutation.isPending;
    return (_jsxs("div", { className: "page-container", children: [_jsxs("div", { className: "page-header", children: [_jsxs("div", { className: "page-header-text", children: [_jsx("h1", { className: "page-title", children: "Inter-Hospital Patient Transfers" }), _jsx("p", { className: "page-subtitle", children: "Coordinate emergency transfers, ambulance assignments, and hospital reception" })] }), _jsx("div", { className: "header-actions", children: _jsxs("button", { type: "button", className: "btn btn-primary", onClick: () => {
                                resetForm();
                                setShowCreateModal(true);
                            }, children: [_jsx(Plus, { className: "h-4 w-4" }), "Request Transfer"] }) })] }), notification && (_jsxs("div", { className: `ops-banner ${notification.type === 'success' ? 'ops-banner-success' : 'ops-banner-critical'}`, children: [_jsx("div", { className: "ops-banner-left", children: _jsx("span", { className: "ops-banner-title", children: notification.text }) }), _jsx("button", { onClick: () => setNotification(null), style: { background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }, "aria-label": "Dismiss", children: _jsx(X, { className: "h-4 w-4" }) })] })), _jsx("div", { className: "card", style: { marginBottom: '1.5rem', padding: '1rem' }, children: _jsxs("div", { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }, children: [_jsxs("span", { style: { fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginRight: '0.5rem' }, children: [_jsx(Filter, { className: "h-4 w-4", style: { display: 'inline', verticalAlign: 'middle', marginRight: '4px' } }), "Filter Status:"] }), [
                            { value: '', label: 'All Transfers' },
                            { value: 'requested', label: 'Requested' },
                            { value: 'in_progress', label: 'In Progress' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' },
                        ].map((tab) => (_jsx("button", { type: "button", className: `btn btn-sm ${statusFilter === tab.value ? 'btn-primary' : 'btn-secondary'}`, onClick: () => setStatusFilter(tab.value), children: tab.label }, tab.value)))] }) }), transfersLoading ? (_jsxs("div", { className: "state-container", children: [_jsx("div", { className: "state-spinner" }), _jsx("p", { className: "state-title", children: "Loading transfer logs..." })] })) : transfers.length === 0 ? (_jsxs("div", { className: "card", style: { textAlign: 'center', padding: '3rem' }, children: [_jsx(ArrowRightLeft, { className: "h-10 w-10", style: { color: 'var(--color-text-secondary)', margin: '0 auto 1rem', opacity: 0.5 } }), _jsx("h3", { className: "card-title", children: "No Transfers Found" }), _jsx("p", { className: "card-sub", style: { marginTop: '0.5rem' }, children: statusFilter
                            ? `There are currently no transfers with status '${statusFilter}'.`
                            : 'No patient transfer requests have been initiated yet.' })] })) : (_jsx("div", { className: "table-wrapper", children: _jsx("div", { className: "table-scroll", children: _jsxs("table", { className: "ops-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Transfer ID" }), _jsx("th", { children: "Patient Case" }), _jsx("th", { children: "Routing" }), _jsx("th", { children: "Ambulance" }), _jsx("th", { children: "Reason" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Timestamps" }), _jsx("th", { style: { textAlign: 'right' }, children: "Actions" })] }) }), _jsx("tbody", { children: transfers.map((t) => (_jsxs("tr", { children: [_jsxs("td", { className: "td-mono", children: ["#", t.transfer_id] }), _jsx("td", { children: _jsx("div", { style: { fontWeight: 600 }, children: getCaseName(t.case_id) }) }), _jsx("td", { children: _jsxs("div", { style: { fontSize: '0.825rem' }, children: [_jsxs("div", { children: [_jsx("strong", { children: "From:" }), " ", getHospitalName(t.from_hospital_id)] }), _jsxs("div", { style: { color: 'var(--color-navy-secondary)' }, children: [_jsx("strong", { children: "To:" }), " ", getHospitalName(t.to_hospital_id)] })] }) }), _jsx("td", { children: t.ambulance_id ? (_jsxs("span", { className: "badge badge-neutral", style: { fontSize: '0.775rem' }, children: [_jsx(AmbulanceIcon, { className: "h-3 w-3" }), "Amb #", t.ambulance_id] })) : (_jsx("span", { style: { color: 'var(--color-text-secondary)', fontSize: '0.8rem' }, children: "None" })) }), _jsx("td", { style: { fontSize: '0.8rem', maxWidth: '160px' }, children: t.shortage_reason || '—' }), _jsx("td", { children: _jsx("span", { className: `badge ${t.status === 'completed'
                                                    ? 'badge-success'
                                                    : t.status === 'in_progress' || t.status === 'in_transit'
                                                        ? 'badge-warning'
                                                        : t.status === 'requested'
                                                            ? 'badge-info'
                                                            : 'badge-neutral'}`, children: t.status.replace('_', ' ') }) }), _jsxs("td", { style: { fontSize: '0.75rem', color: 'var(--color-text-secondary)' }, children: [_jsxs("div", { children: ["Req: ", new Date(t.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] }), t.completed_at && (_jsxs("div", { children: ["Done: ", new Date(t.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] }))] }), _jsxs("td", { style: { textAlign: 'right', whiteSpace: 'nowrap' }, children: [t.status === 'requested' && (_jsxs("div", { style: { display: 'inline-flex', gap: '0.4rem' }, children: [_jsxs("button", { type: "button", className: "btn btn-sm btn-primary", disabled: isMutating, onClick: () => startMutation.mutate(t.transfer_id), title: "Dispatch ambulance and start transfer", children: [_jsx(Play, { className: "h-3 w-3" }), "Start"] }), _jsxs("button", { type: "button", className: "btn btn-sm btn-secondary", disabled: isMutating, onClick: () => cancelMutation.mutate(t.transfer_id), children: [_jsx(X, { className: "h-3 w-3" }), "Cancel"] })] })), (t.status === 'in_progress' || t.status === 'in_transit') && (_jsxs("div", { style: { display: 'inline-flex', gap: '0.4rem' }, children: [_jsxs("button", { type: "button", className: "btn btn-sm btn-primary", disabled: isMutating, onClick: () => completeMutation.mutate(t.transfer_id), title: "Complete arrival, admit to destination and release source resources", children: [_jsx(CheckCircle, { className: "h-3 w-3" }), "Complete"] }), _jsxs("button", { type: "button", className: "btn btn-sm btn-secondary", disabled: isMutating, onClick: () => cancelMutation.mutate(t.transfer_id), children: [_jsx(XCircle, { className: "h-3 w-3" }), "Cancel"] })] })), (t.status === 'completed' || t.status === 'cancelled') && (_jsx("span", { className: "badge badge-neutral", style: { fontSize: '0.75rem' }, children: "Closed" }))] })] }, t.transfer_id))) })] }) }) })), showCreateModal && (_jsx("div", { className: "modal-backdrop", children: _jsxs("div", { className: "modal-container", style: { maxWidth: '520px' }, children: [_jsxs("div", { className: "modal-header", children: [_jsxs("div", { children: [_jsx("h3", { className: "modal-title", children: "Request Patient Transfer" }), _jsx("p", { className: "card-sub", style: { marginTop: '0.25rem' }, children: "Initiate inter-facility transfer with concurrency verification" })] }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => setShowCreateModal(false), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs("form", { onSubmit: handleCreateSubmit, children: [_jsxs("div", { className: "card-body", children: [formError && (_jsx("div", { className: "ops-banner ops-banner-critical", style: { marginBottom: '1rem' }, children: _jsx("span", { className: "ops-banner-title", children: formError }) })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "field-label", htmlFor: "source-hosp", children: "Source Hospital (From) *" }), _jsxs("select", { id: "source-hosp", className: "input", value: fromHospitalId, onChange: (e) => setFromHospitalId(e.target.value), required: true, children: [_jsx("option", { value: "", children: "-- Select Source Facility --" }), hospitals.map((h) => (_jsxs("option", { value: h.hospital_id, children: [h.name, " (", h.city, ")"] }, h.hospital_id)))] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "field-label", htmlFor: "dest-hosp", children: "Destination Hospital (To) *" }), _jsxs("select", { id: "dest-hosp", className: "input", value: toHospitalId, onChange: (e) => setToHospitalId(e.target.value), required: true, children: [_jsx("option", { value: "", children: "-- Select Receiving Facility --" }), hospitals
                                                            .filter((h) => String(h.hospital_id) !== fromHospitalId)
                                                            .map((h) => (_jsxs("option", { value: h.hospital_id, children: [h.name, " (", h.city, ")"] }, h.hospital_id)))] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "field-label", htmlFor: "case-select", children: "Emergency Case / Patient *" }), _jsxs("select", { id: "case-select", className: "input", value: caseId, onChange: (e) => setCaseId(e.target.value), required: true, children: [_jsx("option", { value: "", children: "-- Select Patient Case --" }), cases
                                                            .filter((c) => !fromHospitalId || String(c.hospital_id) === fromHospitalId)
                                                            .filter((c) => c.status !== 'discharged')
                                                            .map((c) => (_jsxs("option", { value: c.case_id, children: ["Case #", c.case_id, " - ", c.patient_name, " (", c.triage_level.toUpperCase(), " | ", c.status, ")"] }, c.case_id)))] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "field-label", htmlFor: "amb-select", children: "Assigned Ambulance (Optional)" }), _jsxs("select", { id: "amb-select", className: "input", value: ambulanceId, onChange: (e) => setAmbulanceId(e.target.value), children: [_jsx("option", { value: "", children: "-- No Ambulance Assigned --" }), availableAmbulances
                                                            .filter((a) => !fromHospitalId || String(a.hospital_id) === fromHospitalId)
                                                            .map((a) => (_jsxs("option", { value: a.ambulance_id, children: ["#", a.ambulance_id, " - ", a.vehicle_no, " (", getHospitalName(a.hospital_id), ")"] }, a.ambulance_id)))] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "field-label", htmlFor: "shortage-reason", children: "Shortage / Transfer Reason" }), _jsx("input", { id: "shortage-reason", type: "text", className: "input", placeholder: "e.g. ICU bed shortage, specialist required", value: shortageReason, maxLength: 100, onChange: (e) => setShortageReason(e.target.value) })] })] }), _jsxs("div", { className: "modal-footer", children: [_jsx("button", { type: "button", className: "btn btn-secondary", onClick: () => setShowCreateModal(false), disabled: createMutation.isPending, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: createMutation.isPending, children: createMutation.isPending ? 'Submitting...' : 'Create Transfer Request' })] })] })] }) }))] }));
}
