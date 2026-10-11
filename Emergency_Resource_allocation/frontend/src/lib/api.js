const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
    createHospital: (data) => fetchAPI('/hospitals', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateHospital: (id, data) => fetchAPI(`/hospitals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
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
    createEmergencyCase: (data) => fetchAPI('/emergency-cases', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateEmergencyCase: (id, data) => fetchAPI(`/emergency-cases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
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
    getVentilators: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.hospital_id)
            searchParams.append('hospital_id', String(params.hospital_id));
        if (params?.status)
            searchParams.append('status', params.status);
        const query = searchParams.toString();
        return fetchAPI(`/resources/ventilators${query ? `?${query}` : ''}`);
    },
    getAmbulances: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.hospital_id)
            searchParams.append('hospital_id', String(params.hospital_id));
        if (params?.status)
            searchParams.append('status', params.status);
        const query = searchParams.toString();
        return fetchAPI(`/resources/ambulances${query ? `?${query}` : ''}`);
    },
    // Allocations
    allocateBed: (bedId, caseId) => fetchAPI('/allocations/beds', {
        method: 'POST',
        body: JSON.stringify({ bed_id: bedId, case_id: caseId }),
    }),
    releaseBed: (bedId, caseId) => fetchAPI(`/allocations/beds/${bedId}/release?case_id=${caseId}`, {
        method: 'POST',
    }),
    allocateVentilator: (ventilatorId, caseId) => fetchAPI('/allocations/ventilators', {
        method: 'POST',
        body: JSON.stringify({ ventilator_id: ventilatorId, case_id: caseId }),
    }),
    releaseVentilator: (ventilatorId, caseId) => fetchAPI(`/allocations/ventilators/${ventilatorId}/release?case_id=${caseId}`, {
        method: 'POST',
    }),
    dispatchAmbulance: (ambulanceId, caseId) => fetchAPI('/allocations/ambulances', {
        method: 'POST',
        body: JSON.stringify({ ambulance_id: ambulanceId, case_id: caseId }),
    }),
};
