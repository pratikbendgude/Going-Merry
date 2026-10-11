import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/simpleApi';
import { Bed, Activity, Ambulance, Filter } from 'lucide-react';
export default function Resources() {
    const [activeTab, setActiveTab] = useState('beds');
    const [hospitalFilter, setHospitalFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const { data: beds = [], isLoading: bedsLoading } = useQuery({
        queryKey: ['beds', hospitalFilter, statusFilter],
        queryFn: () => api.getBedsWithParams({
            hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
            status: statusFilter || undefined,
            bed_type: undefined,
        }),
        enabled: activeTab === 'beds',
    });
    const { data: ventilators = [], isLoading: ventLoading } = useQuery({
        queryKey: ['ventilators', hospitalFilter, statusFilter],
        queryFn: () => api.getVentilatorsWithParams({
            hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
            status: statusFilter || undefined,
        }),
        enabled: activeTab === 'ventilators',
    });
    const { data: ambulances = [], isLoading: ambLoading } = useQuery({
        queryKey: ['ambulances', hospitalFilter, statusFilter],
        queryFn: () => api.getAmbulancesWithParams({
            hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
            status: statusFilter || undefined,
        }),
        enabled: activeTab === 'ambulances',
    });
    const { data: hospitals = [] } = useQuery({
        queryKey: ['hospitals'],
        queryFn: () => api.getHospitals(),
    });
    const isLoading = bedsLoading || ventLoading || ambLoading;
    return (_jsxs("div", { className: "page-container", children: [_jsxs("div", { className: "page-header", children: [_jsx("h1", { className: "page-title", children: "Resource Inventory" }), _jsx("p", { className: "page-subtitle", children: "Real-time tracking of beds, ventilators, and ambulances" })] }), _jsxs("div", { className: "tabs", children: [_jsxs("button", { className: `tab ${activeTab === 'beds' ? 'tab-active' : ''}`, onClick: () => setActiveTab('beds'), children: [_jsx(Bed, { className: "h-4 w-4" }), "Beds"] }), _jsxs("button", { className: `tab ${activeTab === 'ventilators' ? 'tab-active' : ''}`, onClick: () => setActiveTab('ventilators'), children: [_jsx(Activity, { className: "h-4 w-4" }), "Ventilators"] }), _jsxs("button", { className: `tab ${activeTab === 'ambulances' ? 'tab-active' : ''}`, onClick: () => setActiveTab('ambulances'), children: [_jsx(Ambulance, { className: "h-4 w-4" }), "Ambulances"] })] }), _jsxs("div", { className: "filters-bar", children: [_jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "hospital", className: "filter-label", children: [_jsx(Filter, { className: "h-4 w-4" }), "Hospital"] }), _jsxs("select", { id: "hospital", value: hospitalFilter, onChange: (e) => setHospitalFilter(e.target.value), className: "input", children: [_jsx("option", { value: "", children: "All hospitals" }), hospitals.map((h) => (_jsx("option", { value: h.hospital_id, children: h.name }, h.hospital_id)))] })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "status", className: "filter-label", children: "Status" }), _jsxs("select", { id: "status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "input", children: [_jsx("option", { value: "", children: "All statuses" }), activeTab === 'beds' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "available", children: "Available" }), _jsx("option", { value: "occupied", children: "Occupied" })] })), activeTab === 'ventilators' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "available", children: "Available" }), _jsx("option", { value: "in_use", children: "In Use" }), _jsx("option", { value: "maintenance", children: "Maintenance" })] })), activeTab === 'ambulances' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "available", children: "Available" }), _jsx("option", { value: "dispatched", children: "Dispatched" }), _jsx("option", { value: "returning", children: "Returning" })] }))] })] })] }), isLoading ? (_jsxs("div", { className: "loading-state", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading resources..." })] })) : (_jsxs("div", { className: "resource-table-container", children: [activeTab === 'beds' && beds.length > 0 && (_jsx(BedsTable, { beds: beds, hospitals: hospitals })), activeTab === 'ventilators' && ventilators.length > 0 && (_jsx(VentilatorsTable, { ventilators: ventilators, hospitals: hospitals })), activeTab === 'ambulances' && ambulances.length > 0 && (_jsx(AmbulancesTable, { ambulances: ambulances, hospitals: hospitals })), (activeTab === 'beds' && beds.length === 0) ||
                        (activeTab === 'ventilators' && ventilators.length === 0) ||
                        (activeTab === 'ambulances' && ambulances.length === 0) && (_jsx("div", { className: "empty-state", children: _jsx("p", { children: "No resources found" }) }))] }))] }));
}
function BedsTable({ beds, hospitals }) {
    const getHospitalName = (id) => hospitals.find(h => h.hospital_id === id)?.name || `Hospital ${id}`;
    return (_jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Bed ID" }), _jsx("th", { children: "Hospital" }), _jsx("th", { children: "Type" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: beds.map((bed) => (_jsxs("tr", { children: [_jsx("td", { className: "font-mono", children: bed.bed_id }), _jsx("td", { children: getHospitalName(bed.hospital_id) }), _jsx("td", { children: _jsx("span", { className: `badge ${bed.bed_type === 'icu' ? 'badge-blue' : 'badge-gray'}`, children: bed.bed_type.toUpperCase() }) }), _jsx("td", { children: _jsx("span", { className: `status-badge ${bed.status === 'available' ? 'status-success' : 'status-warning'}`, children: bed.status }) })] }, bed.bed_id))) })] }));
}
function VentilatorsTable({ ventilators, hospitals }) {
    const getHospitalName = (id) => hospitals.find(h => h.hospital_id === id)?.name || `Hospital ${id}`;
    return (_jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Ventilator ID" }), _jsx("th", { children: "Hospital" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: ventilators.map((vent) => (_jsxs("tr", { children: [_jsx("td", { className: "font-mono", children: vent.ventilator_id }), _jsx("td", { children: getHospitalName(vent.hospital_id) }), _jsx("td", { children: _jsx("span", { className: `status-badge ${vent.status === 'available' ? 'status-success' :
                                    vent.status === 'in_use' ? 'status-warning' : 'status-error'}`, children: vent.status.replace('_', ' ') }) })] }, vent.ventilator_id))) })] }));
}
function AmbulancesTable({ ambulances, hospitals }) {
    const getHospitalName = (id) => hospitals.find(h => h.hospital_id === id)?.name || `Hospital ${id}`;
    return (_jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Ambulance ID" }), _jsx("th", { children: "Vehicle Number" }), _jsx("th", { children: "Hospital" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: ambulances.map((amb) => (_jsxs("tr", { children: [_jsx("td", { className: "font-mono", children: amb.ambulance_id }), _jsx("td", { className: "font-mono font-semibold", children: amb.vehicle_no }), _jsx("td", { children: getHospitalName(amb.hospital_id) }), _jsx("td", { children: _jsx("span", { className: `status-badge ${amb.status === 'available' ? 'status-success' :
                                    amb.status === 'dispatched' ? 'status-warning' : 'status-info'}`, children: amb.status }) })] }, amb.ambulance_id))) })] }));
}
