const API_BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000';

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

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
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
  status: 'available' | 'dispatched' | 'returning' | 'on_duty';
}

export interface BloodUnit {
  unit_id: number;
  hospital_id: number;
  blood_group: string;
  status: 'in_stock' | 'issued' | 'expired';
  expiry_date: string;
  case_id?: number | null;
  issued_at?: string | null;
}

export interface BedAllocation {
  bed_id: number;
  case_id: number;
  allocated_at: string;
  released_at: string | null;
}

export interface VentilatorAllocation {
  ventilator_id: number;
  case_id: number;
  allocated_at: string;
  released_at: string | null;
}

export interface AmbulanceDispatch {
  ambulance_id: number;
  case_id: number;
  dispatched_at: string;
  arrived_at: string | null;
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

  searchHospitals: (query: string) => fetchAPI<Hospital[]>(`/hospitals/search?q=${encodeURIComponent(query)}`),

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

  deleteHospital: (id: number) =>
    fetchAPI<void>(`/hospitals/${id}`, {
      method: 'DELETE',
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

  getEmergencyCasesWithParams: (params?: { hospital_id?: number; status?: string; triage_level?: string }) =>
    api.getEmergencyCases(params),

  getEmergencyCase: (id: number) => fetchAPI<EmergencyCase>(`/emergency-cases/${id}`),

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

  deleteEmergencyCase: (id: number) =>
    fetchAPI<void>(`/emergency-cases/${id}`, {
      method: 'DELETE',
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

  getBedsWithParams: (params?: { hospital_id?: number; status?: string; bed_type?: string }) =>
    api.getBeds(params),

  createBed: (data: { bed_id: number; hospital_id: number; bed_type: string; status?: string }) =>
    fetchAPI<Bed>('/resources/beds', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBedStatus: (bedId: number, status: string) =>
    fetchAPI<Bed>(`/resources/beds/${bedId}/status?new_status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    }),

  getVentilators: (params?: { hospital_id?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.hospital_id) searchParams.append('hospital_id', String(params.hospital_id));
    if (params?.status) searchParams.append('status', params.status);
    const query = searchParams.toString();
    return fetchAPI<Ventilator[]>(`/resources/ventilators${query ? `?${query}` : ''}`);
  },

  getVentilatorsWithParams: (params?: { hospital_id?: number; status?: string }) =>
    api.getVentilators(params),

  createVentilator: (data: { ventilator_id: number; hospital_id: number; status?: string }) =>
    fetchAPI<Ventilator>('/resources/ventilators', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateVentilatorStatus: (ventilatorId: number, status: string) =>
    fetchAPI<Ventilator>(`/resources/ventilators/${ventilatorId}/status?new_status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    }),

  getAmbulances: (params?: { hospital_id?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.hospital_id) searchParams.append('hospital_id', String(params.hospital_id));
    if (params?.status) searchParams.append('status', params.status);
    const query = searchParams.toString();
    return fetchAPI<Ambulance[]>(`/resources/ambulances${query ? `?${query}` : ''}`);
  },

  getAmbulancesWithParams: (params?: { hospital_id?: number; status?: string }) =>
    api.getAmbulances(params),

  createAmbulance: (data: { ambulance_id: number; hospital_id: number; vehicle_no: string; status?: string }) =>
    fetchAPI<Ambulance>('/resources/ambulances', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAmbulanceStatus: (ambulanceId: number, status: string) =>
    fetchAPI<Ambulance>(`/resources/ambulances/${ambulanceId}/status?new_status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    }),

  getBloodUnits: (params?: { hospital_id?: number; blood_group?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.hospital_id) searchParams.append('hospital_id', String(params.hospital_id));
    if (params?.blood_group) searchParams.append('blood_group', params.blood_group);
    if (params?.status) searchParams.append('status', params.status);
    const query = searchParams.toString();
    return fetchAPI<BloodUnit[]>(`/resources/blood-units${query ? `?${query}` : ''}`);
  },

  createBloodUnit: (data: { unit_id: number; hospital_id: number; blood_group: string; expiry_date: string; status?: string }) =>
    fetchAPI<BloodUnit>('/resources/blood-units', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Allocations
  allocateBed: (bedId: number, caseId: number) =>
    fetchAPI<BedAllocation>('/allocations/beds', {
      method: 'POST',
      body: JSON.stringify({ bed_id: bedId, case_id: caseId }),
    }),

  releaseBed: (bedId: number, caseId: number) =>
    fetchAPI<BedAllocation>(`/allocations/beds/${bedId}/release?case_id=${caseId}`, {
      method: 'POST',
    }),

  getActiveBedAllocations: () =>
    fetchAPI<BedAllocation[]>('/allocations/beds/active'),

  allocateVentilator: (ventilatorId: number, caseId: number) =>
    fetchAPI<VentilatorAllocation>('/allocations/ventilators', {
      method: 'POST',
      body: JSON.stringify({ ventilator_id: ventilatorId, case_id: caseId }),
    }),

  releaseVentilator: (ventilatorId: number, caseId: number) =>
    fetchAPI<VentilatorAllocation>(`/allocations/ventilators/${ventilatorId}/release?case_id=${caseId}`, {
      method: 'POST',
    }),

  getActiveVentilatorAllocations: () =>
    fetchAPI<VentilatorAllocation[]>('/allocations/ventilators/active'),

  dispatchAmbulance: (ambulanceId: number, caseId: number) =>
    fetchAPI<AmbulanceDispatch>('/allocations/ambulances', {
      method: 'POST',
      body: JSON.stringify({ ambulance_id: ambulanceId, case_id: caseId }),
    }),

  markAmbulanceArrived: (ambulanceId: number, caseId: number) =>
    fetchAPI<AmbulanceDispatch>(`/allocations/ambulances/${ambulanceId}/arrive?case_id=${caseId}`, {
      method: 'POST',
    }),

  getActiveAmbulanceDispatches: () =>
    fetchAPI<AmbulanceDispatch[]>('/allocations/ambulances/active'),
};
