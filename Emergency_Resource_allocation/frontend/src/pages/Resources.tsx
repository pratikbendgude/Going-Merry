import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/simpleApi';
import { Bed, Activity, Ambulance, AlertCircle, Filter } from 'lucide-react';

type ResourceType = 'beds' | 'ventilators' | 'ambulances';

export default function Resources() {
  const [activeTab, setActiveTab] = useState<ResourceType>('beds');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: beds = [], isLoading: bedsLoading } = useQuery({
    queryKey: ['beds', hospitalFilter, statusFilter],
    queryFn: () => api.getBedsWithParams({
      hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
      status: statusFilter || undefined,
      bed_type: undefined,
    }),
    enabled: activeTab === 'beds',
  });

  const { data: ventilators = [], isLoading: ventLoading } = useQuery({
    queryKey: ['ventilators', hospitalFilter, statusFilter],
    queryFn: () => api.getVentilatorsWithParams({
      hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
      status: statusFilter || undefined,
    }),
    enabled: activeTab === 'ventilators',
  });

  const { data: ambulances = [], isLoading: ambLoading } = useQuery({
    queryKey: ['ambulances', hospitalFilter, statusFilter],
    queryFn: () => api.getAmbulancesWithParams({
      hospital_id: hospitalFilter ? Number(hospitalFilter) : undefined,
      status: statusFilter || undefined,
    }),
    enabled: activeTab === 'ambulances',
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => api.getHospitals(),
  });

  const isLoading = bedsLoading || ventLoading || ambLoading;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Resource Inventory</h1>
        <p className="page-subtitle">Real-time tracking of beds, ventilators, and ambulances</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'beds' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('beds')}
        >
          <Bed className="h-4 w-4" />
          Beds
        </button>
        <button
          className={`tab ${activeTab === 'ventilators' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('ventilators')}
        >
          <Activity className="h-4 w-4" />
          Ventilators
        </button>
        <button
          className={`tab ${activeTab === 'ambulances' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('ambulances')}
        >
          <Ambulance className="h-4 w-4" />
          Ambulances
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="hospital" className="filter-label">
            <Filter className="h-4 w-4" />
            Hospital
          </label>
          <select
            id="hospital"
            value={hospitalFilter}
            onChange={(e) => setHospitalFilter(e.target.value)}
            className="input"
          >
            <option value="">All hospitals</option>
            {hospitals.map((h) => (
              <option key={h.hospital_id} value={h.hospital_id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status" className="filter-label">
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All statuses</option>
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
                <option value="returning">Returning</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading resources...</p>
        </div>
      ) : (
        <div className="resource-table-container">
          {activeTab === 'beds' && beds.length > 0 && (
            <BedsTable beds={beds} hospitals={hospitals} />
          )}
          {activeTab === 'ventilators' && ventilators.length > 0 && (
            <VentilatorsTable ventilators={ventilators} hospitals={hospitals} />
          )}
          {activeTab === 'ambulances' && ambulances.length > 0 && (
            <AmbulancesTable ambulances={ambulances} hospitals={hospitals} />
          )}
          {(activeTab === 'beds' && beds.length === 0) ||
          (activeTab === 'ventilators' && ventilators.length === 0) ||
          (activeTab === 'ambulances' && ambulances.length === 0) && (
            <div className="empty-state">
              <p>No resources found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BedsTable({ beds, hospitals }: { beds: any[]; hospitals: any[] }) {
  const getHospitalName = (id: number) => hospitals.find(h => h.hospital_id === id)?.name || `Hospital ${id}`;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Bed ID</th>
          <th>Hospital</th>
          <th>Type</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {beds.map((bed) => (
          <tr key={bed.bed_id}>
            <td className="font-mono">{bed.bed_id}</td>
            <td>{getHospitalName(bed.hospital_id)}</td>
            <td>
              <span className={`badge ${bed.bed_type === 'icu' ? 'badge-blue' : 'badge-gray'}`}>
                {bed.bed_type.toUpperCase()}
              </span>
            </td>
            <td>
              <span className={`status-badge ${bed.status === 'available' ? 'status-success' : 'status-warning'}`}>
                {bed.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function VentilatorsTable({ ventilators, hospitals }: { ventilators: any[]; hospitals: any[] }) {
  const getHospitalName = (id: number) => hospitals.find(h => h.hospital_id === id)?.name || `Hospital ${id}`;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Ventilator ID</th>
          <th>Hospital</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {ventilators.map((vent) => (
          <tr key={vent.ventilator_id}>
            <td className="font-mono">{vent.ventilator_id}</td>
            <td>{getHospitalName(vent.hospital_id)}</td>
            <td>
              <span className={`status-badge ${
                vent.status === 'available' ? 'status-success' :
                vent.status === 'in_use' ? 'status-warning' : 'status-error'
              }`}>
                {vent.status.replace('_', ' ')}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AmbulancesTable({ ambulances, hospitals }: { ambulances: any[]; hospitals: any[] }) {
  const getHospitalName = (id: number) => hospitals.find(h => h.hospital_id === id)?.name || `Hospital ${id}`;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Ambulance ID</th>
          <th>Vehicle Number</th>
          <th>Hospital</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {ambulances.map((amb) => (
          <tr key={amb.ambulance_id}>
            <td className="font-mono">{amb.ambulance_id}</td>
            <td className="font-mono font-semibold">{amb.vehicle_no}</td>
            <td>{getHospitalName(amb.hospital_id)}</td>
            <td>
              <span className={`status-badge ${
                amb.status === 'available' ? 'status-success' :
                amb.status === 'dispatched' ? 'status-warning' : 'status-info'
              }`}>
                {amb.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}