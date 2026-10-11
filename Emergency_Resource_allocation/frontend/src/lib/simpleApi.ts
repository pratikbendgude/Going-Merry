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

// Simple wrapper for data fetching
async function getData<T>(endpoint: string): Promise<T> {
  return fetchAPI<T>(endpoint);
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
  getDashboard: () => getData<DashboardMetrics>('/dashboard'),

  // Hospitals
  getHospitals: () => getData<Hospital[]>('/hospitals'),
  getHospital: (id: number) => getData<Hospital>(`/hospitals/${id}`),
  getHospitalResources: (id: number) => getData<HospitalWithResources>(`/hospitals/${id}/resources`),
  getHospitalsWithResources: () => getData<HospitalWithResources[]>('/hospitals/with-resources'),
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
  getEmergencyCases: () => getData<EmergencyCase[]>('/emergency-cases'),
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
  getBeds: () => getData<Bed[]>('/resources/beds'),
  getVentilators: () => getData<Ventilator[]>('/resources/ventilators'),
  getAmbulances: () => getData<Ambulance[]>('/resources/ambulances'),
  createBloodUnit: (data: Partial<Ambulance>) =>
    fetchAPI<Ambulance>('/resources/blood-units', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

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