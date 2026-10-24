import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, EmergencyCase, Hospital } from '../lib/api';
import {
  AlertCircle,
  Clock,
  User,
  Building,
  Plus,
  Filter,
  X,
  Trash2,
} from 'lucide-react';

export default function EmergencyCases() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [triageFilter, setTriageFilter] = useState<string>('');
  const [hospitalFilter, setHospitalFilter] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const queryClient = useQueryClient();

  const {
    data: cases = [],
    isLoading,
    error,
  } = useQuery<EmergencyCase[]>({
    queryKey: ['emergency-cases', statusFilter, triageFilter, hospitalFilter],
    queryFn: () =>
      api.getEmergencyCases({
        status: statusFilter || undefined,
        triage_level: triageFilter || undefined,
        hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
      }),
    refetchInterval: 15000,
  });

  const { data: hospitals = [] } = useQuery<Hospital[]>({
    queryKey: ['hospitals'],
    queryFn: () => api.getHospitals(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<EmergencyCase>) => api.createEmergencyCase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowCreateForm(false);
      setNotification({ type: 'success', text: 'Emergency case logged and queued for triage.' });
    },
    onError: (err: Error) => {
      setNotification({ type: 'error', text: err.message });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: EmergencyCase['status'] }) =>
      api.updateEmergencyCase(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setNotification({ type: 'success', text: 'Patient clinical status updated.' });
    },
    onError: (err: Error) => {
      setNotification({ type: 'error', text: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteEmergencyCase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setNotification({ type: 'success', text: 'Case record removed.' });
    },
    onError: (err: Error) => {
      setNotification({ type: 'error', text: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="state-container">
          <div className="spinner"></div>
          <p className="empty-state-text">Loading emergency patient cases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="state-container">
          <AlertCircle className="h-12 w-12" style={{ color: 'var(--color-critical)', marginBottom: '12px' }} />
          <h2 className="empty-state-text">Failed to load emergency cases</h2>
          <p className="empty-state-sub">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const sortedCases = [...cases].sort((a, b) => {
    const triageOrder: Record<string, number> = { red: 0, yellow: 1, green: 2 };
    return (triageOrder[a.triage_level] ?? 9) - (triageOrder[b.triage_level] ?? 9);
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Emergency Cases Intake & Triage</h1>
          <p className="page-subtitle">Track patient triage urgency, clinical admission status, and facility assignments</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4" />
            <span>Report Patient Case</span>
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

      {/* Case Creation Card */}
      {showCreateForm && (
        <CreateCaseForm
          hospitals={hospitals}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowCreateForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="triage-filter" className="filter-label">
            <AlertCircle className="h-3.5 w-3.5" />
            Triage Severity Level
          </label>
          <select
            id="triage-filter"
            value={triageFilter}
            onChange={(e) => setTriageFilter(e.target.value)}
            className="input"
          >
            <option value="">All Triage Levels</option>
            <option value="red">Red (Critical / Immediate Resuscitation)</option>
            <option value="yellow">Yellow (Urgent / Serious Care)</option>
            <option value="green">Green (Stable / Non-urgent)</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter" className="filter-label">
            <Filter className="h-3.5 w-3.5" />
            Clinical Admission Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="open">Open (Awaiting Bed / Allocation)</option>
            <option value="admitted">Admitted</option>
            <option value="transfer_pending">Transfer Pending</option>
            <option value="discharged">Discharged</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="hospital-filter" className="filter-label">
            <Building className="h-3.5 w-3.5" />
            Hospital Facility
          </label>
          <select
            id="hospital-filter"
            value={hospitalFilter}
            onChange={(e) => setHospitalFilter(e.target.value)}
            className="input"
          >
            <option value="">All Hospitals</option>
            {hospitals.map((h) => (
              <option key={h.hospital_id} value={h.hospital_id}>
                {h.name} ({h.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cases List */}
      {sortedCases.length === 0 ? (
        <div className="state-container">
          <AlertCircle className="h-12 w-12" style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
          <p className="empty-state-text">No emergency cases match the selected filters</p>
          <p className="empty-state-sub">Adjust your filters or report a new patient case above.</p>
        </div>
      ) : (
        <div className="cases-stack">
          {sortedCases.map((emergencyCase) => (
            <CaseCard
              key={emergencyCase.case_id}
              emergencyCase={emergencyCase}
              hospitals={hospitals}
              onUpdateStatus={(status) =>
                updateStatusMutation.mutate({ id: emergencyCase.case_id, status })
              }
              onDelete={() => {
                if (confirm(`Remove case #${emergencyCase.case_id} (${emergencyCase.patient_name})?`)) {
                  deleteMutation.mutate(emergencyCase.case_id);
                }
              }}
              isUpdating={updateStatusMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CaseCard({
  emergencyCase,
  hospitals,
  onUpdateStatus,
  onDelete,
  isUpdating,
}: {
  emergencyCase: EmergencyCase;
  hospitals: Hospital[];
  onUpdateStatus: (status: EmergencyCase['status']) => void;
  onDelete: () => void;
  isUpdating: boolean;
}) {
  const hospital = hospitals.find((h) => h.hospital_id === emergencyCase.hospital_id);
  const reportedTime = new Date(emergencyCase.reported_at);

  const borderClass =
    emergencyCase.triage_level === 'red'
      ? 'case-card-critical'
      : emergencyCase.triage_level === 'yellow'
      ? 'case-card-urgent'
      : 'case-card-stable';

  const triageBadgeClass =
    emergencyCase.triage_level === 'red'
      ? 'badge-critical'
      : emergencyCase.triage_level === 'yellow'
      ? 'badge-warning'
      : 'badge-success';

  const statusBadgeClass =
    emergencyCase.status === 'open'
      ? 'badge-warning'
      : emergencyCase.status === 'admitted'
      ? 'badge-info'
      : emergencyCase.status === 'transfer_pending'
      ? 'badge-critical'
      : 'badge-neutral';

  return (
    <div className={`case-card ${borderClass}`}>
      <div className="case-main">
        <div className="case-top-row">
          <span className="td-mono" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
            #{emergencyCase.case_id}
          </span>
          <span className={`badge ${triageBadgeClass}`}>
            {emergencyCase.triage_level} Triage
          </span>
          <span className={`badge ${statusBadgeClass}`}>
            {emergencyCase.status.replace('_', ' ')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User className="h-4 w-4" style={{ color: 'var(--color-secondary)' }} />
          <span className="case-patient-name">{emergencyCase.patient_name}</span>
        </div>

        <div className="case-meta-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
            <span>{hospital?.name || `Hospital #${emergencyCase.hospital_id}`}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
            <span>
              Reported {reportedTime.toLocaleDateString()} at{' '}
              {reportedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="case-actions">
        <label htmlFor={`case-status-${emergencyCase.case_id}`} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          Status:
        </label>
        <select
          id={`case-status-${emergencyCase.case_id}`}
          value={emergencyCase.status}
          disabled={isUpdating}
          onChange={(e) => onUpdateStatus(e.target.value as EmergencyCase['status'])}
          className="input"
          style={{ width: 'auto', height: '32px', fontSize: '0.8rem', padding: '0 8px' }}
        >
          <option value="open">Open</option>
          <option value="admitted">Admitted</option>
          <option value="transfer_pending">Transfer Pending</option>
          <option value="discharged">Discharged</option>
        </select>

        <button
          onClick={onDelete}
          title="Delete Case Record"
          className="btn btn-secondary btn-sm"
          style={{ padding: '4px 8px', height: '32px', color: 'var(--color-critical)' }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function CreateCaseForm({
  hospitals,
  onSubmit,
  onCancel,
  isLoading,
}: {
  hospitals: Hospital[];
  onSubmit: (data: Partial<EmergencyCase>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    patient_name: '',
    hospital_id: hospitals[0]?.hospital_id ? String(hospitals[0].hospital_id) : '',
    triage_level: 'yellow',
    status: 'open',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_name.trim() || !formData.hospital_id) return;
    onSubmit({
      patient_name: formData.patient_name.trim(),
      hospital_id: Number(formData.hospital_id),
      triage_level: formData.triage_level as EmergencyCase['triage_level'],
      status: formData.status as EmergencyCase['status'],
    });
  };

  return (
    <div className="ops-card" style={{ borderColor: 'var(--color-secondary-light)' }}>
      <div className="ops-card-header">
        <h3 className="ops-card-title">
          <User className="h-4 w-4" style={{ color: 'var(--color-secondary)' }} />
          <span>Intake Emergency Patient</span>
        </h3>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          aria-label="Close form"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="patient_name" className="form-field-label">
              Patient Full Name *
            </label>
            <input
              id="patient_name"
              type="text"
              required
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              className="input"
              placeholder="e.g. Aditi Kulkarni"
            />
          </div>

          <div className="form-field">
            <label htmlFor="hospital_id" className="form-field-label">
              Receiving Hospital Facility *
            </label>
            <select
              id="hospital_id"
              required
              value={formData.hospital_id}
              onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
              className="input"
            >
              <option value="">Select receiving hospital...</option>
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>
                  {h.name} - {h.city}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="triage_level" className="form-field-label">
              Initial Triage Severity Level *
            </label>
            <select
              id="triage_level"
              required
              value={formData.triage_level}
              onChange={(e) => setFormData({ ...formData, triage_level: e.target.value })}
              className="input"
            >
              <option value="red">Red (Critical - Immediate Resuscitation / Bed)</option>
              <option value="yellow">Yellow (Urgent - Serious Condition)</option>
              <option value="green">Green (Stable - Non-urgent)</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="case_status" className="form-field-label">
              Initial Status
            </label>
            <select
              id="case_status"
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
            >
              <option value="open">Open (Awaiting Bed / Resource Assignment)</option>
              <option value="admitted">Admitted</option>
              <option value="transfer_pending">Transfer Pending</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--color-border-light)' }}>
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register Patient Case'}
          </button>
        </div>
      </form>
    </div>
  );
}
