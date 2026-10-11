import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, EmergencyCase } from '../lib/simpleApi';
import { AlertCircle, Clock, User, Building, Plus, Filter } from 'lucide-react';

export default function EmergencyCases() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>('');
  const [triageFilter, setTriageFilter] = useState<string | undefined>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const queryClient = useQueryClient();

  const { data: cases = [], isLoading, error } = useQuery<EmergencyCase[]>({
    queryKey: ['emergency-cases', statusFilter, triageFilter],
    queryFn: () => api.getEmergencyCasesWithParams({
      status: statusFilter === '' ? undefined : statusFilter,
      triage_level: triageFilter === '' ? undefined : triageFilter,
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => api.getHospitals(),
  });

  const createMutation = useMutation({
    mutationFn: api.createEmergencyCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowCreateForm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading emergency cases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-medium">Failed to load emergency cases</p>
          <p className="text-sm text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const sortedCases = [...cases].sort((a, b) => {
    const triageOrder = { red: 0, yellow: 1, green: 2 };
    return triageOrder[a.triage_level] - triageOrder[b.triage_level];
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Emergency Cases</h1>
          <p className="page-subtitle">Active patient cases requiring attention</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus className="h-4 w-4" />
          New Case
        </button>
      </div>

      {showCreateForm && (
        <CreateCaseForm
          hospitals={hospitals || []}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowCreateForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="triage" className="filter-label">
            <AlertCircle className="h-4 w-4" />
            Triage Level
          </label>
          <select
            id="triage"
            value={triageFilter === '' ? undefined : triageFilter}
            onChange={(e) => setTriageFilter(e.target.value)}
            className="input"
          >
            <option value="">All levels</option>
            <option value="red">Red (Critical)</option>
            <option value="yellow">Yellow (Urgent)</option>
            <option value="green">Green (Stable)</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status" className="filter-label">
            <Filter className="h-4 w-4" />
            Status
          </label>
          <select
            id="status"
            value={statusFilter === '' ? undefined : statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="admitted">Admitted</option>
            <option value="transfer_pending">Transfer Pending</option>
            <option value="discharged">Discharged</option>
          </select>
        </div>
      </div>

      {/* Cases List */}
      {sortedCases.length === 0 ? (
        <div className="empty-state">
          <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-600">No emergency cases found</p>
          <p className="text-sm text-gray-500">Cases will appear here when reported</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedCases.map((emergencyCase) => (
            <CaseCard
              key={emergencyCase.case_id}
              emergencyCase={emergencyCase}
              hospitals={hospitals || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CaseCard({ emergencyCase, hospitals }: { emergencyCase: EmergencyCase; hospitals: any[] }) {
  const hospital = hospitals.find(h => h.hospital_id === emergencyCase.hospital_id);
  const reportedTime = new Date(emergencyCase.reported_at);

  const triageColors = {
    red: 'bg-red-100 text-red-800 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    green: 'bg-green-100 text-green-800 border-green-200',
  };

  const statusColors = {
    open: 'status-warning',
    admitted: 'status-info',
    transfer_pending: 'status-error',
    discharged: 'status-success',
  };

  return (
    <div className={`case-card border-l-4 ${triageColors[emergencyCase.triage_level]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Case #{emergencyCase.case_id}
            </h3>
            <span className={`triage-badge ${triageColors[emergencyCase.triage_level]}`}>
              {emergencyCase.triage_level.toUpperCase()}
            </span>
            <span className={`status-badge ${statusColors[emergencyCase.status]}`}>
              {emergencyCase.status.replace('_', ' ')}
            </span>
          </div>

          <div className="case-details">
            <div className="case-detail-item">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{emergencyCase.patient_name}</span>
            </div>

            <div className="case-detail-item">
              <Building className="h-4 w-4 text-gray-400" />
              <span>{hospital?.name || `Hospital ${emergencyCase.hospital_id}`}</span>
            </div>

            <div className="case-detail-item">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>
                Reported {reportedTime.toLocaleDateString()} at {reportedTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
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
  hospitals: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    hospital_id: '',
    patient_name: '',
    triage_level: 'yellow',
    status: 'open',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      hospital_id: Number(formData.hospital_id),
    });
  };

  return (
    <div className="form-card mb-6">
      <h3 className="text-lg font-semibold mb-4">Report New Emergency Case</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="patient_name" className="form-label">
            Patient Name
          </label>
          <input
            id="patient_name"
            type="text"
            required
            value={formData.patient_name}
            onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
            className="input"
            placeholder="Enter patient name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="hospital_id" className="form-label">
            Hospital
          </label>
          <select
            id="hospital_id"
            required
            value={formData.hospital_id}
            onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
            className="input"
          >
            <option value="">Select hospital</option>
            {hospitals.map((h) => (
              <option key={h.hospital_id} value={h.hospital_id}>
                {h.name} - {h.city}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="triage_level" className="form-label">
            Triage Level
          </label>
          <select
            id="triage_level"
            required
            value={formData.triage_level}
            onChange={(e) => setFormData({ ...formData, triage_level: e.target.value })}
            className="input"
          >
            <option value="red">Red - Critical</option>
            <option value="yellow">Yellow - Urgent</option>
            <option value="green">Green - Stable</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Case'}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}