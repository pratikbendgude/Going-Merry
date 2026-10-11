import { useState, useEffect } from 'react';
import { api } from '../lib/simpleApi';
import {
  Hospital,
  Bed,
  Activity,
  Ambulance,
  AlertCircle,
  TrendingUp,
  Users,
  Droplet,
  Clock
} from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboard();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-medium">Failed to load dashboard</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const bedUtilization = ((metrics.occupied_beds / metrics.total_beds) * 100).toFixed(1);
  const ventilatorUtilization = ((metrics.in_use_ventilators / metrics.total_ventilators) * 100).toFixed(1);
  const ambulanceAvailability = ((metrics.available_ambulances / metrics.total_ambulances) * 100).toFixed(1);

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1 className="page-title">Operational Dashboard</h1>
        <p className="page-subtitle">Real-time emergency resource status</p>
      </div>

      {/* Critical Metrics */}
      <div className="metrics-grid">
        <div className="metric-card critical">
          <div className="metric-icon-wrapper bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="metric-content">
            <p className="metric-label">Critical Cases</p>
            <p className="metric-value">{metrics.open_cases + metrics.transfer_pending_cases}</p>
            <p className="metric-detail">
              {metrics.open_cases} open, {metrics.transfer_pending_cases} pending transfer
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper bg-blue-100">
            <Bed className="h-6 w-6 text-blue-600" />
          </div>
          <div className="metric-content">
            <p className="metric-label">Available Beds</p>
            <p className="metric-value">{metrics.available_beds}</p>
            <p className="metric-detail">
              {metrics.occupied_beds} occupied of {metrics.total_beds} total ({bedUtilization}% utilized)
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper bg-green-100">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
          <div className="metric-content">
            <p className="metric-label">Available Ventilators</p>
            <p className="metric-value">{metrics.available_ventilators}</p>
            <p className="metric-detail">
              {metrics.in_use_ventilators} in use of {metrics.total_ventilators} total ({ventilatorUtilization}% utilized)
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper bg-amber-100">
            <Ambulance className="h-6 w-6 text-amber-600" />
          </div>
          <div className="metric-content">
            <p className="metric-label">Ambulances Ready</p>
            <p className="metric-value">{metrics.available_ambulances}</p>
            <p className="metric-detail">
              {metrics.total_ambulances} total ({ambulanceAvailability}% available)
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="info-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Registered Hospitals</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.total_hospitals}</p>
            </div>
            <Hospital className="h-10 w-10 text-gray-400" />
          </div>
        </div>

        <div className="info-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Emergency Cases</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.total_emergency_cases}</p>
              <p className="text-xs text-gray-500 mt-1">{metrics.admitted_cases} admitted</p>
            </div>
            <Users className="h-10 w-10 text-gray-400" />
          </div>
        </div>

        <div className="info-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Blood Units Available</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.available_blood_units}</p>
              <p className="text-xs text-gray-500 mt-1">{metrics.total_blood_units} total units</p>
            </div>
            <Droplet className="h-10 w-10 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      {metrics.pending_transfers > 0 && (
        <div className="mt-6 alert alert-warning">
          <Clock className="h-5 w-5" />
          <div>
            <p className="font-medium">Pending Transfers</p>
            <p className="text-sm">{metrics.pending_transfers} patient transfer(s) in progress</p>
          </div>
        </div>
      )}

      {metrics.available_beds < 5 && (
        <div className="mt-4 alert alert-error">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Low Bed Availability</p>
            <p className="text-sm">Only {metrics.available_beds} bed(s) available across all facilities</p>
          </div>
        </div>
      )}
    </div>
  );
}