import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/simpleApi';
import { Bed, Activity, Ambulance, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

type AllocationMode = 'bed' | 'ventilator' | 'ambulance';

export default function Allocations() {
  const [mode, setMode] = useState<AllocationMode>('bed');
  const [selectedCase, setSelectedCase] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    mutationFn: ({ bedId, caseId }: { bedId: number; caseId: number }) =>
      api.allocateBed(bedId, caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-beds'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setMessage({ type: 'success', text: 'Bed allocated successfully' });
      setSelectedCase('');
      setSelectedResource('');
    },
    onError: (error: Error) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const ventilatorAllocation = useMutation({
    mutationFn: ({ ventilatorId, caseId }: { ventilatorId: number; caseId: number }) =>
      api.allocateVentilator(ventilatorId, caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-ventilators'] });
      queryClient.invalidateQueries({ queryKey: ['ventilators'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setMessage({ type: 'success', text: 'Ventilator allocated successfully' });
      setSelectedCase('');
      setSelectedResource('');
    },
    onError: (error: Error) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const ambulanceDispatch = useMutation({
    mutationFn: ({ ambulanceId, caseId }: { ambulanceId: number; caseId: number }) =>
      api.dispatchAmbulance(ambulanceId, caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-ambulances'] });
      queryClient.invalidateQueries({ queryKey: ['ambulances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setMessage({ type: 'success', text: 'Ambulance dispatched successfully' });
      setSelectedCase('');
      setSelectedResource('');
    },
    onError: (error: Error) => {
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
    } else if (mode === 'ventilator') {
      ventilatorAllocation.mutate({ ventilatorId: resourceId, caseId });
    } else {
      ambulanceDispatch.mutate({ ambulanceId: resourceId, caseId });
    }
  };

  const getHospitalName = (id: number) => {
    const hospital = hospitals.find(h => h.hospital_id === id);
    return hospital ? hospital.name : `Hospital ${id}`;
  };

  const isLoading =
    casesLoading ||
    hospitalsLoading ||
    bedsLoading ||
    ventilatorsLoading ||
    ambulancesLoading ||
    bedAllocation.isPending ||
    ventilatorAllocation.isPending ||
    ambulanceDispatch.isPending;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Resource Allocation</h1>
        <p className="page-subtitle">Assign resources to emergency cases</p>
      </div>

      {/* Error States */}
      {casesError && (
        <div className="alert alert-error mb-4">
          Failed to load emergency cases: {(casesError as Error).message}
        </div>
      )}
      {hospitalsError && (
        <div className="alert alert-error mb-4">
          Failed to load hospitals: {(hospitalsError as Error).message}
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`alert mb-6 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mode Selection */}
      <div className="tabs mb-6">
        <button
          className={`tab ${mode === 'bed' ? 'tab-active' : ''}`}
          onClick={() => {
            setMode('bed');
            setSelectedResource('');
          }}
        >
          <Bed className="h-4 w-4" />
          Allocate Bed
        </button>
        <button
          className={`tab ${mode === 'ventilator' ? 'tab-active' : ''}`}
          onClick={() => {
            setMode('ventilator');
            setSelectedResource('');
          }}
        >
          <Activity className="h-4 w-4" />
          Allocate Ventilator
        </button>
        <button
          className={`tab ${mode === 'ambulance' ? 'tab-active' : ''}`}
          onClick={() => {
            setMode('ambulance');
            setSelectedResource('');
          }}
        >
          <Ambulance className="h-4 w-4" />
          Dispatch Ambulance
        </button>
      </div>

      {/* Allocation Form */}
      <div className="form-card">
        <h3 className="text-lg font-semibold mb-4">
          {mode === 'bed' && 'Bed Allocation'}
          {mode === 'ventilator' && 'Ventilator Allocation'}
          {mode === 'ambulance' && 'Ambulance Dispatch'}
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Case Selection */}
          <div className="form-group">
            <label htmlFor="case" className="form-label">
              Select Emergency Case
            </label>
            <select
              id="case"
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="input"
              disabled={isLoading || casesLoading}
            >
              <option value="">Choose a case...</option>
              {cases.map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  Case #{c.case_id} - {c.patient_name} ({c.triage_level.toUpperCase()}) - {getHospitalName(c.hospital_id)}
                </option>
              ))}
              {cases.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">No cases available</p>
              )}
            </select>
          </div>

          {/* Resource Selection */}
          <div className="form-group">
            <label htmlFor="resource" className="form-label">
              {mode === 'bed' && 'Select Available Bed'}
              {mode === 'ventilator' && 'Select Available Ventilator'}
              {mode === 'ambulance' && 'Select Available Ambulance'}
            </label>
            <select
              id="resource"
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="input"
              disabled={isLoading}
            >
              <option value="">Choose a resource...</option>
              {mode === 'bed' &&
                beds.map((bed) => (
                  <option key={bed.bed_id} value={bed.bed_id}>
                    Bed #{bed.bed_id} ({bed.bed_type.toUpperCase()}) - {getHospitalName(bed.hospital_id)}
                  </option>
                ))}
              {mode === 'ventilator' &&
                ventilators.map((vent) => (
                  <option key={vent.ventilator_id} value={vent.ventilator_id}>
                    Ventilator #{vent.ventilator_id} - {getHospitalName(vent.hospital_id)}
                  </option>
                ))}
              {mode === 'ambulance' &&
                ambulances.map((amb) => (
                  <option key={amb.ambulance_id} value={amb.ambulance_id}>
                    Ambulance #{amb.ambulance_id} ({amb.vehicle_no}) - {getHospitalName(amb.hospital_id)}
                  </option>
                ))}
            </select>
            {mode === 'bed' && beds.length === 0 && (
              <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                No beds available
              </p>
            )}
            {mode === 'ventilator' && ventilators.length === 0 && (
              <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                No ventilators available
              </p>
            )}
            {mode === 'ambulance' && ambulances.length === 0 && (
              <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                No ambulances available
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleAllocate}
            disabled={!selectedCase || !selectedResource || isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <>
                <div className="spinner-small"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                {mode === 'bed' && 'Allocate Bed'}
                {mode === 'ventilator' && 'Allocate Ventilator'}
                {mode === 'ambulance' && 'Dispatch Ambulance'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Resource allocations are transaction-safe and prevent concurrent allocation conflicts.
          Once allocated, resources will be marked as unavailable until released.
        </p>
      </div>
    </div>
  );
}