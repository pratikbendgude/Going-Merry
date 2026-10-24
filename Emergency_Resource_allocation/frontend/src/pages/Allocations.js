import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, } from '../lib/api';
import { Bed as BedIcon, Activity, Ambulance as AmbulanceIcon, AlertCircle, CheckCircle, XCircle, RotateCcw, ShieldCheck, User, X, } from 'lucide-react';
export default function Allocations() {
    const [mode, setMode] = useState('bed');
    const [selectedCase, setSelectedCase] = useState('');
    const [selectedResource, setSelectedResource] = useState('');
    const [message, setMessage] = useState(null);
    const queryClient = useQueryClient();
    // Emergency cases
    const { data: cases = [], isLoading: casesLoading } = useQuery({
        queryKey: ['emergency-cases'],
        queryFn: () => api.getEmergencyCases(),
    });
    // Hospitals
    const { data: hospitals = [] } = useQuery({
        queryKey: ['hospitals'],
        queryFn: () => api.getHospitals(),
    });
    // Available resources only (ensures operator only selects available inventory)
    const { data: availableBeds = [], isLoading: bedsLoading } = useQuery({
        queryKey: ['available-beds'],
        queryFn: () => api.getBeds({ status: 'available' }),
    });
    const { data: availableVentilators = [], isLoading: ventsLoading } = useQuery({
        queryKey: ['available-ventilators'],
        queryFn: () => api.getVentilators({ status: 'available' }),
    });
    const { data: availableAmbulances = [], isLoading: ambsLoading } = useQuery({
        queryKey: ['available-ambulances'],
        queryFn: () => api.getAmbulances({ status: 'available' }),
    });
    // Active allocations to show outcomes and permit release
    const { data: activeBeds = [] } = useQuery({
        queryKey: ['active-bed-allocations'],
        queryFn: () => api.getActiveBedAllocations(),
    });
    const { data: activeVents = [] } = useQuery({
        queryKey: ['active-ventilator-allocations'],
        queryFn: () => api.getActiveVentilatorAllocations(),
    });
    const { data: activeAmbs = [] } = useQuery({
        queryKey: ['active-ambulance-dispatches'],
        queryFn: () => api.getActiveAmbulanceDispatches(),
    });
    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['available-beds'] });
        queryClient.invalidateQueries({ queryKey: ['available-ventilators'] });
        queryClient.invalidateQueries({ queryKey: ['available-ambulances'] });
        queryClient.invalidateQueries({ queryKey: ['active-bed-allocations'] });
        queryClient.invalidateQueries({ queryKey: ['active-ventilator-allocations'] });
        queryClient.invalidateQueries({ queryKey: ['active-ambulance-dispatches'] });
        queryClient.invalidateQueries({ queryKey: ['beds'] });
        queryClient.invalidateQueries({ queryKey: ['ventilators'] });
        queryClient.invalidateQueries({ queryKey: ['ambulances'] });
        queryClient.invalidateQueries({ queryKey: ['hospitals-with-resources'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };
    // Allocation Mutations
    const bedAllocation = useMutation({
        mutationFn: ({ bedId, caseId }) => api.allocateBed(bedId, caseId),
        onSuccess: (data) => {
            invalidateAll();
            setMessage({
                type: 'success',
                text: `Successfully allocated Bed #${data.bed_id} to Case #${data.case_id}. Bed status set to occupied.`,
            });
            setSelectedCase('');
            setSelectedResource('');
        },
        onError: (error) => {
            setMessage({ type: 'error', text: error.message });
        },
    });
    const ventilatorAllocation = useMutation({
        mutationFn: ({ ventilatorId, caseId }) => api.allocateVentilator(ventilatorId, caseId),
        onSuccess: (data) => {
            invalidateAll();
            setMessage({
                type: 'success',
                text: `Successfully allocated Ventilator #${data.ventilator_id} to Case #${data.case_id}. Status set to in_use.`,
            });
            setSelectedCase('');
            setSelectedResource('');
        },
        onError: (error) => {
            setMessage({ type: 'error', text: error.message });
        },
    });
    const ambulanceDispatch = useMutation({
        mutationFn: ({ ambulanceId, caseId }) => api.dispatchAmbulance(ambulanceId, caseId),
        onSuccess: (data) => {
            invalidateAll();
            setMessage({
                type: 'success',
                text: `Ambulance #${data.ambulance_id} dispatched to Case #${data.case_id}. Fleet status set to dispatched.`,
            });
            setSelectedCase('');
            setSelectedResource('');
        },
        onError: (error) => {
            setMessage({ type: 'error', text: error.message });
        },
    });
    // Release Mutations
    const releaseBedMutation = useMutation({
        mutationFn: ({ bedId, caseId }) => api.releaseBed(bedId, caseId),
        onSuccess: (data) => {
            invalidateAll();
            setMessage({
                type: 'success',
                text: `Bed #${data.bed_id} released successfully and returned to available inventory.`,
            });
        },
        onError: (err) => setMessage({ type: 'error', text: err.message }),
    });
    const releaseVentilatorMutation = useMutation({
        mutationFn: ({ ventilatorId, caseId }) => api.releaseVentilator(ventilatorId, caseId),
        onSuccess: (data) => {
            invalidateAll();
            setMessage({
                type: 'success',
                text: `Ventilator #${data.ventilator_id} released and marked available for new patients.`,
            });
        },
        onError: (err) => setMessage({ type: 'error', text: err.message }),
    });
    const markAmbulanceArrivedMutation = useMutation({
        mutationFn: ({ ambulanceId, caseId }) => api.markAmbulanceArrived(ambulanceId, caseId),
        onSuccess: (data) => {
            invalidateAll();
            setMessage({
                type: 'success',
                text: `Ambulance #${data.ambulance_id} arrival logged. Vehicle returned to available fleet.`,
            });
        },
        onError: (err) => setMessage({ type: 'error', text: err.message }),
    });
    const handleAllocate = () => {
        if (!selectedCase || !selectedResource) {
            setMessage({ type: 'error', text: 'Please select both an emergency case and an available resource.' });
            return;
        }
        const caseId = Number(selectedCase);
        const resourceId = Number(selectedResource);
        if (mode === 'bed') {
            bedAllocation.mutate({ bedId: resourceId, caseId });
        }
        else if (mode === 'ventilator') {
            ventilatorAllocation.mutate({ ventilatorId: resourceId, caseId });
        }
        else {
            ambulanceDispatch.mutate({ ambulanceId: resourceId, caseId });
        }
    };
    const getHospitalName = (id) => hospitals.find((h) => h.hospital_id === id)?.name || `Hospital #${id}`;
    const getPatientName = (caseId) => cases.find((c) => c.case_id === caseId)?.patient_name || `Patient (Case #${caseId})`;
    const eligibleCases = cases.filter((c) => c.status !== 'discharged');
    const isSubmitting = bedAllocation.isPending || ventilatorAllocation.isPending || ambulanceDispatch.isPending;
    return (_jsxs("div", { className: "page-container", children: [_jsx("div", { className: "page-header", children: _jsxs("div", { className: "page-header-text", children: [_jsx("h1", { className: "page-title", children: "Resource Allocation Engine" }), _jsx("p", { className: "page-subtitle", children: "Transaction-safe matching of critical hospital equipment and emergency patient cases" })] }) }), message && (_jsxs("div", { className: `ops-banner ${message.type === 'success' ? 'ops-banner-success' : 'ops-banner-critical'}`, children: [_jsxs("div", { className: "ops-banner-left", children: [message.type === 'success' ? (_jsx(CheckCircle, { className: "h-5 w-5 ops-banner-icon", style: { color: 'var(--color-success)' } })) : (_jsx(XCircle, { className: "h-5 w-5 ops-banner-icon", style: { color: 'var(--color-critical)' } })), _jsx("span", { className: "ops-banner-title", children: message.text })] }), _jsx("button", { onClick: () => setMessage(null), style: { background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }, "aria-label": "Dismiss", children: _jsx(X, { className: "h-4 w-4" }) })] })), _jsxs("div", { className: "ops-tabs", children: [_jsxs("button", { className: `ops-tab ${mode === 'bed' ? 'active' : ''}`, onClick: () => {
                            setMode('bed');
                            setSelectedResource('');
                        }, children: [_jsx(BedIcon, { className: "h-4 w-4" }), _jsx("span", { children: "Allocate Bed" })] }), _jsxs("button", { className: `ops-tab ${mode === 'ventilator' ? 'active' : ''}`, onClick: () => {
                            setMode('ventilator');
                            setSelectedResource('');
                        }, children: [_jsx(Activity, { className: "h-4 w-4" }), _jsx("span", { children: "Allocate Ventilator" })] }), _jsxs("button", { className: `ops-tab ${mode === 'ambulance' ? 'active' : ''}`, onClick: () => {
                            setMode('ambulance');
                            setSelectedResource('');
                        }, children: [_jsx(AmbulanceIcon, { className: "h-4 w-4" }), _jsx("span", { children: "Dispatch Ambulance" })] })] }), _jsxs("div", { className: "ops-card", children: [_jsx("div", { className: "ops-card-header", children: _jsxs("h3", { className: "ops-card-title", children: [_jsx(ShieldCheck, { className: "h-5 w-5", style: { color: 'var(--color-secondary)' } }), _jsxs("span", { children: [mode === 'bed' && 'Assign Patient Bed (ICU / General)', mode === 'ventilator' && 'Assign Life Support Ventilator', mode === 'ambulance' && 'Dispatch Emergency Response Vehicle'] })] }) }), _jsxs("div", { className: "form-grid-2", children: [_jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "case-select", className: "form-field-label", children: "Target Emergency Case *" }), _jsxs("select", { id: "case-select", value: selectedCase, onChange: (e) => setSelectedCase(e.target.value), className: "input", disabled: isSubmitting || casesLoading, children: [_jsx("option", { value: "", children: "Select emergency case..." }), eligibleCases.map((c) => (_jsxs("option", { value: c.case_id, children: ["Case #", c.case_id, " \u2022 ", c.patient_name, " [", c.triage_level.toUpperCase(), "] \u2022", ' ', getHospitalName(c.hospital_id)] }, c.case_id)))] }), _jsx("p", { className: "form-field-hint", children: "Select an open or admitted patient requiring resource assignment." })] }), _jsxs("div", { className: "form-field", children: [_jsxs("label", { htmlFor: "resource-select", className: "form-field-label", children: [mode === 'bed' && 'Available Hospital Bed *', mode === 'ventilator' && 'Available Ventilator *', mode === 'ambulance' && 'Available Ambulance *'] }), _jsxs("select", { id: "resource-select", value: selectedResource, onChange: (e) => setSelectedResource(e.target.value), className: "input", disabled: isSubmitting, children: [_jsx("option", { value: "", children: "Choose available resource..." }), mode === 'bed' &&
                                                availableBeds.map((b) => (_jsxs("option", { value: b.bed_id, children: ["Bed #", b.bed_id, " [", b.bed_type.toUpperCase(), "] \u2022 ", getHospitalName(b.hospital_id)] }, b.bed_id))), mode === 'ventilator' &&
                                                availableVentilators.map((v) => (_jsxs("option", { value: v.ventilator_id, children: ["Ventilator #", v.ventilator_id, " \u2022 ", getHospitalName(v.hospital_id)] }, v.ventilator_id))), mode === 'ambulance' &&
                                                availableAmbulances.map((a) => (_jsxs("option", { value: a.ambulance_id, children: ["Ambulance #", a.ambulance_id, " (", a.vehicle_no, ") \u2022 ", getHospitalName(a.hospital_id)] }, a.ambulance_id)))] }), mode === 'bed' && availableBeds.length === 0 && !bedsLoading && (_jsxs("p", { className: "form-field-hint", style: { color: 'var(--color-warning)', fontWeight: 600 }, children: [_jsx(AlertCircle, { className: "h-3 w-3", style: { display: 'inline', verticalAlign: '-1px' } }), " No beds currently available across hospitals."] })), mode === 'ventilator' && availableVentilators.length === 0 && !ventsLoading && (_jsxs("p", { className: "form-field-hint", style: { color: 'var(--color-warning)', fontWeight: 600 }, children: [_jsx(AlertCircle, { className: "h-3 w-3", style: { display: 'inline', verticalAlign: '-1px' } }), " No ventilators currently available."] })), mode === 'ambulance' && availableAmbulances.length === 0 && !ambsLoading && (_jsxs("p", { className: "form-field-hint", style: { color: 'var(--color-warning)', fontWeight: 600 }, children: [_jsx(AlertCircle, { className: "h-3 w-3", style: { display: 'inline', verticalAlign: '-1px' } }), " All ambulances are currently dispatched or on duty."] }))] })] }), _jsxs("div", { style: { marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }, children: [_jsxs("p", { style: { fontSize: '0.75rem', color: 'var(--color-text-secondary)', maxWidth: '520px' }, children: ["Guaranteed transactional execution via row-level locks (", _jsx("code", { children: "FOR UPDATE" }), ") to ensure no resource can be concurrently double-booked."] }), _jsx("button", { onClick: handleAllocate, disabled: !selectedCase || !selectedResource || isSubmitting, className: "btn btn-primary", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "spinner-small" }), _jsx("span", { children: "Executing Transaction..." })] })) : (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "h-4 w-4" }), _jsxs("span", { children: [mode === 'bed' && 'Commit Bed Allocation', mode === 'ventilator' && 'Commit Ventilator Allocation', mode === 'ambulance' && 'Authorize Dispatch'] })] })) })] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx("h2", { style: { fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)' }, children: "Active Resource Allocations" }), _jsx("span", { className: "badge badge-neutral", children: "Live Database Registry" })] }), _jsxs("div", { className: "table-wrapper", children: [_jsxs("div", { style: { padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(BedIcon, { className: "h-4 w-4", style: { color: 'var(--color-secondary)' } }), _jsxs("span", { style: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }, children: ["Active Bed Allocations (", activeBeds.length, ")"] })] }), activeBeds.length === 0 ? (_jsx("p", { style: { padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textAlign: 'center' }, children: "No active bed allocations currently in effect." })) : (_jsx("div", { className: "table-scroll", children: _jsxs("table", { className: "ops-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Bed ID" }), _jsx("th", { children: "Patient / Case" }), _jsx("th", { children: "Allocated At" }), _jsx("th", { style: { textAlign: 'right' }, children: "Action" })] }) }), _jsx("tbody", { children: activeBeds.map((alloc) => (_jsxs("tr", { children: [_jsxs("td", { className: "td-mono", style: { color: 'var(--color-secondary)', fontWeight: 700 }, children: ["Bed #", alloc.bed_id] }), _jsx("td", { children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(User, { className: "h-3.5 w-3.5", style: { color: 'var(--color-text-muted)' } }), _jsx("span", { style: { fontWeight: 600 }, children: getPatientName(alloc.case_id) }), _jsxs("span", { style: { fontSize: '0.75rem', color: 'var(--color-text-secondary)' }, children: ["(Case #", alloc.case_id, ")"] })] }) }), _jsxs("td", { style: { fontSize: '0.8rem', color: 'var(--color-text-secondary)' }, children: [new Date(alloc.allocated_at).toLocaleDateString(), " ", new Date(alloc.allocated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] }), _jsx("td", { style: { textAlign: 'right' }, children: _jsxs("button", { onClick: () => releaseBedMutation.mutate({ bedId: alloc.bed_id, caseId: alloc.case_id }), disabled: releaseBedMutation.isPending, className: "btn btn-secondary btn-sm", children: [_jsx(RotateCcw, { className: "h-3 w-3" }), _jsx("span", { children: "Release Bed" })] }) })] }, `${alloc.bed_id}-${alloc.case_id}`))) })] }) }))] }), _jsxs("div", { className: "table-wrapper", children: [_jsxs("div", { style: { padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Activity, { className: "h-4 w-4", style: { color: 'var(--color-success)' } }), _jsxs("span", { style: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }, children: ["Active Ventilator Allocations (", activeVents.length, ")"] })] }), activeVents.length === 0 ? (_jsx("p", { style: { padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textAlign: 'center' }, children: "No active ventilator allocations currently in effect." })) : (_jsx("div", { className: "table-scroll", children: _jsxs("table", { className: "ops-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Ventilator ID" }), _jsx("th", { children: "Patient / Case" }), _jsx("th", { children: "Allocated At" }), _jsx("th", { style: { textAlign: 'right' }, children: "Action" })] }) }), _jsx("tbody", { children: activeVents.map((alloc) => (_jsxs("tr", { children: [_jsxs("td", { className: "td-mono", style: { color: 'var(--color-success)', fontWeight: 700 }, children: ["Ventilator #", alloc.ventilator_id] }), _jsx("td", { children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(User, { className: "h-3.5 w-3.5", style: { color: 'var(--color-text-muted)' } }), _jsx("span", { style: { fontWeight: 600 }, children: getPatientName(alloc.case_id) }), _jsxs("span", { style: { fontSize: '0.75rem', color: 'var(--color-text-secondary)' }, children: ["(Case #", alloc.case_id, ")"] })] }) }), _jsxs("td", { style: { fontSize: '0.8rem', color: 'var(--color-text-secondary)' }, children: [new Date(alloc.allocated_at).toLocaleDateString(), " ", new Date(alloc.allocated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] }), _jsx("td", { style: { textAlign: 'right' }, children: _jsxs("button", { onClick: () => releaseVentilatorMutation.mutate({
                                                                ventilatorId: alloc.ventilator_id,
                                                                caseId: alloc.case_id,
                                                            }), disabled: releaseVentilatorMutation.isPending, className: "btn btn-secondary btn-sm", children: [_jsx(RotateCcw, { className: "h-3 w-3" }), _jsx("span", { children: "Release Ventilator" })] }) })] }, `${alloc.ventilator_id}-${alloc.case_id}`))) })] }) }))] }), _jsxs("div", { className: "table-wrapper", children: [_jsxs("div", { style: { padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(AmbulanceIcon, { className: "h-4 w-4", style: { color: 'var(--color-warning)' } }), _jsxs("span", { style: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }, children: ["Active Ambulance Dispatches (", activeAmbs.length, ")"] })] }), activeAmbs.length === 0 ? (_jsx("p", { style: { padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textAlign: 'center' }, children: "No ambulances currently in transit or dispatched." })) : (_jsx("div", { className: "table-scroll", children: _jsxs("table", { className: "ops-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Ambulance ID" }), _jsx("th", { children: "Patient / Case" }), _jsx("th", { children: "Dispatched At" }), _jsx("th", { style: { textAlign: 'right' }, children: "Action" })] }) }), _jsx("tbody", { children: activeAmbs.map((dispatch) => (_jsxs("tr", { children: [_jsxs("td", { className: "td-mono", style: { color: 'var(--color-warning)', fontWeight: 700 }, children: ["Ambulance #", dispatch.ambulance_id] }), _jsx("td", { children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(User, { className: "h-3.5 w-3.5", style: { color: 'var(--color-text-muted)' } }), _jsx("span", { style: { fontWeight: 600 }, children: getPatientName(dispatch.case_id) }), _jsxs("span", { style: { fontSize: '0.75rem', color: 'var(--color-text-secondary)' }, children: ["(Case #", dispatch.case_id, ")"] })] }) }), _jsxs("td", { style: { fontSize: '0.8rem', color: 'var(--color-text-secondary)' }, children: [new Date(dispatch.dispatched_at).toLocaleDateString(), " ", new Date(dispatch.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] }), _jsx("td", { style: { textAlign: 'right' }, children: _jsxs("button", { onClick: () => markAmbulanceArrivedMutation.mutate({
                                                                ambulanceId: dispatch.ambulance_id,
                                                                caseId: dispatch.case_id,
                                                            }), disabled: markAmbulanceArrivedMutation.isPending, className: "btn btn-secondary btn-sm", children: [_jsx(CheckCircle, { className: "h-3 w-3", style: { color: 'var(--color-success)' } }), _jsx("span", { children: "Mark Arrived" })] }) })] }, `${dispatch.ambulance_id}-${dispatch.case_id}`))) })] }) }))] })] })] }));
}
