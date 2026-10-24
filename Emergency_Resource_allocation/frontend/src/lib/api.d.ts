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
export interface Transfer {
    transfer_id: number;
    from_hospital_id: number;
    to_hospital_id: number;
    case_id: number;
    ambulance_id: number | null;
    shortage_reason: string | null;
    status: 'requested' | 'in_transit' | 'in_progress' | 'completed' | 'cancelled';
    requested_at: string;
    completed_at: string | null;
}
export declare const api: {
    getDashboard: () => Promise<DashboardMetrics>;
    getHospitals: (params?: {
        city?: string;
        trauma_level?: number;
    }) => Promise<Hospital[]>;
    getHospital: (id: number) => Promise<Hospital>;
    getHospitalResources: (id: number) => Promise<HospitalWithResources>;
    getHospitalsWithResources: (params?: {
        city?: string;
        trauma_level?: number;
    }) => Promise<HospitalWithResources[]>;
    searchHospitals: (query: string) => Promise<Hospital[]>;
    createHospital: (data: Partial<Hospital>) => Promise<Hospital>;
    updateHospital: (id: number, data: Partial<Hospital>) => Promise<Hospital>;
    deleteHospital: (id: number) => Promise<void>;
    getEmergencyCases: (params?: {
        hospital_id?: number;
        status?: string;
        triage_level?: string;
    }) => Promise<EmergencyCase[]>;
    getEmergencyCasesWithParams: (params?: {
        hospital_id?: number;
        status?: string;
        triage_level?: string;
    }) => Promise<EmergencyCase[]>;
    getEmergencyCase: (id: number) => Promise<EmergencyCase>;
    createEmergencyCase: (data: Partial<EmergencyCase>) => Promise<EmergencyCase>;
    updateEmergencyCase: (id: number, data: Partial<EmergencyCase>) => Promise<EmergencyCase>;
    deleteEmergencyCase: (id: number) => Promise<void>;
    getBeds: (params?: {
        hospital_id?: number;
        status?: string;
        bed_type?: string;
    }) => Promise<Bed[]>;
    getBedsWithParams: (params?: {
        hospital_id?: number;
        status?: string;
        bed_type?: string;
    }) => Promise<Bed[]>;
    createBed: (data: {
        bed_id: number;
        hospital_id: number;
        bed_type: string;
        status?: string;
    }) => Promise<Bed>;
    updateBedStatus: (bedId: number, status: string) => Promise<Bed>;
    getVentilators: (params?: {
        hospital_id?: number;
        status?: string;
    }) => Promise<Ventilator[]>;
    getVentilatorsWithParams: (params?: {
        hospital_id?: number;
        status?: string;
    }) => Promise<Ventilator[]>;
    createVentilator: (data: {
        ventilator_id: number;
        hospital_id: number;
        status?: string;
    }) => Promise<Ventilator>;
    updateVentilatorStatus: (ventilatorId: number, status: string) => Promise<Ventilator>;
    getAmbulances: (params?: {
        hospital_id?: number;
        status?: string;
    }) => Promise<Ambulance[]>;
    getAmbulancesWithParams: (params?: {
        hospital_id?: number;
        status?: string;
    }) => Promise<Ambulance[]>;
    createAmbulance: (data: {
        ambulance_id: number;
        hospital_id: number;
        vehicle_no: string;
        status?: string;
    }) => Promise<Ambulance>;
    updateAmbulanceStatus: (ambulanceId: number, status: string) => Promise<Ambulance>;
    getBloodUnits: (params?: {
        hospital_id?: number;
        blood_group?: string;
        status?: string;
    }) => Promise<BloodUnit[]>;
    createBloodUnit: (data: {
        unit_id: number;
        hospital_id: number;
        blood_group: string;
        expiry_date: string;
        status?: string;
    }) => Promise<BloodUnit>;
    issueBloodUnit: (unitId: number, caseId: number) => Promise<BloodUnit>;
    allocateBed: (bedId: number, caseId: number) => Promise<BedAllocation>;
    releaseBed: (bedId: number, caseId: number) => Promise<BedAllocation>;
    getActiveBedAllocations: () => Promise<BedAllocation[]>;
    allocateVentilator: (ventilatorId: number, caseId: number) => Promise<VentilatorAllocation>;
    releaseVentilator: (ventilatorId: number, caseId: number) => Promise<VentilatorAllocation>;
    getActiveVentilatorAllocations: () => Promise<VentilatorAllocation[]>;
    dispatchAmbulance: (ambulanceId: number, caseId: number) => Promise<AmbulanceDispatch>;
    markAmbulanceArrived: (ambulanceId: number, caseId: number) => Promise<AmbulanceDispatch>;
    getActiveAmbulanceDispatches: () => Promise<AmbulanceDispatch[]>;
    getTransfers: (params?: {
        status?: string;
        from_hospital_id?: number;
        to_hospital_id?: number;
        case_id?: number;
    }) => Promise<Transfer[]>;
    getTransfer: (id: number) => Promise<Transfer>;
    createTransfer: (data: {
        from_hospital_id: number;
        to_hospital_id: number;
        case_id: number;
        ambulance_id?: number | null;
        shortage_reason?: string;
        status?: string;
    }) => Promise<Transfer>;
    startTransfer: (id: number) => Promise<Transfer>;
    completeTransfer: (id: number) => Promise<Transfer>;
    cancelTransfer: (id: number) => Promise<Transfer>;
};
