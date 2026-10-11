const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
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

// Types
export interface DashboardMetrics {
  total_hospitals: number;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  total_ventilators: number;
  available_ventilators: number;
  in_use_ventilators: number;
  total_emergency_cases: number;
  open_cases: number;
  admitted_cases: number;
  transfer_pending_cases: number;
  total_ambulances: number;
  available_ambulances: number;
  total_blood_units: number;
  available_blood_units: number;
  pending_transfers: number;
}

export interface Hospital {
  hospital_id: number;
  name: string;
  city: string;
  location: string | null;
  contact_no: string | null;
  trauma_level: number | null;
}

export interface HospitalWithResources extends Hospital {
  total_beds: number;
  available_beds: number;
  total_ventilators: number;
  available_ventilators: number;
  total_ambulances: number;
  available_ambulances: number;
}

export interface EmergencyCase {
  case_id: number;
  hospital_id: number;
  patient_name: string;
  triage_level: 'red' | 'yellow' | 'green';
  status: 'open' | 'admitted' | 'discharged' | 'transfer_pending';
  reported_at: string;
}

export interface Bed {
  bed_id: number;
  hospital_id: number;
  bed_type: 'icu' | 'general';
  status: 'available' | 'occupied';
}

export interface Ventilator {
  ventilator_id: number;
  hospital_id: number;
  status: 'available' | 'in_use' | 'maintenance';
}

export interface Ambulance {
  ambulance_id: number;
  hospital_id: number;
  vehicle_no: string;
  status: 'available' | 'dispatched' | 'returning';
}

// API Functions
export const api = {
  // Dashboard
  getDashboard: () => fetchAPI<DashboardMetrics>('/dashboard'),

  // Hospitals
  getHospitals: (params?: { city?: string; trauma_level?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.city) searchParams.append('city', params.city);
    if (params?.trauma_level) searchParams.append('trauma_level', String(params.trauma_level));
    const query = searchParams.toString();
    return fetchAPI<Hospital[]>(`/hospitals${query ? `?${query}` : ''}`);
  },

  getHospital: (id: number) => fetchAPI<Hospital>(`/hospitals/${id}`),

  getHospitalResources: (id: number) => fetchAPI<HospitalWithResources>(`/hospitals/${id}/resources`),

  getHospitalsWithResources: (params?: { city?: string; trauma_level?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.city) searchParams.append('city', params.city);
    if (params?.trauma_level) searchParams.append('trauma_level', String(params.trauma_level));
    const query = searchParams.toString();
    return fetchAPI<HospitalWithResources[]>(`/hospitals/with-resources${query ? `?${query}` : ''}`);
  },

  createHospital: (data: Partial<Hospital>) =>
    fetchAPI<Hospital>('/hospitals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateHospital: (id: number, data: Partial<Hospital>) =>
    fetchAPI<Hospital>(`/hospitals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Emergency Cases
  getEmergencyCases: (params?: { hospital_id?: number; status?: string; triage_level?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.hospital_id) searchParams.append('hospital_id', String(params.hospital_id));
    if (params?.status) searchParams.append('status', params.status);
    if (params?.triage_level) searchParams.append('triage_level', params.triage_level);
    const query = searchParams.toString();
    return fetchAPI<EmergencyCase[]>(`/emergency-cases${query ? `?${query}` : ''}`);
  },

  createEmergencyCase: (data: Partial<EmergencyCase>) =>
    fetchAPI<EmergencyCase>('/emergency-cases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEmergencyCase: (id: number, data: Partial<EmergencyCase>) =>
    fetchAPI<EmergencyCase>(`/emergency-cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Resources
  getBeds: (params?: { hospital_id?: number; status?: string; bed_type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.hospital_id) searchParams.append('hospital_id', String(params.hospital_id));
    if (params?.status) searchParams.append('status', params.status);
    if (params?.bed_type) searchParams.append('bed_type', params.bed_type);
    const query = searchParams.toString();
    return fetchAPI<Bed[]>(`/resources/beds${query ? `?${query}` : ''}`);
  },

  getVentilators: (params?: { hospital_id?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.hospital_id) searchParams.append('hospital_id', String(params.hospital_id));
    if (params?.status) searchParams.append('status', params.status);
    const query = searchParams.toString();
    return fetchAPI<Ventilator[]>(`/resources/ventilators${query ? `?${query}` : ''}`);
  },

  getAmbulances: (params?: { hospital_id?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.hospital_id) searchParams.append('hospital_id', String(params.hospital_id));
    if (params?.status) searchParams.append('status', params.status);
    const query = searchParams.toString();
    return fetchAPI<Ambulance[]>(`/resources/ambulances${query ? `?${query}` : ''}`);
  },

  // Allocations
  allocateBed: (bedId: number, caseId: number) =>
    fetchAPI('/allocations/beds', {
      method: 'POST',
      body: JSON.stringify({ bed_id: bedId, case_id: caseId }),
    }),

  releaseBed: (bedId: number, caseId: number) =>
    fetchAPI(`/allocations/beds/${bedId}/release?case_id=${caseId}`, {
      method: 'POST',
    }),

  allocateVentilator: (ventilatorId: number, caseId: number) =>
    fetchAPI('/allocations/ventilators', {
      method: 'POST',
      body: JSON.stringify({ ventilator_id: ventilatorId, case_id: caseId }),
    }),

  releaseVentilator: (ventilatorId: number, caseId: number) =>
    fetchAPI(`/allocations/ventilators/${ventilatorId}/release?case_id=${caseId}`, {
      method: 'POST',
    }),

  dispatchAmbulance: (ambulanceId: number, caseId: number) =>
    fetchAPI('/allocations/ambulances', {
      method: 'POST',
      body: JSON.stringify({ ambulance_id: ambulanceId, case_id: caseId }),
    }),
};