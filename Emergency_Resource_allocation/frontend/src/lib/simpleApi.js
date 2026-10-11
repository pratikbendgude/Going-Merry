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
// Simple wrapper for data fetching
async function getData(endpoint) {
    return fetchAPI(endpoint);
}
// API Functions
export const api = {
    // Dashboard
    getDashboard: () => getData('/dashboard'),
    // Hospitals
    getHospitals: () => getData('/hospitals'),
    getHospital: (id) => getData(`/hospitals/${id}`),
    getHospitalResources: (id) => getData(`/hospitals/${id}/resources`),
    getHospitalsWithResources: () => getData('/hospitals/with-resources'),
    createHospital: (data) => fetchAPI('/hospitals', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateHospital: (id, data) => fetchAPI(`/hospitals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    // Emergency Cases
    getEmergencyCases: () => getData('/emergency-cases'),
    createEmergencyCase: (data) => fetchAPI('/emergency-cases', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateEmergencyCase: (id, data) => fetchAPI(`/emergency-cases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    // Resources
    getBeds: () => getData('/resources/beds'),
    getVentilators: () => getData('/resources/ventilators'),
    getAmbulances: () => getData('/resources/ambulances'),
    createBloodUnit: (data) => fetchAPI('/resources/blood-units', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
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
