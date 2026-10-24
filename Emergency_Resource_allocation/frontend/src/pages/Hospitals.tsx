import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, HospitalWithResources, Hospital } from '../lib/api';
import {
  MapPin,
  Phone,
  Hospital as HospitalIcon,
  Bed,
  Activity,
  Ambulance,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
} from 'lucide-react';

export default function Hospitals() {
  const [searchCity, setSearchCity] = useState('');
  const [traumaFilter, setTraumaFilter] = useState<number | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const queryClient = useQueryClient();

  const {
    data: hospitals,
    isLoading,
    error,
  } = useQuery<HospitalWithResources[]>({
    queryKey: ['hospitals-with-resources', searchCity, traumaFilter],
    queryFn: () =>
      api.getHospitalsWithResources({
        city: searchCity || undefined,
        trauma_level: traumaFilter || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Hospital>) => api.createHospital(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals-with-resources'] });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowModal(false);
      setNotification({ type: 'success', text: 'Hospital facility registered successfully.' });
    },
    onError: (err: Error) => {
      setNotification({ type: 'error', text: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Hospital> }) =>
      api.updateHospital(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals-with-resources'] });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowModal(false);
      setEditingHospital(null);
      setNotification({ type: 'success', text: 'Hospital details updated successfully.' });
    },
    onError: (err: Error) => {
      setNotification({ type: 'error', text: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteHospital(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals-with-resources'] });
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setNotification({ type: 'success', text: 'Hospital deleted successfully.' });
    },
    onError: (err: Error) => {
      setNotification({ type: 'error', text: err.message });
    },
  });

  const handleOpenCreate = () => {
    setEditingHospital(null);
    setShowModal(true);
  };

  const handleOpenEdit = (hosp: Hospital) => {
    setEditingHospital(hosp);
    setShowModal(true);
  };

  const handleDelete = (hosp: Hospital) => {
    if (confirm(`Are you sure you want to delete ${hosp.name}? This will succeed only if no beds or cases are attached.`)) {
      deleteMutation.mutate(hosp.hospital_id);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="state-container">
          <div className="spinner"></div>
          <p className="empty-state-text">Loading hospital network directory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="state-container">
          <AlertCircle className="h-12 w-12" style={{ color: 'var(--color-critical)', marginBottom: '12px' }} />
          <h2 className="empty-state-text">Failed to load hospitals</h2>
          <p className="empty-state-sub">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Hospital Network Facilities</h1>
          <p className="page-subtitle">Registered medical facilities and live equipment capacities across the emergency grid</p>
        </div>
        <div className="page-actions">
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus className="h-4 w-4" />
            <span>Register Hospital</span>
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

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="city-filter" className="filter-label">
            <MapPin className="h-3.5 w-3.5" />
            City Search
          </label>
          <input
            id="city-filter"
            type="text"
            placeholder="Filter by city (e.g. Mumbai, Pune)..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="trauma-filter" className="filter-label">
            Trauma Center Level
          </label>
          <select
            id="trauma-filter"
            value={traumaFilter}
            onChange={(e) => setTraumaFilter(e.target.value ? Number(e.target.value) : '')}
            className="input"
          >
            <option value="">All Trauma Levels (1 - 5)</option>
            <option value="1">Level 1 (Tertiary / Immediate Trauma Care)</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
            <option value="5">Level 5</option>
          </select>
        </div>
      </div>

      {/* Hospital Cards Grid */}
      {hospitals && hospitals.length === 0 ? (
        <div className="state-container">
          <HospitalIcon className="h-12 w-12" style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
          <p className="empty-state-text">No hospitals match your filter criteria</p>
          <p className="empty-state-sub">Try searching for another city or selecting all trauma levels.</p>
        </div>
      ) : (
        <div className="hospitals-grid">
          {hospitals?.map((hospital) => (
            <HospitalCard
              key={hospital.hospital_id}
              hospital={hospital}
              onEdit={() => handleOpenEdit(hospital)}
              onDelete={() => handleDelete(hospital)}
            />
          ))}
        </div>
      )}

      {/* Hospital Form Modal */}
      {showModal && (
        <HospitalModal
          initialData={editingHospital}
          isLoading={createMutation.isPending || updateMutation.isPending}
          onClose={() => {
            setShowModal(false);
            setEditingHospital(null);
          }}
          onSubmit={(data) => {
            if (editingHospital) {
              updateMutation.mutate({ id: editingHospital.hospital_id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}

function HospitalCard({
  hospital,
  onEdit,
  onDelete,
}: {
  hospital: HospitalWithResources;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const bedPct =
    hospital.total_beds > 0
      ? Math.round((hospital.available_beds / hospital.total_beds) * 100)
      : 0;

  const ventPct =
    hospital.total_ventilators > 0
      ? Math.round((hospital.available_ventilators / hospital.total_ventilators) * 100)
      : 0;

  const isLowCapacity = hospital.available_beds < 2 || hospital.available_ventilators === 0;

  return (
    <div className="hospital-card">
      <div className="hospital-card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="hospital-name">{hospital.name}</h3>
          <div className="hospital-meta">
            <div className="hospital-meta-row">
              <MapPin className="h-3.5 w-3.5" style={{ color: 'var(--color-secondary)' }} />
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{hospital.city}</span>
              {hospital.location && <span>&bull; {hospital.location}</span>}
            </div>
            {hospital.contact_no && (
              <div className="hospital-meta-row">
                <Phone className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                <span>{hospital.contact_no}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          {hospital.trauma_level && (
            <span className="badge badge-info">Level {hospital.trauma_level}</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={onEdit}
              className="btn btn-secondary btn-sm"
              title="Edit hospital details"
              style={{ padding: '4px 6px', height: '26px' }}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="btn btn-secondary btn-sm"
              title="Delete hospital"
              style={{ padding: '4px 6px', height: '26px', color: 'var(--color-critical)' }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="hospital-resources-body">
        {/* Beds */}
        <div className="resource-metric-row">
          <div className="resource-metric-header">
            <span className="resource-metric-label">
              <Bed className="h-4 w-4" style={{ color: 'var(--color-secondary)' }} />
              <span>Available Beds</span>
            </span>
            <span className="resource-metric-val">
              {hospital.available_beds} / {hospital.total_beds}
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${bedPct}%`, backgroundColor: 'var(--color-secondary)' }}
            />
          </div>
        </div>

        {/* Ventilators */}
        <div className="resource-metric-row">
          <div className="resource-metric-header">
            <span className="resource-metric-label">
              <Activity className="h-4 w-4" style={{ color: 'var(--color-success)' }} />
              <span>Ventilators Ready</span>
            </span>
            <span className="resource-metric-val">
              {hospital.available_ventilators} / {hospital.total_ventilators}
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${ventPct}%`, backgroundColor: 'var(--color-success)' }}
            />
          </div>
        </div>

        {/* Ambulances */}
        <div className="resource-metric-row">
          <div className="resource-metric-header">
            <span className="resource-metric-label">
              <Ambulance className="h-4 w-4" style={{ color: 'var(--color-warning)' }} />
              <span>Ambulances Stationed</span>
            </span>
            <span className="resource-metric-val">
              {hospital.available_ambulances} / {hospital.total_ambulances}
            </span>
          </div>
        </div>
      </div>

      {isLowCapacity && (
        <div className="hospital-card-footer">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Limited reserve capacity</span>
        </div>
      )}
    </div>
  );
}

function HospitalModal({
  initialData,
  isLoading,
  onClose,
  onSubmit,
}: {
  initialData: Hospital | null;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Hospital>) => void;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    city: initialData?.city || '',
    location: initialData?.location || '',
    contact_no: initialData?.contact_no || '',
    trauma_level: initialData?.trauma_level ? String(initialData.trauma_level) : '1',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name.trim(),
      city: formData.city.trim(),
      location: formData.location.trim() || null,
      contact_no: formData.contact_no.trim() || null,
      trauma_level: formData.trauma_level ? Number(formData.trauma_level) : null,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-window">
        <div className="modal-header">
          <h3 className="modal-title">
            {initialData ? 'Edit Hospital Facility' : 'Register New Hospital Facility'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label className="form-field-label" htmlFor="name">
                Hospital Facility Name *
              </label>
              <input
                id="name"
                required
                className="input"
                placeholder="e.g. Metro Trauma Hospital"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-field-label" htmlFor="city">
                  City *
                </label>
                <input
                  id="city"
                  required
                  className="input"
                  placeholder="e.g. Mumbai"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-field-label" htmlFor="trauma">
                  Trauma Level
                </label>
                <select
                  id="trauma"
                  className="input"
                  value={formData.trauma_level}
                  onChange={(e) => setFormData({ ...formData, trauma_level: e.target.value })}
                >
                  <option value="1">Level 1 (Highest)</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-field-label" htmlFor="location">
                Street / Area Location
              </label>
              <input
                id="location"
                className="input"
                placeholder="e.g. Central Avenue, Sector 4"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label className="form-field-label" htmlFor="contact">
                Emergency Dispatch Contact Number
              </label>
              <input
                id="contact"
                className="input"
                placeholder="e.g. 022-26543210"
                value={formData.contact_no}
                onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{initialData ? 'Update Facility' : 'Register Facility'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
