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
export declare const api: {
    getDashboard: () => Promise<DashboardMetrics>;
    getHospitals: () => Promise<Hospital[]>;
    getHospital: (id: number) => Promise<Hospital>;
    getHospitalResources: (id: number) => Promise<HospitalWithResources>;
    getHospitalsWithResources: () => Promise<HospitalWithResources[]>;
    createHospital: (data: Partial<Hospital>) => Promise<Hospital>;
    updateHospital: (id: number, data: Partial<Hospital>) => Promise<Hospital>;
    getEmergencyCases: () => Promise<EmergencyCase[]>;
    createEmergencyCase: (data: Partial<EmergencyCase>) => Promise<EmergencyCase>;
    updateEmergencyCase: (id: number, data: Partial<EmergencyCase>) => Promise<EmergencyCase>;
    getBeds: () => Promise<Bed[]>;
    getVentilators: () => Promise<Ventilator[]>;
    getAmbulances: () => Promise<Ambulance[]>;
    createBloodUnit: (data: Partial<Ambulance>) => Promise<Ambulance>;
    allocateBed: (bedId: number, caseId: number) => Promise<unknown>;
    releaseBed: (bedId: number, caseId: number) => Promise<unknown>;
    allocateVentilator: (ventilatorId: number, caseId: number) => Promise<unknown>;
    releaseVentilator: (ventilatorId: number, caseId: number) => Promise<unknown>;
    dispatchAmbulance: (ambulanceId: number, caseId: number) => Promise<unknown>;
};
