const API_BASE_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:8000';
async function fetchAPI(endpoint, options) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(error.detail || `HTTP error ${response.status}`);
    }
    // Handle 204 No Content
    if (response.status === 204) {
        return {};
    }
    return response.json();
}
// API Functions
export const api = {
    // Dashboard
    getDashboard: () => fetchAPI('/dashboard'),
    // Hospitals
    getHospitals: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.city)
            searchParams.append('city', params.city);
        if (params?.trauma_level)
            searchParams.append('trauma_level', String(params.trauma_level));
        const query = searchParams.toString();
        return fetchAPI(`/hospitals${query ? `?${query}` : ''}`);
    },
    getHospital: (id) => fetchAPI(`/hospitals/${id}`),
    getHospitalResources: (id) => fetchAPI(`/hospitals/${id}/resources`),
    getHospitalsWithResources: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.city)
            searchParams.append('city', params.city);
        if (params?.trauma_level)
            searchParams.append('trauma_level', String(params.trauma_level));
        const query = searchParams.toString();
        return fetchAPI(`/hospitals/with-resources${query ? `?${query}` : ''}`);
    },
    searchHospitals: (query) => fetchAPI(`/hospitals/search?q=${encodeURIComponent(query)}`),
    createHospital: (data) => fetchAPI('/hospitals', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateHospital: (id, data) => fetchAPI(`/hospitals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    deleteHospital: (id) => fetchAPI(`/hospitals/${id}`, {
        method: 'DELETE',
    }),
    // Emergency Cases
    getEmergencyCases: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.hospital_id)
            searchParams.append('hospital_id', String(params.hospital_id));
        if (params?.status)
            searchParams.append('status', params.status);
        if (params?.triage_level)
            searchParams.append('triage_level', params.triage_level);
        const query = searchParams.toString();
        return fetchAPI(`/emergency-cases${query ? `?${query}` : ''}`);
    },
    getEmergencyCasesWithParams: (params) => api.getEmergencyCases(params),
    getEmergencyCase: (id) => fetchAPI(`/emergency-cases/${id}`),
    createEmergencyCase: (data) => fetchAPI('/emergency-cases', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateEmergencyCase: (id, data) => fetchAPI(`/emergency-cases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    deleteEmergencyCase: (id) => fetchAPI(`/emergency-cases/${id}`, {
        method: 'DELETE',
    }),
    // Resources
    getBeds: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.hospital_id)
            searchParams.append('hospital_id', String(params.hospital_id));
        if (params?.status)
            searchParams.append('status', params.status);
        if (params?.bed_type)
            searchParams.append('bed_type', params.bed_type);
        const query = searchParams.toString();
        return fetchAPI(`/resources/beds${query ? `?${query}` : ''}`);
    },
    getBedsWithParams: (params) => api.getBeds(params),
    createBed: (data) => fetchAPI('/resources/beds', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateBedStatus: (bedId, status) => fetchAPI(`/resources/beds/${bedId}/status?new_status=${encodeURIComponent(status)}`, {
        method: 'PATCH',
    }),
    getVentilators: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.hospital_id)
            searchParams.append('hospital_id', String(params.hospital_id));
        if (params?.status)
            searchParams.append('status', params.status);
        const query = searchParams.toString();
        return fetchAPI(`/resources/ventilators${query ? `?${query}` : ''}`);
    },
    getVentilatorsWithParams: (params) => api.getVentilators(params),
    createVentilator: (data) => fetchAPI('/resources/ventilators', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateVentilatorStatus: (ventilatorId, status) => fetchAPI(`/resources/ventilators/${ventilatorId}/status?new_status=${encodeURIComponent(status)}`, {
        method: 'PATCH',
    }),
    getAmbulances: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.hospital_id)
            searchParams.append('hospital_id', String(params.hospital_id));
        if (params?.status)
            searchParams.append('status', params.status);
        const query = searchParams.toString();
        return fetchAPI(`/resources/ambulances${query ? `?${query}` : ''}`);
    },
    getAmbulancesWithParams: (params) => api.getAmbulances(params),
    createAmbulance: (data) => fetchAPI('/resources/ambulances', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateAmbulanceStatus: (ambulanceId, status) => fetchAPI(`/resources/ambulances/${ambulanceId}/status?new_status=${encodeURIComponent(status)}`, {
        method: 'PATCH',
    }),
    getBloodUnits: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.hospital_id)
            searchParams.append('hospital_id', String(params.hospital_id));
        if (params?.blood_group)
            searchParams.append('blood_group', params.blood_group);
        if (params?.status)
            searchParams.append('status', params.status);
        const query = searchParams.toString();
        return fetchAPI(`/resources/blood-units${query ? `?${query}` : ''}`);
    },
    createBloodUnit: (data) => fetchAPI('/resources/blood-units', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    issueBloodUnit: (unitId, caseId) => fetchAPI(`/resources/blood-units/${unitId}/issue`, {
        method: 'POST',
        body: JSON.stringify({ case_id: caseId }),
    }),
    // Allocations
    allocateBed: (bedId, caseId) => fetchAPI('/allocations/beds', {
        method: 'POST',
        body: JSON.stringify({ bed_id: bedId, case_id: caseId }),
    }),
    releaseBed: (bedId, caseId) => fetchAPI(`/allocations/beds/${bedId}/release?case_id=${caseId}`, {
        method: 'POST',
    }),
    getActiveBedAllocations: () => fetchAPI('/allocations/beds/active'),
    allocateVentilator: (ventilatorId, caseId) => fetchAPI('/allocations/ventilators', {
        method: 'POST',
        body: JSON.stringify({ ventilator_id: ventilatorId, case_id: caseId }),
    }),
    releaseVentilator: (ventilatorId, caseId) => fetchAPI(`/allocations/ventilators/${ventilatorId}/release?case_id=${caseId}`, {
        method: 'POST',
    }),
    getActiveVentilatorAllocations: () => fetchAPI('/allocations/ventilators/active'),
    dispatchAmbulance: (ambulanceId, caseId) => fetchAPI('/allocations/ambulances', {
        method: 'POST',
        body: JSON.stringify({ ambulance_id: ambulanceId, case_id: caseId }),
    }),
    markAmbulanceArrived: (ambulanceId, caseId) => fetchAPI(`/allocations/ambulances/${ambulanceId}/arrive?case_id=${caseId}`, {
        method: 'POST',
    }),
    getActiveAmbulanceDispatches: () => fetchAPI('/allocations/ambulances/active'),
    // Transfers
    getTransfers: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.status)
            searchParams.append('status', params.status);
        if (params?.from_hospital_id)
            searchParams.append('from_hospital_id', String(params.from_hospital_id));
        if (params?.to_hospital_id)
            searchParams.append('to_hospital_id', String(params.to_hospital_id));
        if (params?.case_id)
            searchParams.append('case_id', String(params.case_id));
        const query = searchParams.toString();
        return fetchAPI(`/transfers${query ? `?${query}` : ''}`);
    },
    getTransfer: (id) => fetchAPI(`/transfers/${id}`),
    createTransfer: (data) => fetchAPI('/transfers', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    startTransfer: (id) => fetchAPI(`/transfers/${id}/start`, {
        method: 'POST',
    }),
    completeTransfer: (id) => fetchAPI(`/transfers/${id}/complete`, {
        method: 'POST',
    }),
    cancelTransfer: (id) => fetchAPI(`/transfers/${id}/cancel`, {
        method: 'POST',
    }),
};
