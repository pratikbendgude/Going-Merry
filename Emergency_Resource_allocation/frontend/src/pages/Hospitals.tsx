import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, HospitalWithResources } from '../lib/api';
import { Search, MapPin, Phone, Hospital, Bed, Activity, Ambulance, AlertCircle } from 'lucide-react';

export default function Hospitals() {
  const [searchCity, setSearchCity] = useState('');
  const [traumaFilter, setTraumaFilter] = useState<number | ''>('');

  const { data: hospitals, isLoading, error } = useQuery({
    queryKey: ['hospitals-with-resources', searchCity, traumaFilter],
    queryFn: () => api.getHospitalsWithResources({
      city: searchCity || undefined,
      trauma_level: traumaFilter || undefined,
    }),
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading hospitals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-medium">Failed to load hospitals</p>
          <p className="text-sm text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospital Network</h1>
          <p className="page-subtitle">Registered facilities and their resource availability</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="city" className="filter-label">
            <MapPin className="h-4 w-4" />
            City
          </label>
          <input
            id="city"
            type="text"
            placeholder="Filter by city..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="trauma-level" className="filter-label">
            Trauma Level
          </label>
          <select
            id="trauma-level"
            value={traumaFilter}
            onChange={(e) => setTraumaFilter(e.target.value ? Number(e.target.value) : '')}
            className="input"
          >
            <option value="">All levels</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
            <option value="5">Level 5</option>
          </select>
        </div>
      </div>

      {/* Hospital List */}
      {hospitals && hospitals.length === 0 ? (
        <div className="empty-state">
          <Hospital className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-600">No hospitals found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hospitals?.map((hospital) => (
            <HospitalCard key={hospital.hospital_id} hospital={hospital} />
          ))}
        </div>
      )}
    </div>
  );
}

function HospitalCard({ hospital }: { hospital: HospitalWithResources }) {
  const bedAvailability = hospital.total_beds > 0
    ? ((hospital.available_beds / hospital.total_beds) * 100).toFixed(0)
    : '0';

  const ventAvailability = hospital.total_ventilators > 0
    ? ((hospital.available_ventilators / hospital.total_ventilators) * 100).toFixed(0)
    : '0';

  const isLowCapacity = hospital.available_beds < 2 || hospital.available_ventilators === 0;

  return (
    <div className={`hospital-card ${isLowCapacity ? 'border-amber-300' : ''}`}>
      <div className="hospital-header">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="hospital-name">{hospital.name}</h3>
            <div className="hospital-location">
              <MapPin className="h-4 w-4" />
              <span>{hospital.city}</span>
              {hospital.location && <span className="text-gray-500">• {hospital.location}</span>}
            </div>
            {hospital.contact_no && (
              <div className="hospital-contact">
                <Phone className="h-4 w-4" />
                <span>{hospital.contact_no}</span>
              </div>
            )}
          </div>
          {hospital.trauma_level && (
            <div className="trauma-badge">
              Level {hospital.trauma_level}
            </div>
          )}
        </div>
      </div>

      <div className="hospital-resources">
        <div className="resource-item">
          <div className="resource-icon bg-blue-50">
            <Bed className="h-5 w-5 text-blue-600" />
          </div>
          <div className="resource-details">
            <p className="resource-label">Beds</p>
            <p className="resource-value">
              {hospital.available_beds} / {hospital.total_beds}
            </p>
            <div className="resource-bar">
              <div
                className="resource-bar-fill bg-blue-500"
                style={{ width: `${bedAvailability}%` }}
              />
            </div>
          </div>
        </div>

        <div className="resource-item">
          <div className="resource-icon bg-green-50">
            <Activity className="h-5 w-5 text-green-600" />
          </div>
          <div className="resource-details">
            <p className="resource-label">Ventilators</p>
            <p className="resource-value">
              {hospital.available_ventilators} / {hospital.total_ventilators}
            </p>
            <div className="resource-bar">
              <div
                className="resource-bar-fill bg-green-500"
                style={{ width: `${ventAvailability}%` }}
              />
            </div>
          </div>
        </div>

        <div className="resource-item">
          <div className="resource-icon bg-amber-50">
            <Ambulance className="h-5 w-5 text-amber-600" />
          </div>
          <div className="resource-details">
            <p className="resource-label">Ambulances</p>
            <p className="resource-value">
              {hospital.available_ambulances} / {hospital.total_ambulances}
            </p>
          </div>
        </div>
      </div>

      {isLowCapacity && (
        <div className="capacity-warning">
          <AlertCircle className="h-4 w-4" />
          <span>Limited capacity</span>
        </div>
      )}
    </div>
  );
}