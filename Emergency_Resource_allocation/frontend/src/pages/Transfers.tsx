import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  Transfer,
  Hospital,
  EmergencyCase,
  Ambulance,
} from '../lib/api';
import {
  ArrowRightLeft,
  Plus,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Ambulance as AmbulanceIcon,
  X,
  Filter,
} from 'lucide-react';

export default function Transfers() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [fromHospitalId, setFromHospitalId] = useState('');
  const [toHospitalId, setToHospitalId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [ambulanceId, setAmbulanceId] = useState('');
  const [shortageReason, setShortageReason] = useState('');
  const [formError, setFormError] = useState('');

  const queryClient = useQueryClient();

  // Queries
  const { data: transfers = [], isLoading: transfersLoading } = useQuery<Transfer[]>({
    queryKey: ['transfers', statusFilter],
    queryFn: () => api.getTransfers({ status: statusFilter || undefined }),
    refetchInterval: 15000,
  });

  const { data: hospitals = [] } = useQuery<Hospital[]>({
    queryKey: ['hospitals'],
    queryFn: () => api.getHospitals(),
  });

  const { data: cases = [] } = useQuery<EmergencyCase[]>({
    queryKey: ['emergency-cases'],
    queryFn: () => api.getEmergencyCases(),
  });

  const { data: availableAmbulances = [] } = useQuery<Ambulance[]>({
    queryKey: ['ambulances', 'available'],
    queryFn: () => api.getAmbulances({ status: 'available' }),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['transfers'] });
    queryClient.invalidateQueries({ queryKey: ['emergency-cases'] });
    queryClient.invalidateQueries({ queryKey: ['ambulances'] });
    queryClient.invalidateQueries({ queryKey: ['beds'] });
    queryClient.invalidateQueries({ queryKey: ['ventilators'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: {
      from_hospital_id: number;
      to_hospital_id: number;
      case_id: number;
      ambulance_id?: number | null;
      shortage_reason?: string;
    }) => api.createTransfer(data),
    onSuccess: (transfer) => {
      invalidateAll();
      setNotification({
        type: 'success',
        text: `Transfer request #${transfer.transfer_id} created successfully.`,
      });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (err: Error) => setFormError(err.message || 'Failed to create transfer request'),
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => api.startTransfer(id),
    onSuccess: (transfer) => {
      invalidateAll();
      setNotification({
        type: 'success',
        text: `Transfer #${transfer.transfer_id} is now in progress. Ambulance dispatched.`,
      });
    },
    onError: (err: Error) => setNotification({ type: 'error', text: err.message }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => api.completeTransfer(id),
    onSuccess: (transfer) => {
      invalidateAll();
      setNotification({
        type: 'success',
        text: `Transfer #${transfer.transfer_id} completed. Patient admitted to destination hospital.`,
      });
    },
    onError: (err: Error) => setNotification({ type: 'error', text: err.message }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.cancelTransfer(id),
    onSuccess: (transfer) => {
      invalidateAll();
      setNotification({
        type: 'success',
        text: `Transfer #${transfer.transfer_id} cancelled. Resources and case status restored.`,
      });
    },
    onError: (err: Error) => setNotification({ type: 'error', text: err.message }),
  });

  const resetForm = () => {
    setFromHospitalId('');
    setToHospitalId('');
    setCaseId('');
    setAmbulanceId('');
    setShortageReason('');
    setFormError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fromHospitalId || !toHospitalId || !caseId) {
      setFormError('Please select source hospital, destination hospital, and patient case.');
      return;
    }

    if (fromHospitalId === toHospitalId) {
      setFormError('Source and destination hospitals cannot be identical.');
      return;
    }

    createMutation.mutate({
      from_hospital_id: Number(fromHospitalId),
      to_hospital_id: Number(toHospitalId),
      case_id: Number(caseId),
      ambulance_id: ambulanceId ? Number(ambulanceId) : null,
      shortage_reason: shortageReason || undefined,
    });
  };

  const getHospitalName = (id: number) =>
    hospitals.find((h) => h.hospital_id === id)?.name || `Hospital #${id}`;

  const getCaseName = (id: number) => {
    const c = cases.find((item) => item.case_id === id);
    return c ? `${c.patient_name} (${c.triage_level.toUpperCase()})` : `Case #${id}`;
  };

  const isMutating =
    createMutation.isPending ||
    startMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Inter-Hospital Patient Transfers</h1>
          <p className="page-subtitle">
            Coordinate emergency transfers, ambulance assignments, and hospital reception
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Request Transfer
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`ops-banner ${
            notification.type === 'success' ? 'ops-banner-success' : 'ops-banner-critical'
          }`}
        >
          <div className="ops-banner-left">
            <span className="ops-banner-title">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginRight: '0.5rem' }}>
            <Filter className="h-4 w-4" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Filter Status:
          </span>
          {[
            { value: '', label: 'All Transfers' },
            { value: 'requested', label: 'Requested' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`btn btn-sm ${statusFilter === tab.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transfers Table */}
      {transfersLoading ? (
        <div className="state-container">
          <div className="state-spinner" />
          <p className="state-title">Loading transfer logs...</p>
        </div>
      ) : transfers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <ArrowRightLeft className="h-10 w-10" style={{ color: 'var(--color-text-secondary)', margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 className="card-title">No Transfers Found</h3>
          <p className="card-sub" style={{ marginTop: '0.5rem' }}>
            {statusFilter
              ? `There are currently no transfers with status '${statusFilter}'.`
              : 'No patient transfer requests have been initiated yet.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-scroll">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Transfer ID</th>
                  <th>Patient Case</th>
                  <th>Routing</th>
                  <th>Ambulance</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Timestamps</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.transfer_id}>
                    <td className="td-mono">#{t.transfer_id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{getCaseName(t.case_id)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.825rem' }}>
                        <div><strong>From:</strong> {getHospitalName(t.from_hospital_id)}</div>
                        <div style={{ color: 'var(--color-navy-secondary)' }}>
                          <strong>To:</strong> {getHospitalName(t.to_hospital_id)}
                        </div>
                      </div>
                    </td>
                    <td>
                      {t.ambulance_id ? (
                        <span className="badge badge-neutral" style={{ fontSize: '0.775rem' }}>
                          <AmbulanceIcon className="h-3 w-3" />
                          Amb #{t.ambulance_id}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '160px' }}>
                      {t.shortage_reason || '—'}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          t.status === 'completed'
                            ? 'badge-success'
                            : t.status === 'in_progress' || t.status === 'in_transit'
                            ? 'badge-warning'
                            : t.status === 'requested'
                            ? 'badge-info'
                            : 'badge-neutral'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      <div>Req: {new Date(t.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      {t.completed_at && (
                        <div>Done: {new Date(t.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {t.status === 'requested' && (
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={isMutating}
                            onClick={() => startMutation.mutate(t.transfer_id)}
                            title="Dispatch ambulance and start transfer"
                          >
                            <Play className="h-3 w-3" />
                            Start
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            disabled={isMutating}
                            onClick={() => cancelMutation.mutate(t.transfer_id)}
                          >
                            <X className="h-3 w-3" />
                            Cancel
                          </button>
                        </div>
                      )}

                      {(t.status === 'in_progress' || t.status === 'in_transit') && (
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={isMutating}
                            onClick={() => completeMutation.mutate(t.transfer_id)}
                            title="Complete arrival, admit to destination and release source resources"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Complete
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            disabled={isMutating}
                            onClick={() => cancelMutation.mutate(t.transfer_id)}
                          >
                            <XCircle className="h-3 w-3" />
                            Cancel
                          </button>
                        </div>
                      )}

                      {(t.status === 'completed' || t.status === 'cancelled') && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          Closed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Request Patient Transfer</h3>
                <p className="card-sub" style={{ marginTop: '0.25rem' }}>
                  Initiate inter-facility transfer with concurrency verification
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="card-body">
                {formError && (
                  <div className="ops-banner ops-banner-critical" style={{ marginBottom: '1rem' }}>
                    <span className="ops-banner-title">{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="field-label" htmlFor="source-hosp">Source Hospital (From) *</label>
                  <select
                    id="source-hosp"
                    className="input"
                    value={fromHospitalId}
                    onChange={(e) => setFromHospitalId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Source Facility --</option>
                    {hospitals.map((h) => (
                      <option key={h.hospital_id} value={h.hospital_id}>
                        {h.name} ({h.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label" htmlFor="dest-hosp">Destination Hospital (To) *</label>
                  <select
                    id="dest-hosp"
                    className="input"
                    value={toHospitalId}
                    onChange={(e) => setToHospitalId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Receiving Facility --</option>
                    {hospitals
                      .filter((h) => String(h.hospital_id) !== fromHospitalId)
                      .map((h) => (
                        <option key={h.hospital_id} value={h.hospital_id}>
                          {h.name} ({h.city})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label" htmlFor="case-select">Emergency Case / Patient *</label>
                  <select
                    id="case-select"
                    className="input"
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Patient Case --</option>
                    {cases
                      .filter((c) => !fromHospitalId || String(c.hospital_id) === fromHospitalId)
                      .filter((c) => c.status !== 'discharged')
                      .map((c) => (
                        <option key={c.case_id} value={c.case_id}>
                          Case #{c.case_id} - {c.patient_name} ({c.triage_level.toUpperCase()} | {c.status})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label" htmlFor="amb-select">Assigned Ambulance (Optional)</label>
                  <select
                    id="amb-select"
                    className="input"
                    value={ambulanceId}
                    onChange={(e) => setAmbulanceId(e.target.value)}
                  >
                    <option value="">-- No Ambulance Assigned --</option>
                    {availableAmbulances
                      .filter((a) => !fromHospitalId || String(a.hospital_id) === fromHospitalId)
                      .map((a) => (
                        <option key={a.ambulance_id} value={a.ambulance_id}>
                          #{a.ambulance_id} - {a.vehicle_no} ({getHospitalName(a.hospital_id)})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label" htmlFor="shortage-reason">Shortage / Transfer Reason</label>
                  <input
                    id="shortage-reason"
                    type="text"
                    className="input"
                    placeholder="e.g. ICU bed shortage, specialist required"
                    value={shortageReason}
                    maxLength={100}
                    onChange={(e) => setShortageReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Submitting...' : 'Create Transfer Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
