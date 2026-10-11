import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/simpleApi';
import { Bed, Activity, Ambulance, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
export default function Allocations() {
    const [mode, setMode] = useState('bed');
    const [selectedCase, setSelectedCase] = useState('');
    const [selectedResource, setSelectedResource] = useState('');
    const [message, setMessage] = useState(null);
    const queryClient = useQueryClient();
    // Fetch emergency cases
    const { data: cases = [], isLoading: casesLoading, error: casesError } = useQuery({
        queryKey: ['emergency-cases'],
        queryFn: () => api.getEmergencyCases(),
    });
    // Fetch hospitals for name lookup
    const { data: hospitals = [], isLoading: hospitalsLoading, error: hospitalsError } = useQuery({
        queryKey: ['hospitals'],
        queryFn: () => api.getHospitals(),
    });
    // Fetch resources based on mode
    const { data: beds = [], isLoading: bedsLoading } = useQuery({
        queryKey: ['available-beds'],
        queryFn: () => api.getBeds(),
        enabled: mode === 'bed',
    });
    const { data: ventilators = [], isLoading: ventilatorsLoading } = useQuery({
        queryKey: ['available-ventilators'],
        queryFn: () => api.getVentilators(),
        enabled: mode === 'ventilator',
    });
    const { data: ambulances = [], isLoading: ambulancesLoading } = useQuery({
        queryKey: ['available-ambulances'],
        queryFn: () => api.getAmbulances(),
        enabled: mode === 'ambulance',
    });
    const bedAllocation = useMutation({
        mutationFn: ({ bedId, caseId }) => api.allocateBed(bedId, caseId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['available-beds'] });
            queryClient.invalidateQueries({ queryKey: ['beds'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setMessage({ type: 'success', text: 'Bed allocated successfully' });
            setSelectedCase('');
            setSelectedResource('');
        },
        onError: (error) => {
            setMessage({ type: 'error', text: error.message });
        },
    });
    const ventilatorAllocation = useMutation({
        mutationFn: ({ ventilatorId, caseId }) => api.allocateVentilator(ventilatorId, caseId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['available-ventilators'] });
            queryClient.invalidateQueries({ queryKey: ['ventilators'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setMessage({ type: 'success', text: 'Ventilator allocated successfully' });
            setSelectedCase('');
            setSelectedResource('');
        },
        onError: (error) => {
            setMessage({ type: 'error', text: error.message });
        },
    });
    const ambulanceDispatch = useMutation({
        mutationFn: ({ ambulanceId, caseId }) => api.dispatchAmbulance(ambulanceId, caseId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['available-ambulances'] });
            queryClient.invalidateQueries({ queryKey: ['ambulances'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setMessage({ type: 'success', text: 'Ambulance dispatched successfully' });
            setSelectedCase('');
            setSelectedResource('');
        },
        onError: (error) => {
            setMessage({ type: 'error', text: error.message });
        },
    });
    const handleAllocate = () => {
        if (!selectedCase || !selectedResource) {
            setMessage({ type: 'error', text: 'Please select both a case and a resource' });
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
    const getHospitalName = (id) => {
        const hospital = hospitals.find(h => h.hospital_id === id);
        return hospital ? hospital.name : `Hospital ${id}`;
    };
    const isLoading = casesLoading ||
        hospitalsLoading ||
        bedsLoading ||
        ventilatorsLoading ||
        ambulancesLoading ||
        bedAllocation.isPending ||
        ventilatorAllocation.isPending ||
        ambulanceDispatch.isPending;
    return (_jsxs("div", { className: "page-container", children: [_jsxs("div", { className: "page-header", children: [_jsx("h1", { className: "page-title", children: "Resource Allocation" }), _jsx("p", { className: "page-subtitle", children: "Assign resources to emergency cases" })] }), casesError && (_jsxs("div", { className: "alert alert-error mb-4", children: ["Failed to load emergency cases: ", casesError.message] })), hospitalsError && (_jsxs("div", { className: "alert alert-error mb-4", children: ["Failed to load hospitals: ", hospitalsError.message] })), message && (_jsxs("div", { className: `alert mb-6 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`, children: [message.type === 'success' ? (_jsx(CheckCircle, { className: "h-5 w-5" })) : (_jsx(XCircle, { className: "h-5 w-5" })), _jsx("span", { children: message.text }), _jsx("button", { onClick: () => setMessage(null), className: "ml-auto text-sm underline", children: "Dismiss" })] })), _jsxs("div", { className: "tabs mb-6", children: [_jsxs("button", { className: `tab ${mode === 'bed' ? 'tab-active' : ''}`, onClick: () => {
                            setMode('bed');
                            setSelectedResource('');
                        }, children: [_jsx(Bed, { className: "h-4 w-4" }), "Allocate Bed"] }), _jsxs("button", { className: `tab ${mode === 'ventilator' ? 'tab-active' : ''}`, onClick: () => {
                            setMode('ventilator');
                            setSelectedResource('');
                        }, children: [_jsx(Activity, { className: "h-4 w-4" }), "Allocate Ventilator"] }), _jsxs("button", { className: `tab ${mode === 'ambulance' ? 'tab-active' : ''}`, onClick: () => {
                            setMode('ambulance');
                            setSelectedResource('');
                        }, children: [_jsx(Ambulance, { className: "h-4 w-4" }), "Dispatch Ambulance"] })] }), _jsxs("div", { className: "form-card", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4", children: [mode === 'bed' && 'Bed Allocation', mode === 'ventilator' && 'Ventilator Allocation', mode === 'ambulance' && 'Ambulance Dispatch'] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "case", className: "form-label", children: "Select Emergency Case" }), _jsxs("select", { id: "case", value: selectedCase, onChange: (e) => setSelectedCase(e.target.value), className: "input", disabled: isLoading || casesLoading, children: [_jsx("option", { value: "", children: "Choose a case..." }), cases.map((c) => (_jsxs("option", { value: c.case_id, children: ["Case #", c.case_id, " - ", c.patient_name, " (", c.triage_level.toUpperCase(), ") - ", getHospitalName(c.hospital_id)] }, c.case_id))), cases.length === 0 && (_jsx("p", { className: "text-sm text-gray-500 mt-2", children: "No cases available" }))] })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "resource", className: "form-label", children: [mode === 'bed' && 'Select Available Bed', mode === 'ventilator' && 'Select Available Ventilator', mode === 'ambulance' && 'Select Available Ambulance'] }), _jsxs("select", { id: "resource", value: selectedResource, onChange: (e) => setSelectedResource(e.target.value), className: "input", disabled: isLoading, children: [_jsx("option", { value: "", children: "Choose a resource..." }), mode === 'bed' &&
                                                beds.map((bed) => (_jsxs("option", { value: bed.bed_id, children: ["Bed #", bed.bed_id, " (", bed.bed_type.toUpperCase(), ") - ", getHospitalName(bed.hospital_id)] }, bed.bed_id))), mode === 'ventilator' &&
                                                ventilators.map((vent) => (_jsxs("option", { value: vent.ventilator_id, children: ["Ventilator #", vent.ventilator_id, " - ", getHospitalName(vent.hospital_id)] }, vent.ventilator_id))), mode === 'ambulance' &&
                                                ambulances.map((amb) => (_jsxs("option", { value: amb.ambulance_id, children: ["Ambulance #", amb.ambulance_id, " (", amb.vehicle_no, ") - ", getHospitalName(amb.hospital_id)] }, amb.ambulance_id)))] }), mode === 'bed' && beds.length === 0 && (_jsxs("p", { className: "text-sm text-amber-600 mt-2 flex items-center gap-2", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), "No beds available"] })), mode === 'ventilator' && ventilators.length === 0 && (_jsxs("p", { className: "text-sm text-amber-600 mt-2 flex items-center gap-2", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), "No ventilators available"] })), mode === 'ambulance' && ambulances.length === 0 && (_jsxs("p", { className: "text-sm text-amber-600 mt-2 flex items-center gap-2", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), "No ambulances available"] }))] })] }), _jsx("div", { className: "mt-6", children: _jsx("button", { onClick: handleAllocate, disabled: !selectedCase || !selectedResource || isLoading, className: "btn btn-primary", children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "spinner-small" }), "Processing..."] })) : (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "h-4 w-4" }), mode === 'bed' && 'Allocate Bed', mode === 'ventilator' && 'Allocate Ventilator', mode === 'ambulance' && 'Dispatch Ambulance'] })) }) })] }), _jsx("div", { className: "mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg", children: _jsxs("p", { className: "text-sm text-blue-900", children: [_jsx("strong", { children: "Note:" }), " Resource allocations are transaction-safe and prevent concurrent allocation conflicts. Once allocated, resources will be marked as unavailable until released."] }) })] }));
}
