import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Bed as BedType, Ventilator, Ambulance, BloodUnit, Hospital } from '../lib/api';
import { Bed, Activity, Ambulance as AmbulanceIcon, Droplet, Filter, X } from 'lucide-react';

type ResourceType = 'beds' | 'ventilators' | 'ambulances' | 'blood_units';

export default function Resources() {
  const [activeTab, setActiveTab] = useState<ResourceType>('beds');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const queryClient = useQueryClient();

  const { data: hospitals = [] } = useQuery<Hospital[]>({
    queryKey: ['hospitals'],
    queryFn: () => api.getHospitals(),
  });

  const { data: beds = [], isLoading: bedsLoading } = useQuery<BedType[]>({
    queryKey: ['beds', hospitalFilter, statusFilter],
    queryFn: () =>
      api.getBeds({
        hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
        status: statusFilter || undefined,
      }),
    enabled: activeTab === 'beds',
  });

  const { data: ventilators = [], isLoading: ventLoading } = useQuery<Ventilator[]>({
    queryKey: ['ventilators', hospitalFilter, statusFilter],
    queryFn: () =>
      api.getVentilators({
        hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
        status: statusFilter || undefined,
      }),
    enabled: activeTab === 'ventilators',
  });

  const { data: ambulances = [], isLoading: ambLoading } = useQuery<Ambulance[]>({
    queryKey: ['ambulances', hospitalFilter, statusFilter],
    queryFn: () =>
      api.getAmbulances({
        hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
        status: statusFilter || undefined,
      }),
    enabled: activeTab === 'ambulances',
  });

  const { data: bloodUnits = [], isLoading: bloodLoading } = useQuery<BloodUnit[]>({
    queryKey: ['blood-units', hospitalFilter, statusFilter],
    queryFn: () =>
      api.getBloodUnits({
        hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
        status: statusFilter || undefined,
      }),
    enabled: activeTab === 'blood_units',
  });

  // Status update mutations
  const updateBedMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.updateBedStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setNotification({ type: 'success', text: 'Bed status updated.' });
    },
    onError: (err: Error) => setNotification({ type: 'error', text: err.message }),
  });

  const updateVentMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.updateVentilatorStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventilators'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setNotification({ type: 'success', text: 'Ventilator status updated.' });
    },
    onError: (err: Error) => setNotification({ type: 'error', text: err.message }),
  });

  const updateAmbMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.updateAmbulanceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambulances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setNotification({ type: 'success', text: 'Ambulance status updated.' });
    },
    onError: (err: Error) => setNotification({ type: 'error', text: err.message }),
  });

  const isLoading = bedsLoading || ventLoading || ambLoading || bloodLoading;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Resource Inventory Management</h1>
          <p className="page-subtitle">Track, filter, and configure critical facility equipment across all medical centers</p>
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

      {/* Resource Category Tabs */}
      <div className="ops-tabs">
        <button
          className={`ops-tab ${activeTab === 'beds' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('beds');
            setStatusFilter('');
          }}
        >
          <Bed className="h-4 w-4" />
          <span>Hospital Beds</span>
        </button>
        <button
          className={`ops-tab ${activeTab === 'ventilators' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('ventilators');
            setStatusFilter('');
          }}
        >
          <Activity className="h-4 w-4" />
          <span>Ventilators</span>
        </button>
        <button
          className={`ops-tab ${activeTab === 'ambulances' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('ambulances');
            setStatusFilter('');
          }}
        >
          <AmbulanceIcon className="h-4 w-4" />
          <span>Ambulances Fleet</span>
        </button>
        <button
          className={`ops-tab ${activeTab === 'blood_units' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('blood_units');
            setStatusFilter('');
          }}
        >
          <Droplet className="h-4 w-4" />
          <span>Blood Bank Inventory</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="hospital-filter" className="filter-label">
            <Filter className="h-3.5 w-3.5" />
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

        <div className="filter-group">
          <label htmlFor="status-filter" className="filter-label">
            Operational Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Statuses</option>
            {activeTab === 'beds' && (
              <>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
              </>
            )}
            {activeTab === 'ventilators' && (
              <>
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
              </>
            )}
            {activeTab === 'ambulances' && (
              <>
                <option value="available">Available</option>
                <option value="dispatched">Dispatched</option>
                <option value="on_duty">On Duty</option>
                <option value="returning">Returning</option>
              </>
            )}
            {activeTab === 'blood_units' && (
              <>
                <option value="in_stock">In Stock</option>
                <option value="issued">Issued</option>
                <option value="expired">Expired</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="state-container">
          <div className="spinner"></div>
          <p className="empty-state-text">Querying resource inventory records...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'beds' && (
            <BedsTable
              beds={beds}
              hospitals={hospitals}
              onUpdateStatus={(id, status) => updateBedMutation.mutate({ id, status })}
            />
          )}

          {activeTab === 'ventilators' && (
            <VentilatorsTable
              ventilators={ventilators}
              hospitals={hospitals}
              onUpdateStatus={(id, status) => updateVentMutation.mutate({ id, status })}
            />
          )}

          {activeTab === 'ambulances' && (
            <AmbulancesTable
              ambulances={ambulances}
              hospitals={hospitals}
              onUpdateStatus={(id, status) => updateAmbMutation.mutate({ id, status })}
            />
          )}

          {activeTab === 'blood_units' && (
            <BloodUnitsTable bloodUnits={bloodUnits} hospitals={hospitals} />
          )}

          {/* Empty state properly grouped */}
          {((activeTab === 'beds' && beds.length === 0) ||
            (activeTab === 'ventilators' && ventilators.length === 0) ||
            (activeTab === 'ambulances' && ambulances.length === 0) ||
            (activeTab === 'blood_units' && bloodUnits.length === 0)) && (
            <div className="state-container">
              <p className="empty-state-text">No resources match the selected filter criteria.</p>
              <p className="empty-state-sub">Adjust your facility or status filter above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BedsTable({
  beds,
  hospitals,
  onUpdateStatus,
}: {
  beds: BedType[];
  hospitals: Hospital[];
  onUpdateStatus: (id: number, status: string) => void;
}) {
  const getHospitalName = (id: number) =>
    hospitals.find((h) => h.hospital_id === id)?.name || `Hospital #${id}`;

  if (beds.length === 0) return null;

  return (
    <div className="table-wrapper">
      <div className="table-scroll">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Bed ID</th>
              <th>Hospital Facility</th>
              <th>Bed Category</th>
              <th>Current Status</th>
              <th style={{ textAlign: 'right' }}>Update Status</th>
            </tr>
          </thead>
          <tbody>
            {beds.map((bed) => (
              <tr key={bed.bed_id}>
                <td className="td-mono">#{bed.bed_id}</td>
                <td>{getHospitalName(bed.hospital_id)}</td>
                <td>
                  <span className={`badge ${bed.bed_type === 'icu' ? 'badge-info' : 'badge-neutral'}`}>
                    {bed.bed_type.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span className={`badge ${bed.status === 'available' ? 'badge-success' : 'badge-warning'}`}>
                    {bed.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <select
                    value={bed.status}
                    onChange={(e) => onUpdateStatus(bed.bed_id, e.target.value)}
                    className="input"
                    style={{ width: 'auto', display: 'inline-block', height: '30px', fontSize: '0.775rem' }}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VentilatorsTable({
  ventilators,
  hospitals,
  onUpdateStatus,
}: {
  ventilators: Ventilator[];
  hospitals: Hospital[];
  onUpdateStatus: (id: number, status: string) => void;
}) {
  const getHospitalName = (id: number) =>
    hospitals.find((h) => h.hospital_id === id)?.name || `Hospital #${id}`;

  if (ventilators.length === 0) return null;

  return (
    <div className="table-wrapper">
      <div className="table-scroll">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Ventilator ID</th>
              <th>Hospital Facility</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Update Status</th>
            </tr>
          </thead>
          <tbody>
            {ventilators.map((vent) => (
              <tr key={vent.ventilator_id}>
                <td className="td-mono">#{vent.ventilator_id}</td>
                <td>{getHospitalName(vent.hospital_id)}</td>
                <td>
                  <span
                    className={`badge ${
                      vent.status === 'available'
                        ? 'badge-success'
                        : vent.status === 'in_use'
                        ? 'badge-warning'
                        : 'badge-critical'
                    }`}
                  >
                    {vent.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <select
                    value={vent.status}
                    onChange={(e) => onUpdateStatus(vent.ventilator_id, e.target.value)}
                    className="input"
                    style={{ width: 'auto', display: 'inline-block', height: '30px', fontSize: '0.775rem' }}
                  >
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AmbulancesTable({
  ambulances,
  hospitals,
  onUpdateStatus,
}: {
  ambulances: Ambulance[];
  hospitals: Hospital[];
  onUpdateStatus: (id: number, status: string) => void;
}) {
  const getHospitalName = (id: number) =>
    hospitals.find((h) => h.hospital_id === id)?.name || `Hospital #${id}`;

  if (ambulances.length === 0) return null;

  return (
    <div className="table-wrapper">
      <div className="table-scroll">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Ambulance ID</th>
              <th>Vehicle Registration</th>
              <th>Hospital Station</th>
              <th>Fleet Status</th>
              <th style={{ textAlign: 'right' }}>Update Status</th>
            </tr>
          </thead>
          <tbody>
            {ambulances.map((amb) => (
              <tr key={amb.ambulance_id}>
                <td className="td-mono">#{amb.ambulance_id}</td>
                <td className="td-mono" style={{ fontWeight: 700 }}>{amb.vehicle_no}</td>
                <td>{getHospitalName(amb.hospital_id)}</td>
                <td>
                  <span
                    className={`badge ${
                      amb.status === 'available'
                        ? 'badge-success'
                        : amb.status === 'dispatched'
                        ? 'badge-warning'
                        : amb.status === 'on_duty'
                        ? 'badge-info'
                        : 'badge-neutral'
                    }`}
                  >
                    {amb.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <select
                    value={amb.status}
                    onChange={(e) => onUpdateStatus(amb.ambulance_id, e.target.value)}
                    className="input"
                    style={{ width: 'auto', display: 'inline-block', height: '30px', fontSize: '0.775rem' }}
                  >
                    <option value="available">Available</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="on_duty">On Duty</option>
                    <option value="returning">Returning</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BloodUnitsTable({
  bloodUnits,
  hospitals,
}: {
  bloodUnits: BloodUnit[];
  hospitals: Hospital[];
}) {
  const getHospitalName = (id: number) =>
    hospitals.find((h) => h.hospital_id === id)?.name || `Hospital #${id}`;

  if (bloodUnits.length === 0) return null;

  return (
    <div className="table-wrapper">
      <div className="table-scroll">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Unit ID</th>
              <th>Blood Group</th>
              <th>Hospital Blood Bank</th>
              <th>Expiration Date</th>
              <th>Inventory Status</th>
            </tr>
          </thead>
          <tbody>
            {bloodUnits.map((unit) => (
              <tr key={unit.unit_id}>
                <td className="td-mono">#{unit.unit_id}</td>
                <td>
                  <span className="badge badge-critical" style={{ fontSize: '0.8rem' }}>
                    <Droplet className="h-3 w-3" style={{ fill: 'currentColor' }} />
                    {unit.blood_group}
                  </span>
                </td>
                <td>{getHospitalName(unit.hospital_id)}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{unit.expiry_date}</td>
                <td>
                  <span
                    className={`badge ${
                      unit.status === 'in_stock'
                        ? 'badge-success'
                        : unit.status === 'issued'
                        ? 'badge-info'
                        : 'badge-critical'
                    }`}
                  >
                    {unit.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
