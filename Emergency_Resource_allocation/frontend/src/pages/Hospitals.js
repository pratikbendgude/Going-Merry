import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MapPin, Phone, Hospital, Bed, Activity, Ambulance, AlertCircle } from 'lucide-react';
export default function Hospitals() {
    const [searchCity, setSearchCity] = useState('');
    const [traumaFilter, setTraumaFilter] = useState('');
    const { data: hospitals, isLoading, error } = useQuery({
        queryKey: ['hospitals-with-resources', searchCity, traumaFilter],
        queryFn: () => api.getHospitalsWithResources({
            city: searchCity || undefined,
            trauma_level: traumaFilter || undefined,
        }),
    });
    if (isLoading) {
        return (_jsx("div", { className: "page-container", children: _jsxs("div", { className: "loading-state", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading hospitals..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "page-container", children: _jsxs("div", { className: "error-state", children: [_jsx(AlertCircle, { className: "h-12 w-12 text-red-500 mb-4" }), _jsx("p", { className: "text-lg font-medium", children: "Failed to load hospitals" }), _jsx("p", { className: "text-sm text-gray-600", children: error.message })] }) }));
    }
    return (_jsxs("div", { className: "page-container", children: [_jsx("div", { className: "page-header", children: _jsxs("div", { children: [_jsx("h1", { className: "page-title", children: "Hospital Network" }), _jsx("p", { className: "page-subtitle", children: "Registered facilities and their resource availability" })] }) }), _jsxs("div", { className: "filters-bar", children: [_jsxs("div", { className: "filter-group", children: [_jsxs("label", { htmlFor: "city", className: "filter-label", children: [_jsx(MapPin, { className: "h-4 w-4" }), "City"] }), _jsx("input", { id: "city", type: "text", placeholder: "Filter by city...", value: searchCity, onChange: (e) => setSearchCity(e.target.value), className: "input" })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { htmlFor: "trauma-level", className: "filter-label", children: "Trauma Level" }), _jsxs("select", { id: "trauma-level", value: traumaFilter, onChange: (e) => setTraumaFilter(e.target.value ? Number(e.target.value) : ''), className: "input", children: [_jsx("option", { value: "", children: "All levels" }), _jsx("option", { value: "1", children: "Level 1" }), _jsx("option", { value: "2", children: "Level 2" }), _jsx("option", { value: "3", children: "Level 3" }), _jsx("option", { value: "4", children: "Level 4" }), _jsx("option", { value: "5", children: "Level 5" })] })] })] }), hospitals && hospitals.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx(Hospital, { className: "h-16 w-16 text-gray-300 mb-4" }), _jsx("p", { className: "text-lg font-medium text-gray-600", children: "No hospitals found" }), _jsx("p", { className: "text-sm text-gray-500", children: "Try adjusting your filters" })] })) : (_jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: hospitals?.map((hospital) => (_jsx(HospitalCard, { hospital: hospital }, hospital.hospital_id))) }))] }));
}
function HospitalCard({ hospital }) {
    const bedAvailability = hospital.total_beds > 0
        ? ((hospital.available_beds / hospital.total_beds) * 100).toFixed(0)
        : '0';
    const ventAvailability = hospital.total_ventilators > 0
        ? ((hospital.available_ventilators / hospital.total_ventilators) * 100).toFixed(0)
        : '0';
    const isLowCapacity = hospital.available_beds < 2 || hospital.available_ventilators === 0;
    return (_jsxs("div", { className: `hospital-card ${isLowCapacity ? 'border-amber-300' : ''}`, children: [_jsx("div", { className: "hospital-header", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "hospital-name", children: hospital.name }), _jsxs("div", { className: "hospital-location", children: [_jsx(MapPin, { className: "h-4 w-4" }), _jsx("span", { children: hospital.city }), hospital.location && _jsxs("span", { className: "text-gray-500", children: ["\u2022 ", hospital.location] })] }), hospital.contact_no && (_jsxs("div", { className: "hospital-contact", children: [_jsx(Phone, { className: "h-4 w-4" }), _jsx("span", { children: hospital.contact_no })] }))] }), hospital.trauma_level && (_jsxs("div", { className: "trauma-badge", children: ["Level ", hospital.trauma_level] }))] }) }), _jsxs("div", { className: "hospital-resources", children: [_jsxs("div", { className: "resource-item", children: [_jsx("div", { className: "resource-icon bg-blue-50", children: _jsx(Bed, { className: "h-5 w-5 text-blue-600" }) }), _jsxs("div", { className: "resource-details", children: [_jsx("p", { className: "resource-label", children: "Beds" }), _jsxs("p", { className: "resource-value", children: [hospital.available_beds, " / ", hospital.total_beds] }), _jsx("div", { className: "resource-bar", children: _jsx("div", { className: "resource-bar-fill bg-blue-500", style: { width: `${bedAvailability}%` } }) })] })] }), _jsxs("div", { className: "resource-item", children: [_jsx("div", { className: "resource-icon bg-green-50", children: _jsx(Activity, { className: "h-5 w-5 text-green-600" }) }), _jsxs("div", { className: "resource-details", children: [_jsx("p", { className: "resource-label", children: "Ventilators" }), _jsxs("p", { className: "resource-value", children: [hospital.available_ventilators, " / ", hospital.total_ventilators] }), _jsx("div", { className: "resource-bar", children: _jsx("div", { className: "resource-bar-fill bg-green-500", style: { width: `${ventAvailability}%` } }) })] })] }), _jsxs("div", { className: "resource-item", children: [_jsx("div", { className: "resource-icon bg-amber-50", children: _jsx(Ambulance, { className: "h-5 w-5 text-amber-600" }) }), _jsxs("div", { className: "resource-details", children: [_jsx("p", { className: "resource-label", children: "Ambulances" }), _jsxs("p", { className: "resource-value", children: [hospital.available_ambulances, " / ", hospital.total_ambulances] })] })] })] }), isLowCapacity && (_jsxs("div", { className: "capacity-warning", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx("span", { children: "Limited capacity" })] }))] }));
}
