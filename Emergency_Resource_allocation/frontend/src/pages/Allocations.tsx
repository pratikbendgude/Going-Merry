import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  EmergencyCase,
  Hospital,
  Bed,
  Ventilator,
  Ambulance,
  BedAllocation,
  VentilatorAllocation,
  AmbulanceDispatch,
} from '../lib/api';
import {
  Bed as BedIcon,
  Activity,
  Ambulance as AmbulanceIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

type AllocationMode = 'bed' | 'ventilator' | 'ambulance';

export default function Allocations() {
  const [mode, setMode] = useState<AllocationMode>('bed');
  const [selectedCase, setSelectedCase] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const queryClient = useQueryClient();

  // Emergency cases
  const { data: cases = [], isLoading: casesLoading } = useQuery<EmergencyCase[]>({
    queryKey: ['emergency-cases'],
    queryFn: () => api.getEmergencyCases(),
  });

  // Hospitals
  const { data: hospitals = [] } = useQuery<Hospital[]>({
    queryKey: ['hospitals'],
    queryFn: () => api.getHospitals(),
  });

  // Available resources only (ensures operator only selects available inventory)
  const { data: availableBeds = [], isLoading: bedsLoading } = useQuery<Bed[]>({
    queryKey: ['available-beds'],
    queryFn: () => api.getBeds({ status: 'available' }),
  });

  const { data: availableVentilators = [], isLoading: ventsLoading } = useQuery<Ventilator[]>({
    queryKey: ['available-ventilators'],
    queryFn: () => api.getVentilators({ status: 'available' }),
  });

  const { data: availableAmbulances = [], isLoading: ambsLoading } = useQuery<Ambulance[]>({
    queryKey: ['available-ambulances'],
    queryFn: () => api.getAmbulances({ status: 'available' }),
  });

  // Active allocations to show outcomes and permit release
  const { data: activeBeds = [] } = useQuery<BedAllocation[]>({
    queryKey: ['active-bed-allocations'],
    queryFn: () => api.getActiveBedAllocations(),
  });

  const { data: activeVents = [] } = useQuery<VentilatorAllocation[]>({
    queryKey: ['active-ventilator-allocations'],
    queryFn: () => api.getActiveVentilatorAllocations(),
  });

  const { data: activeAmbs = [] } = useQuery<AmbulanceDispatch[]>({
    queryKey: ['active-ambulance-dispatches'],
    queryFn: () => api.getActiveAmbulanceDispatches(),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['available-beds'] });
    queryClient.invalidateQueries({ queryKey: ['available-ventilators'] });
    queryClient.invalidateQueries({ queryKey: ['available-ambulances'] });
    queryClient.invalidateQueries({ queryKey: ['active-bed-allocations'] });
    queryClient.invalidateQueries({ queryKey: ['active-ventilator-allocations'] });
    queryClient.invalidateQueries({ queryKey: ['active-ambulance-dispatches'] });
    queryClient.invalidateQueries({ queryKey: ['beds'] });
    queryClient.invalidateQueries({ queryKey: ['ventilators'] });
    queryClient.invalidateQueries({ queryKey: ['ambulances'] });
    queryClient.invalidateQueries({ queryKey: ['hospitals-with-resources'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  // Allocation Mutations
  const bedAllocation = useMutation({
    mutationFn: ({ bedId, caseId }: { bedId: number; caseId: number }) =>
      api.allocateBed(bedId, caseId),
    onSuccess: (data) => {
      invalidateAll();
      setMessage({
        type: 'success',
        text: `Successfully allocated Bed #${data.bed_id} to Case #${data.case_id}. Bed status set to occupied.`,
      });
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
    onSuccess: (data) => {
      invalidateAll();
      setMessage({
        type: 'success',
        text: `Successfully allocated Ventilator #${data.ventilator_id} to Case #${data.case_id}. Status set to in_use.`,
      });
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
    onSuccess: (data) => {
      invalidateAll();
      setMessage({
        type: 'success',
        text: `Ambulance #${data.ambulance_id} dispatched to Case #${data.case_id}. Fleet status set to dispatched.`,
      });
      setSelectedCase('');
      setSelectedResource('');
    },
    onError: (error: Error) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  // Release Mutations
  const releaseBedMutation = useMutation({
    mutationFn: ({ bedId, caseId }: { bedId: number; caseId: number }) =>
      api.releaseBed(bedId, caseId),
    onSuccess: (data) => {
      invalidateAll();
      setMessage({
        type: 'success',
        text: `Bed #${data.bed_id} released successfully and returned to available inventory.`,
      });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message }),
  });

  const releaseVentilatorMutation = useMutation({
    mutationFn: ({ ventilatorId, caseId }: { ventilatorId: number; caseId: number }) =>
      api.releaseVentilator(ventilatorId, caseId),
    onSuccess: (data) => {
      invalidateAll();
      setMessage({
        type: 'success',
        text: `Ventilator #${data.ventilator_id} released and marked available for new patients.`,
      });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message }),
  });

  const markAmbulanceArrivedMutation = useMutation({
    mutationFn: ({ ambulanceId, caseId }: { ambulanceId: number; caseId: number }) =>
      api.markAmbulanceArrived(ambulanceId, caseId),
    onSuccess: (data) => {
      invalidateAll();
      setMessage({
        type: 'success',
        text: `Ambulance #${data.ambulance_id} arrival logged. Vehicle returned to available fleet.`,
      });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message }),
  });

  const handleAllocate = () => {
    if (!selectedCase || !selectedResource) {
      setMessage({ type: 'error', text: 'Please select both an emergency case and an available resource.' });
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

  const getHospitalName = (id: number) =>
    hospitals.find((h) => h.hospital_id === id)?.name || `Hospital #${id}`;

  const getPatientName = (caseId: number) =>
    cases.find((c) => c.case_id === caseId)?.patient_name || `Patient (Case #${caseId})`;

  const eligibleCases = cases.filter((c) => c.status !== 'discharged');

  const isSubmitting =
    bedAllocation.isPending || ventilatorAllocation.isPending || ambulanceDispatch.isPending;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Resource Allocation Engine</h1>
          <p className="page-subtitle">
            Transaction-safe matching of critical hospital equipment and emergency patient cases
          </p>
        </div>
      </div>

      {/* Outcome / Notification Message */}
      {message && (
        <div
          className={`ops-banner ${
            message.type === 'success' ? 'ops-banner-success' : 'ops-banner-critical'
          }`}
        >
          <div className="ops-banner-left">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 ops-banner-icon" style={{ color: 'var(--color-success)' }} />
            ) : (
              <XCircle className="h-5 w-5 ops-banner-icon" style={{ color: 'var(--color-critical)' }} />
            )}
            <span className="ops-banner-title">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mode Selection Tabs */}
      <div className="ops-tabs">
        <button
          className={`ops-tab ${mode === 'bed' ? 'active' : ''}`}
          onClick={() => {
            setMode('bed');
            setSelectedResource('');
          }}
        >
          <BedIcon className="h-4 w-4" />
          <span>Allocate Bed</span>
        </button>
        <button
          className={`ops-tab ${mode === 'ventilator' ? 'active' : ''}`}
          onClick={() => {
            setMode('ventilator');
            setSelectedResource('');
          }}
        >
          <Activity className="h-4 w-4" />
          <span>Allocate Ventilator</span>
        </button>
        <button
          className={`ops-tab ${mode === 'ambulance' ? 'active' : ''}`}
          onClick={() => {
            setMode('ambulance');
            setSelectedResource('');
          }}
        >
          <AmbulanceIcon className="h-4 w-4" />
          <span>Dispatch Ambulance</span>
        </button>
      </div>

      {/* Allocation Form Card */}
      <div className="ops-card">
        <div className="ops-card-header">
          <h3 className="ops-card-title">
            <ShieldCheck className="h-5 w-5" style={{ color: 'var(--color-secondary)' }} />
            <span>
              {mode === 'bed' && 'Assign Patient Bed (ICU / General)'}
              {mode === 'ventilator' && 'Assign Life Support Ventilator'}
              {mode === 'ambulance' && 'Dispatch Emergency Response Vehicle'}
            </span>
          </h3>
        </div>

        <div className="form-grid-2">
          {/* Patient Case Selection */}
          <div className="form-field">
            <label htmlFor="case-select" className="form-field-label">
              Target Emergency Case *
            </label>
            <select
              id="case-select"
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="input"
              disabled={isSubmitting || casesLoading}
            >
              <option value="">Select emergency case...</option>
              {eligibleCases.map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  Case #{c.case_id} &bull; {c.patient_name} [{c.triage_level.toUpperCase()}] &bull;{' '}
                  {getHospitalName(c.hospital_id)}
                </option>
              ))}
            </select>
            <p className="form-field-hint">
              Select an open or admitted patient requiring resource assignment.
            </p>
          </div>

          {/* Available Resource Selection */}
          <div className="form-field">
            <label htmlFor="resource-select" className="form-field-label">
              {mode === 'bed' && 'Available Hospital Bed *'}
              {mode === 'ventilator' && 'Available Ventilator *'}
              {mode === 'ambulance' && 'Available Ambulance *'}
            </label>
            <select
              id="resource-select"
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="input"
              disabled={isSubmitting}
            >
              <option value="">Choose available resource...</option>
              {mode === 'bed' &&
                availableBeds.map((b) => (
                  <option key={b.bed_id} value={b.bed_id}>
                    Bed #{b.bed_id} [{b.bed_type.toUpperCase()}] &bull; {getHospitalName(b.hospital_id)}
                  </option>
                ))}
              {mode === 'ventilator' &&
                availableVentilators.map((v) => (
                  <option key={v.ventilator_id} value={v.ventilator_id}>
                    Ventilator #{v.ventilator_id} &bull; {getHospitalName(v.hospital_id)}
                  </option>
                ))}
              {mode === 'ambulance' &&
                availableAmbulances.map((a) => (
                  <option key={a.ambulance_id} value={a.ambulance_id}>
                    Ambulance #{a.ambulance_id} ({a.vehicle_no}) &bull; {getHospitalName(a.hospital_id)}
                  </option>
                ))}
            </select>

            {mode === 'bed' && availableBeds.length === 0 && !bedsLoading && (
              <p className="form-field-hint" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                <AlertCircle className="h-3 w-3" style={{ display: 'inline', verticalAlign: '-1px' }} /> No beds currently available across hospitals.
              </p>
            )}
            {mode === 'ventilator' && availableVentilators.length === 0 && !ventsLoading && (
              <p className="form-field-hint" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                <AlertCircle className="h-3 w-3" style={{ display: 'inline', verticalAlign: '-1px' }} /> No ventilators currently available.
              </p>
            )}
            {mode === 'ambulance' && availableAmbulances.length === 0 && !ambsLoading && (
              <p className="form-field-hint" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                <AlertCircle className="h-3 w-3" style={{ display: 'inline', verticalAlign: '-1px' }} /> All ambulances are currently dispatched or on duty.
              </p>
            )}
          </div>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', maxWidth: '520px' }}>
            Guaranteed transactional execution via row-level locks (<code>FOR UPDATE</code>) to ensure no resource can be concurrently double-booked.
          </p>
          <button
            onClick={handleAllocate}
            disabled={!selectedCase || !selectedResource || isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <div className="spinner-small"></div>
                <span>Executing Transaction...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>
                  {mode === 'bed' && 'Commit Bed Allocation'}
                  {mode === 'ventilator' && 'Commit Ventilator Allocation'}
                  {mode === 'ambulance' && 'Authorize Dispatch'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Resource Allocations Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Active Resource Allocations
          </h2>
          <span className="badge badge-neutral">Live Database Registry</span>
        </div>

        {/* Active Beds Table */}
        <div className="table-wrapper">
          <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BedIcon className="h-4 w-4" style={{ color: 'var(--color-secondary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Active Bed Allocations ({activeBeds.length})
            </span>
          </div>
          {activeBeds.length === 0 ? (
            <p style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              No active bed allocations currently in effect.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Bed ID</th>
                    <th>Patient / Case</th>
                    <th>Allocated At</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBeds.map((alloc) => (
                    <tr key={`${alloc.bed_id}-${alloc.case_id}`}>
                      <td className="td-mono" style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>
                        Bed #{alloc.bed_id}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                          <span style={{ fontWeight: 600 }}>{getPatientName(alloc.case_id)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            (Case #{alloc.case_id})
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(alloc.allocated_at).toLocaleDateString()} {new Date(alloc.allocated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => releaseBedMutation.mutate({ bedId: alloc.bed_id, caseId: alloc.case_id })}
                          disabled={releaseBedMutation.isPending}
                          className="btn btn-secondary btn-sm"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Release Bed</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active Ventilators Table */}
        <div className="table-wrapper">
          <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity className="h-4 w-4" style={{ color: 'var(--color-success)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Active Ventilator Allocations ({activeVents.length})
            </span>
          </div>
          {activeVents.length === 0 ? (
            <p style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              No active ventilator allocations currently in effect.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Ventilator ID</th>
                    <th>Patient / Case</th>
                    <th>Allocated At</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeVents.map((alloc) => (
                    <tr key={`${alloc.ventilator_id}-${alloc.case_id}`}>
                      <td className="td-mono" style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                        Ventilator #{alloc.ventilator_id}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                          <span style={{ fontWeight: 600 }}>{getPatientName(alloc.case_id)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            (Case #{alloc.case_id})
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(alloc.allocated_at).toLocaleDateString()} {new Date(alloc.allocated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() =>
                            releaseVentilatorMutation.mutate({
                              ventilatorId: alloc.ventilator_id,
                              caseId: alloc.case_id,
                            })
                          }
                          disabled={releaseVentilatorMutation.isPending}
                          className="btn btn-secondary btn-sm"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Release Ventilator</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active Ambulance Dispatches Table */}
        <div className="table-wrapper">
          <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AmbulanceIcon className="h-4 w-4" style={{ color: 'var(--color-warning)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Active Ambulance Dispatches ({activeAmbs.length})
            </span>
          </div>
          {activeAmbs.length === 0 ? (
            <p style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              No ambulances currently in transit or dispatched.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Ambulance ID</th>
                    <th>Patient / Case</th>
                    <th>Dispatched At</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAmbs.map((dispatch) => (
                    <tr key={`${dispatch.ambulance_id}-${dispatch.case_id}`}>
                      <td className="td-mono" style={{ color: 'var(--color-warning)', fontWeight: 700 }}>
                        Ambulance #{dispatch.ambulance_id}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                          <span style={{ fontWeight: 600 }}>{getPatientName(dispatch.case_id)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            (Case #{dispatch.case_id})
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(dispatch.dispatched_at).toLocaleDateString()} {new Date(dispatch.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() =>
                            markAmbulanceArrivedMutation.mutate({
                              ambulanceId: dispatch.ambulance_id,
                              caseId: dispatch.case_id,
                            })
                          }
                          disabled={markAmbulanceArrivedMutation.isPending}
                          className="btn btn-secondary btn-sm"
                        >
                          <CheckCircle className="h-3 w-3" style={{ color: 'var(--color-success)' }} />
                          <span>Mark Arrived</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
