import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MapPin, Phone, Hospital as HospitalIcon, Bed, Activity, Ambulance, AlertCircle, Plus, Edit2, Trash2, X, Check, } from 'lucide-react';
export default function Hospitals() {
    const [searchCity, setSearchCity] = useState('');
    const [traumaFilter, setTraumaFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingHospital, setEditingHospital] = useState(null);
    const [notification, setNotification] = useState(null);
    const queryClient = useQueryClient();
    const { data: hospitals, isLoading, error, } = useQuery({
        queryKey: ['hospitals-with-resources', searchCity, traumaFilter],
        queryFn: () => api.getHospitalsWithResources({
            city: searchCity || undefined,
            trauma_level: traumaFilter || undefined,
        }),
    });
    const createMutation = useMutation({
        mutationFn: (data) => api.createHospital(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hospitals-with-resources'] });
            queryClient.invalidateQueries({ queryKey: ['hospitals'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setShowModal(false);
            setNotification({ type: 'success', text: 'Hospital facility registered successfully.' });
        },
        onError: (err) => {
            setNotification({ type: 'error', text: err.message });
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.updateHospital(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hospitals-with-resources'] });
            queryClient.invalidateQueries({ queryKey: ['hospitals'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setShowModal(false);
            setEditingHospital(null);
            setNotification({ type: 'success', text: 'Hospital details updated successfully.' });
        },
        onError: (err) => {
            setNotification({ type: 'error', text: err.message });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteHospital(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hospitals-with-resources'] });
            queryClient.invalidateQueries({ queryKey: ['hospitals'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setNotification({ type: 'success', text: 'Hospital deleted successfully.' });
        },
        onError: (err) => {
            setNotification({ type: 'error', text: err.message });
        },
    });
    const handleOpenCreate = () => {
        setEditingHospital(null);
        setShowModal(true);
    };
    const handleOpenEdit = (hosp) => {
        setEditingHospital(hosp);
        setShowModal(true);
    };
    const handleDelete = (hosp) => {
        if (confirm(`Are you sure you want to delete ${hosp.name}? This will succeed only if no beds or cases are attached.`)) {
            deleteMutation.mutate(hosp.hospital_id);
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "page-container", children: _jsxs("div", { className: "state-container", children: [_jsx("div", { className: "spinner" }), _jsx("p", { className: "empty-state-text", children: "Loading hospital network directory..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "page-container", children: _jsxs("div", { className: "state-container", children: [_jsx(AlertCircle, { className: "h-12 w-12", style: { color: 'var(--color-critical)', marginBottom: '12px' } }), _jsx("h2", { className: "empty-state-text", children: "Failed to load hospitals" }), _jsx("p", { className: "empty-state-sub", children: error.message })] }) }));
    }
    return (_jsxs("div", { className: "page-container", children: [_jsxs("div", { className: "page-header", children: [_jsxs("div", { className: "page-header-text", children: [_jsx("h1", { className: "page-title", children: "Hospital Network Facilities" }), _jsx("p", { className: "page-subtitle", children: "Registered medical facilities and live equipment capacities across the emergency grid" })] }), _jsx("div", { className: "page-actions", children: _jsxs("button", { onClick: handleOpenCreate, className: "btn btn-primary", children: [_jsx(Plus, { className: "h-4 w-4" }), _jsx("span", { children: "Register Hospital" })] }) })] }), notification && (_jsxs("div", { className: `ops-banner ${notification.type === 'success' ? 'ops-banner-success' : 'ops-banner-critical'}`, children: [_jsx("div", { className: "ops-banner-left", children: _jsx("span", { className: "ops-banner-title", children: notification.text }) }), _jsx("button", { onClick: () => setNotification(null), style: { background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }, "aria-label": "Dismiss", children: _jsx(X, { className: "h-4 w-4" }) })] })), _jsxs("div", { className: "filters-bar", children: [_jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "city-filter", className: "filter-label", children: [_jsx(MapPin, { className: "h-3.5 w-3.5" }), "City Search"] }), _jsx("input", { id: "city-filter", type: "text", placeholder: "Filter by city (e.g. Mumbai, Pune)...", value: searchCity, onChange: (e) => setSearchCity(e.target.value), className: "input" })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "trauma-filter", className: "filter-label", children: "Trauma Center Level" }), _jsxs("select", { id: "trauma-filter", value: traumaFilter, onChange: (e) => setTraumaFilter(e.target.value ? Number(e.target.value) : ''), className: "input", children: [_jsx("option", { value: "", children: "All Trauma Levels (1 - 5)" }), _jsx("option", { value: "1", children: "Level 1 (Tertiary / Immediate Trauma Care)" }), _jsx("option", { value: "2", children: "Level 2" }), _jsx("option", { value: "3", children: "Level 3" }), _jsx("option", { value: "4", children: "Level 4" }), _jsx("option", { value: "5", children: "Level 5" })] })] })] }), hospitals && hospitals.length === 0 ? (_jsxs("div", { className: "state-container", children: [_jsx(HospitalIcon, { className: "h-12 w-12", style: { color: 'var(--color-text-muted)', marginBottom: '12px' } }), _jsx("p", { className: "empty-state-text", children: "No hospitals match your filter criteria" }), _jsx("p", { className: "empty-state-sub", children: "Try searching for another city or selecting all trauma levels." })] })) : (_jsx("div", { className: "hospitals-grid", children: hospitals?.map((hospital) => (_jsx(HospitalCard, { hospital: hospital, onEdit: () => handleOpenEdit(hospital), onDelete: () => handleDelete(hospital) }, hospital.hospital_id))) })), showModal && (_jsx(HospitalModal, { initialData: editingHospital, isLoading: createMutation.isPending || updateMutation.isPending, onClose: () => {
                    setShowModal(false);
                    setEditingHospital(null);
                }, onSubmit: (data) => {
                    if (editingHospital) {
                        updateMutation.mutate({ id: editingHospital.hospital_id, data });
                    }
                    else {
                        createMutation.mutate(data);
                    }
                } }))] }));
}
function HospitalCard({ hospital, onEdit, onDelete, }) {
    const bedPct = hospital.total_beds > 0
        ? Math.round((hospital.available_beds / hospital.total_beds) * 100)
        : 0;
    const ventPct = hospital.total_ventilators > 0
        ? Math.round((hospital.available_ventilators / hospital.total_ventilators) * 100)
        : 0;
    const isLowCapacity = hospital.available_beds < 2 || hospital.available_ventilators === 0;
    return (_jsxs("div", { className: "hospital-card", children: [_jsxs("div", { className: "hospital-card-header", children: [_jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("h3", { className: "hospital-name", children: hospital.name }), _jsxs("div", { className: "hospital-meta", children: [_jsxs("div", { className: "hospital-meta-row", children: [_jsx(MapPin, { className: "h-3.5 w-3.5", style: { color: 'var(--color-secondary)' } }), _jsx("span", { style: { fontWeight: 600, color: 'var(--color-text-primary)' }, children: hospital.city }), hospital.location && _jsxs("span", { children: ["\u2022 ", hospital.location] })] }), hospital.contact_no && (_jsxs("div", { className: "hospital-meta-row", children: [_jsx(Phone, { className: "h-3.5 w-3.5", style: { color: 'var(--color-text-muted)' } }), _jsx("span", { children: hospital.contact_no })] }))] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }, children: [hospital.trauma_level && (_jsxs("span", { className: "badge badge-info", children: ["Level ", hospital.trauma_level] })), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("button", { onClick: onEdit, className: "btn btn-secondary btn-sm", title: "Edit hospital details", style: { padding: '4px 6px', height: '26px' }, children: _jsx(Edit2, { className: "h-3.5 w-3.5" }) }), _jsx("button", { onClick: onDelete, className: "btn btn-secondary btn-sm", title: "Delete hospital", style: { padding: '4px 6px', height: '26px', color: 'var(--color-critical)' }, children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) })] })] })] }), _jsxs("div", { className: "hospital-resources-body", children: [_jsxs("div", { className: "resource-metric-row", children: [_jsxs("div", { className: "resource-metric-header", children: [_jsxs("span", { className: "resource-metric-label", children: [_jsx(Bed, { className: "h-4 w-4", style: { color: 'var(--color-secondary)' } }), _jsx("span", { children: "Available Beds" })] }), _jsxs("span", { className: "resource-metric-val", children: [hospital.available_beds, " / ", hospital.total_beds] })] }), _jsx("div", { className: "progress-track", children: _jsx("div", { className: "progress-fill", style: { width: `${bedPct}%`, backgroundColor: 'var(--color-secondary)' } }) })] }), _jsxs("div", { className: "resource-metric-row", children: [_jsxs("div", { className: "resource-metric-header", children: [_jsxs("span", { className: "resource-metric-label", children: [_jsx(Activity, { className: "h-4 w-4", style: { color: 'var(--color-success)' } }), _jsx("span", { children: "Ventilators Ready" })] }), _jsxs("span", { className: "resource-metric-val", children: [hospital.available_ventilators, " / ", hospital.total_ventilators] })] }), _jsx("div", { className: "progress-track", children: _jsx("div", { className: "progress-fill", style: { width: `${ventPct}%`, backgroundColor: 'var(--color-success)' } }) })] }), _jsx("div", { className: "resource-metric-row", children: _jsxs("div", { className: "resource-metric-header", children: [_jsxs("span", { className: "resource-metric-label", children: [_jsx(Ambulance, { className: "h-4 w-4", style: { color: 'var(--color-warning)' } }), _jsx("span", { children: "Ambulances Stationed" })] }), _jsxs("span", { className: "resource-metric-val", children: [hospital.available_ambulances, " / ", hospital.total_ambulances] })] }) })] }), isLowCapacity && (_jsxs("div", { className: "hospital-card-footer", children: [_jsx(AlertCircle, { className: "h-3.5 w-3.5" }), _jsx("span", { children: "Limited reserve capacity" })] }))] }));
}
function HospitalModal({ initialData, isLoading, onClose, onSubmit, }) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        city: initialData?.city || '',
        location: initialData?.location || '',
        contact_no: initialData?.contact_no || '',
        trauma_level: initialData?.trauma_level ? String(initialData.trauma_level) : '1',
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            name: formData.name.trim(),
            city: formData.city.trim(),
            location: formData.location.trim() || null,
            contact_no: formData.contact_no.trim() || null,
            trauma_level: formData.trauma_level ? Number(formData.trauma_level) : null,
        });
    };
    return (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "modal-window", children: [_jsxs("div", { className: "modal-header", children: [_jsx("h3", { className: "modal-title", children: initialData ? 'Edit Hospital Facility' : 'Register New Hospital Facility' }), _jsx("button", { onClick: onClose, style: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }, "aria-label": "Close", children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "modal-body", children: [_jsxs("div", { className: "form-field", children: [_jsx("label", { className: "form-field-label", htmlFor: "name", children: "Hospital Facility Name *" }), _jsx("input", { id: "name", required: true, className: "input", placeholder: "e.g. Metro Trauma Hospital", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }) })] }), _jsxs("div", { className: "form-grid-2", children: [_jsxs("div", { className: "form-field", children: [_jsx("label", { className: "form-field-label", htmlFor: "city", children: "City *" }), _jsx("input", { id: "city", required: true, className: "input", placeholder: "e.g. Mumbai", value: formData.city, onChange: (e) => setFormData({ ...formData, city: e.target.value }) })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { className: "form-field-label", htmlFor: "trauma", children: "Trauma Level" }), _jsxs("select", { id: "trauma", className: "input", value: formData.trauma_level, onChange: (e) => setFormData({ ...formData, trauma_level: e.target.value }), children: [_jsx("option", { value: "1", children: "Level 1 (Highest)" }), _jsx("option", { value: "2", children: "Level 2" }), _jsx("option", { value: "3", children: "Level 3" }), _jsx("option", { value: "4", children: "Level 4" }), _jsx("option", { value: "5", children: "Level 5" })] })] })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { className: "form-field-label", htmlFor: "location", children: "Street / Area Location" }), _jsx("input", { id: "location", className: "input", placeholder: "e.g. Central Avenue, Sector 4", value: formData.location, onChange: (e) => setFormData({ ...formData, location: e.target.value }) })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { className: "form-field-label", htmlFor: "contact", children: "Emergency Dispatch Contact Number" }), _jsx("input", { id: "contact", className: "input", placeholder: "e.g. 022-26543210", value: formData.contact_no, onChange: (e) => setFormData({ ...formData, contact_no: e.target.value }) })] })] }), _jsxs("div", { className: "modal-footer", children: [_jsx("button", { type: "button", onClick: onClose, className: "btn btn-secondary", disabled: isLoading, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "spinner-small" }), _jsx("span", { children: "Saving..." })] })) : (_jsxs(_Fragment, { children: [_jsx(Check, { className: "h-4 w-4" }), _jsx("span", { children: initialData ? 'Update Facility' : 'Register Facility' })] })) })] })] })] }) }));
}
