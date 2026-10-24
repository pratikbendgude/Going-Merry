import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Bed, Activity, Ambulance as AmbulanceIcon, Droplet, Filter, X } from 'lucide-react';
export default function Resources() {
    const [activeTab, setActiveTab] = useState('beds');
    const [hospitalFilter, setHospitalFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [notification, setNotification] = useState(null);
    // Blood Unit Issuance state
    const [issuingUnit, setIssuingUnit] = useState(null);
    const [selectedCaseId, setSelectedCaseId] = useState('');
    const [issueError, setIssueError] = useState('');
    const queryClient = useQueryClient();
    const { data: hospitals = [] } = useQuery({
        queryKey: ['hospitals'],
        queryFn: () => api.getHospitals(),
    });
    const { data: emergencyCases = [] } = useQuery({
        queryKey: ['emergency-cases'],
        queryFn: () => api.getEmergencyCases(),
    });
    const { data: beds = [], isLoading: bedsLoading } = useQuery({
        queryKey: ['beds', hospitalFilter, statusFilter],
        queryFn: () => api.getBeds({
            hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
            status: statusFilter || undefined,
        }),
        enabled: activeTab === 'beds',
    });
    const { data: ventilators = [], isLoading: ventLoading } = useQuery({
        queryKey: ['ventilators', hospitalFilter, statusFilter],
        queryFn: () => api.getVentilators({
            hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
            status: statusFilter || undefined,
        }),
        enabled: activeTab === 'ventilators',
    });
    const { data: ambulances = [], isLoading: ambLoading } = useQuery({
        queryKey: ['ambulances', hospitalFilter, statusFilter],
        queryFn: () => api.getAmbulances({
            hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
            status: statusFilter || undefined,
        }),
        enabled: activeTab === 'ambulances',
    });
    const { data: bloodUnits = [], isLoading: bloodLoading } = useQuery({
        queryKey: ['blood-units', hospitalFilter, statusFilter],
        queryFn: () => api.getBloodUnits({
            hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
            status: statusFilter || undefined,
        }),
        enabled: activeTab === 'blood_units',
    });
    // Status update mutations
    const updateBedMutation = useMutation({
        mutationFn: ({ id, status }) => api.updateBedStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['beds'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setNotification({ type: 'success', text: 'Bed status updated.' });
        },
        onError: (err) => setNotification({ type: 'error', text: err.message }),
    });
    const updateVentMutation = useMutation({
        mutationFn: ({ id, status }) => api.updateVentilatorStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ventilators'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setNotification({ type: 'success', text: 'Ventilator status updated.' });
        },
        onError: (err) => setNotification({ type: 'error', text: err.message }),
    });
    const updateAmbMutation = useMutation({
        mutationFn: ({ id, status }) => api.updateAmbulanceStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ambulances'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setNotification({ type: 'success', text: 'Ambulance status updated.' });
        },
        onError: (err) => setNotification({ type: 'error', text: err.message }),
    });
    const issueBloodMutation = useMutation({
        mutationFn: ({ unitId, caseId }) => api.issueBloodUnit(unitId, caseId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blood-units'] });
            queryClient.invalidateQueries({ queryKey: ['emergency-cases'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setNotification({ type: 'success', text: 'Blood unit issued successfully to patient case.' });
            setIssuingUnit(null);
            setSelectedCaseId('');
            setIssueError('');
        },
        onError: (err) => setIssueError(err.message || 'Failed to issue blood unit'),
    });
    const isLoading = bedsLoading || ventLoading || ambLoading || bloodLoading;
    return (_jsxs("div", { className: "page-container", children: [_jsx("div", { className: "page-header", children: _jsxs("div", { className: "page-header-text", children: [_jsx("h1", { className: "page-title", children: "Resource Inventory Management" }), _jsx("p", { className: "page-subtitle", children: "Track, filter, and configure critical facility equipment across all medical centers" })] }) }), notification && (_jsxs("div", { className: `ops-banner ${notification.type === 'success' ? 'ops-banner-success' : 'ops-banner-critical'}`, children: [_jsx("div", { className: "ops-banner-left", children: _jsx("span", { className: "ops-banner-title", children: notification.text }) }), _jsx("button", { onClick: () => setNotification(null), style: { background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }, "aria-label": "Dismiss", children: _jsx(X, { className: "h-4 w-4" }) })] })), _jsxs("div", { className: "ops-tabs", children: [_jsxs("button", { className: `ops-tab ${activeTab === 'beds' ? 'active' : ''}`, onClick: () => {
                            setActiveTab('beds');
                            setStatusFilter('');
                        }, children: [_jsx(Bed, { className: "h-4 w-4" }), _jsx("span", { children: "Hospital Beds" })] }), _jsxs("button", { className: `ops-tab ${activeTab === 'ventilators' ? 'active' : ''}`, onClick: () => {
                            setActiveTab('ventilators');
                            setStatusFilter('');
                        }, children: [_jsx(Activity, { className: "h-4 w-4" }), _jsx("span", { children: "Ventilators" })] }), _jsxs("button", { className: `ops-tab ${activeTab === 'ambulances' ? 'active' : ''}`, onClick: () => {
                            setActiveTab('ambulances');
                            setStatusFilter('');
                        }, children: [_jsx(AmbulanceIcon, { className: "h-4 w-4" }), _jsx("span", { children: "Ambulances Fleet" })] }), _jsxs("button", { className: `ops-tab ${activeTab === 'blood_units' ? 'active' : ''}`, onClick: () => {
                            setActiveTab('blood_units');
                            setStatusFilter('');
                        }, children: [_jsx(Droplet, { className: "h-4 w-4" }), _jsx("span", { children: "Blood Bank Inventory" })] })] }), _jsxs("div", { className: "filters-bar", children: [_jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "hospital-filter", className: "filter-label", children: [_jsx(Filter, { className: "h-3.5 w-3.5" }), "Hospital Facility"] }), _jsxs("select", { id: "hospital-filter", value: hospitalFilter, onChange: (e) => setHospitalFilter(e.target.value), className: "input", children: [_jsx("option", { value: "", children: "All Hospitals" }), hospitals.map((h) => (_jsxs("option", { value: h.hospital_id, children: [h.name, " (", h.city, ")"] }, h.hospital_id)))] })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "status-filter", className: "filter-label", children: "Operational Status" }), _jsxs("select", { id: "status-filter", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "input", children: [_jsx("option", { value: "", children: "All Statuses" }), activeTab === 'beds' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "available", children: "Available" }), _jsx("option", { value: "occupied", children: "Occupied" })] })), activeTab === 'ventilators' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "available", children: "Available" }), _jsx("option", { value: "in_use", children: "In Use" }), _jsx("option", { value: "maintenance", children: "Maintenance" })] })), activeTab === 'ambulances' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "available", children: "Available" }), _jsx("option", { value: "dispatched", children: "Dispatched" }), _jsx("option", { value: "on_duty", children: "On Duty" }), _jsx("option", { value: "returning", children: "Returning" })] })), activeTab === 'blood_units' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "in_stock", children: "In Stock" }), _jsx("option", { value: "issued", children: "Issued" }), _jsx("option", { value: "expired", children: "Expired" })] }))] })] })] }), isLoading ? (_jsxs("div", { className: "state-container", children: [_jsx("div", { className: "spinner" }), _jsx("p", { className: "empty-state-text", children: "Querying resource inventory records..." })] })) : (_jsxs("div", { children: [activeTab === 'beds' && (_jsx(BedsTable, { beds: beds, hospitals: hospitals, onUpdateStatus: (id, status) => updateBedMutation.mutate({ id, status }) })), activeTab === 'ventilators' && (_jsx(VentilatorsTable, { ventilators: ventilators, hospitals: hospitals, onUpdateStatus: (id, status) => updateVentMutation.mutate({ id, status }) })), activeTab === 'ambulances' && (_jsx(AmbulancesTable, { ambulances: ambulances, hospitals: hospitals, onUpdateStatus: (id, status) => updateAmbMutation.mutate({ id, status }) })), activeTab === 'blood_units' && (_jsx(BloodUnitsTable, { bloodUnits: bloodUnits, hospitals: hospitals, onIssueUnit: (unit) => {
                            setIssuingUnit(unit);
                            setSelectedCaseId('');
                            setIssueError('');
                        } })), ((activeTab === 'beds' && beds.length === 0) ||
                        (activeTab === 'ventilators' && ventilators.length === 0) ||
                        (activeTab === 'ambulances' && ambulances.length === 0) ||
                        (activeTab === 'blood_units' && bloodUnits.length === 0)) && (_jsxs("div", { className: "state-container", children: [_jsx("p", { className: "empty-state-text", children: "No resources match the selected filter criteria." }), _jsx("p", { className: "empty-state-sub", children: "Adjust your facility or status filter above." })] }))] })), issuingUnit && (_jsx("div", { className: "modal-backdrop", children: _jsxs("div", { className: "modal-container", style: { maxWidth: '480px' }, children: [_jsxs("div", { className: "modal-header", children: [_jsxs("div", { children: [_jsxs("h3", { className: "modal-title", children: ["Issue Blood Unit #", issuingUnit.unit_id] }), _jsxs("p", { className: "card-sub", style: { marginTop: '0.25rem' }, children: ["Group: ", _jsx("strong", { children: issuingUnit.blood_group }), " | Facility: ", hospitals.find(h => h.hospital_id === issuingUnit.hospital_id)?.name || `#${issuingUnit.hospital_id}`] })] }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => setIssuingUnit(null), children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "card-body", children: [issueError && (_jsx("div", { className: "ops-banner ops-banner-critical", style: { marginBottom: '1rem' }, children: _jsx("span", { className: "ops-banner-title", children: issueError }) })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "field-label", htmlFor: "patient-case-select", children: "Select Patient Emergency Case *" }), _jsxs("select", { id: "patient-case-select", className: "input", value: selectedCaseId, onChange: (e) => setSelectedCaseId(e.target.value), children: [_jsx("option", { value: "", children: "-- Choose Emergency Case --" }), emergencyCases
                                                    .filter((c) => c.status !== 'discharged')
                                                    .map((c) => (_jsxs("option", { value: c.case_id, children: ["Case #", c.case_id, " - ", c.patient_name, " (", c.triage_level.toUpperCase(), " | ", c.status, ")"] }, c.case_id)))] }), _jsxs("p", { className: "field-hint", children: ["Unit expiry date: ", issuingUnit.expiry_date, ". Must not be expired."] })] })] }), _jsxs("div", { className: "modal-footer", children: [_jsx("button", { type: "button", className: "btn btn-secondary", onClick: () => setIssuingUnit(null), disabled: issueBloodMutation.isPending, children: "Cancel" }), _jsx("button", { type: "button", className: "btn btn-primary", disabled: !selectedCaseId || issueBloodMutation.isPending, onClick: () => {
                                        if (selectedCaseId) {
                                            issueBloodMutation.mutate({
                                                unitId: issuingUnit.unit_id,
                                                caseId: Number(selectedCaseId),
                                            });
                                        }
                                    }, children: issueBloodMutation.isPending ? 'Issuing...' : 'Confirm Issue' })] })] }) }))] }));
}
function BedsTable({ beds, hospitals, onUpdateStatus, }) {
    const getHospitalName = (id) => hospitals.find((h) => h.hospital_id === id)?.name || `Hospital #${id}`;
    if (beds.length === 0)
        return null;
    return (_jsx("div", { className: "table-wrapper", children: _jsx("div", { className: "table-scroll", children: _jsxs("table", { className: "ops-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Bed ID" }), _jsx("th", { children: "Hospital Facility" }), _jsx("th", { children: "Bed Category" }), _jsx("th", { children: "Current Status" }), _jsx("th", { style: { textAlign: 'right' }, children: "Update Status" })] }) }), _jsx("tbody", { children: beds.map((bed) => (_jsxs("tr", { children: [_jsxs("td", { className: "td-mono", children: ["#", bed.bed_id] }), _jsx("td", { children: getHospitalName(bed.hospital_id) }), _jsx("td", { children: _jsx("span", { className: `badge ${bed.bed_type === 'icu' ? 'badge-info' : 'badge-neutral'}`, children: bed.bed_type.toUpperCase() }) }), _jsx("td", { children: _jsx("span", { className: `badge ${bed.status === 'available' ? 'badge-success' : 'badge-warning'}`, children: bed.status }) }), _jsx("td", { style: { textAlign: 'right' }, children: _jsxs("select", { value: bed.status, onChange: (e) => onUpdateStatus(bed.bed_id, e.target.value), className: "input", style: { width: 'auto', display: 'inline-block', height: '30px', fontSize: '0.775rem' }, children: [_jsx("option", { value: "available", children: "Available" }), _jsx("option", { value: "occupied", children: "Occupied" })] }) })] }, bed.bed_id))) })] }) }) }));
}
function VentilatorsTable({ ventilators, hospitals, onUpdateStatus, }) {
    const getHospitalName = (id) => hospitals.find((h) => h.hospital_id === id)?.name || `Hospital #${id}`;
    if (ventilators.length === 0)
        return null;
    return (_jsx("div", { className: "table-wrapper", children: _jsx("div", { className: "table-scroll", children: _jsxs("table", { className: "ops-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Ventilator ID" }), _jsx("th", { children: "Hospital Facility" }), _jsx("th", { children: "Status" }), _jsx("th", { style: { textAlign: 'right' }, children: "Update Status" })] }) }), _jsx("tbody", { children: ventilators.map((vent) => (_jsxs("tr", { children: [_jsxs("td", { className: "td-mono", children: ["#", vent.ventilator_id] }), _jsx("td", { children: getHospitalName(vent.hospital_id) }), _jsx("td", { children: _jsx("span", { className: `badge ${vent.status === 'available'
                                            ? 'badge-success'
                                            : vent.status === 'in_use'
                                                ? 'badge-warning'
                                                : 'badge-critical'}`, children: vent.status.replace('_', ' ') }) }), _jsx("td", { style: { textAlign: 'right' }, children: _jsxs("select", { value: vent.status, onChange: (e) => onUpdateStatus(vent.ventilator_id, e.target.value), className: "input", style: { width: 'auto', display: 'inline-block', height: '30px', fontSize: '0.775rem' }, children: [_jsx("option", { value: "available", children: "Available" }), _jsx("option", { value: "in_use", children: "In Use" }), _jsx("option", { value: "maintenance", children: "Maintenance" })] }) })] }, vent.ventilator_id))) })] }) }) }));
}
function AmbulancesTable({ ambulances, hospitals, onUpdateStatus, }) {
    const getHospitalName = (id) => hospitals.find((h) => h.hospital_id === id)?.name || `Hospital #${id}`;
    if (ambulances.length === 0)
        return null;
    return (_jsx("div", { className: "table-wrapper", children: _jsx("div", { className: "table-scroll", children: _jsxs("table", { className: "ops-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Ambulance ID" }), _jsx("th", { children: "Vehicle Registration" }), _jsx("th", { children: "Hospital Station" }), _jsx("th", { children: "Fleet Status" }), _jsx("th", { style: { textAlign: 'right' }, children: "Update Status" })] }) }), _jsx("tbody", { children: ambulances.map((amb) => (_jsxs("tr", { children: [_jsxs("td", { className: "td-mono", children: ["#", amb.ambulance_id] }), _jsx("td", { className: "td-mono", style: { fontWeight: 700 }, children: amb.vehicle_no }), _jsx("td", { children: getHospitalName(amb.hospital_id) }), _jsx("td", { children: _jsx("span", { className: `badge ${amb.status === 'available'
                                            ? 'badge-success'
                                            : amb.status === 'dispatched'
                                                ? 'badge-warning'
                                                : amb.status === 'on_duty'
                                                    ? 'badge-info'
                                                    : 'badge-neutral'}`, children: amb.status.replace('_', ' ') }) }), _jsx("td", { style: { textAlign: 'right' }, children: _jsxs("select", { value: amb.status, onChange: (e) => onUpdateStatus(amb.ambulance_id, e.target.value), className: "input", style: { width: 'auto', display: 'inline-block', height: '30px', fontSize: '0.775rem' }, children: [_jsx("option", { value: "available", children: "Available" }), _jsx("option", { value: "dispatched", children: "Dispatched" }), _jsx("option", { value: "on_duty", children: "On Duty" }), _jsx("option", { value: "returning", children: "Returning" })] }) })] }, amb.ambulance_id))) })] }) }) }));
}
function BloodUnitsTable({ bloodUnits, hospitals, onIssueUnit, }) {
    const getHospitalName = (id) => hospitals.find((h) => h.hospital_id === id)?.name || `Hospital #${id}`;
    if (bloodUnits.length === 0)
        return null;
    return (_jsx("div", { className: "table-wrapper", children: _jsx("div", { className: "table-scroll", children: _jsxs("table", { className: "ops-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Unit ID" }), _jsx("th", { children: "Blood Group" }), _jsx("th", { children: "Hospital Blood Bank" }), _jsx("th", { children: "Expiration Date" }), _jsx("th", { children: "Inventory Status" }), _jsx("th", { style: { textAlign: 'right' }, children: "Patient Allocation" })] }) }), _jsx("tbody", { children: bloodUnits.map((unit) => (_jsxs("tr", { children: [_jsxs("td", { className: "td-mono", children: ["#", unit.unit_id] }), _jsx("td", { children: _jsxs("span", { className: "badge badge-critical", style: { fontSize: '0.8rem' }, children: [_jsx(Droplet, { className: "h-3 w-3", style: { fill: 'currentColor' } }), unit.blood_group] }) }), _jsx("td", { children: getHospitalName(unit.hospital_id) }), _jsx("td", { style: { fontSize: '0.8rem', color: 'var(--color-text-secondary)' }, children: unit.expiry_date }), _jsx("td", { children: _jsx("span", { className: `badge ${unit.status === 'in_stock'
                                            ? 'badge-success'
                                            : unit.status === 'issued'
                                                ? 'badge-info'
                                                : 'badge-critical'}`, children: unit.status.replace('_', ' ') }) }), _jsx("td", { style: { textAlign: 'right' }, children: unit.status === 'in_stock' ? (_jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => onIssueUnit(unit), style: { fontSize: '0.75rem', padding: '0.25rem 0.6rem' }, children: "Issue to Case" })) : unit.status === 'issued' ? (_jsxs("span", { className: "badge badge-info", style: { fontSize: '0.75rem' }, children: ["Case #", unit.case_id] })) : (_jsx("span", { className: "badge badge-neutral", style: { fontSize: '0.75rem' }, children: "Expired" })) })] }, unit.unit_id))) })] }) }) }));
}
