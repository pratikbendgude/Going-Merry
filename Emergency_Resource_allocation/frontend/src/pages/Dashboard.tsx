import { useQuery } from '@tanstack/react-query';
import { api, DashboardMetrics } from '../lib/api';
import { Link } from 'react-router-dom';
import {
  Hospital,
  Bed,
  Activity,
  Ambulance,
  AlertCircle,
  Users,
  Droplet,
  Clock,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function Dashboard() {
  const {
    data: metrics,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="state-container">
          <div className="spinner"></div>
          <p className="empty-state-text">Connecting to Emergency Operations Telemetry...</p>
          <p className="empty-state-sub">Aggregating real-time facility metrics from database</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="page-container">
        <div className="state-container">
          <AlertCircle className="h-12 w-12" style={{ color: 'var(--color-critical)', marginBottom: '12px' }} />
          <h2 className="empty-state-text">Failed to Load Dashboard Telemetry</h2>
          <p className="empty-state-sub" style={{ marginBottom: '16px' }}>
            {error instanceof Error ? error.message : 'Backend unreachable or database offline'}
          </p>
          <button onClick={() => refetch()} className="btn btn-primary">
            <RefreshCw className="h-4 w-4" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const bedUtilization =
    metrics.total_beds > 0
      ? ((metrics.occupied_beds / metrics.total_beds) * 100).toFixed(1)
      : '0.0';

  const ventilatorUtilization =
    metrics.total_ventilators > 0
      ? ((metrics.in_use_ventilators / metrics.total_ventilators) * 100).toFixed(1)
      : '0.0';

  const ambulanceAvailability =
    metrics.total_ambulances > 0
      ? ((metrics.available_ambulances / metrics.total_ambulances) * 100).toFixed(1)
      : '0.0';

  const bloodStockPct =
    metrics.total_blood_units > 0
      ? ((metrics.available_blood_units / metrics.total_blood_units) * 100).toFixed(0)
      : '0';

  const criticalCasesCount = metrics.open_cases + metrics.transfer_pending_cases;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Operations Command Center</h1>
          <p className="page-subtitle">Real-time emergency facility telemetry, equipment inventory, and patient triage</p>
        </div>
        <div className="page-actions">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="btn btn-secondary"
            title="Refresh metrics from database"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>{isRefetching ? 'Updating...' : 'Refresh'}</span>
          </button>
          <Link to="/allocations" className="btn btn-primary">
            <span>New Allocation</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Emergency Active Cases Alert Banner */}
      {criticalCasesCount > 0 && (
        <div className="ops-banner ops-banner-critical">
          <div className="ops-banner-left">
            <AlertCircle className="h-5 w-5 ops-banner-icon" style={{ color: 'var(--color-critical)' }} />
            <div>
              <p className="ops-banner-title">
                {criticalCasesCount} Active Emergency Case{criticalCasesCount > 1 ? 's' : ''} Requiring Immediate Resource Assignment
              </p>
              <p className="ops-banner-text">
                {metrics.open_cases} open triage case{metrics.open_cases !== 1 ? 's' : ''} awaiting bed assignment,{' '}
                {metrics.transfer_pending_cases} patient transfer pending inter-hospital transit.
              </p>
            </div>
          </div>
          <Link to="/emergency-cases" className="ops-banner-action">
            <span>Manage Intake</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Primary Key Operational Metrics (4 Resource Columns) */}
      <div className="metrics-grid">
        {/* Available Beds */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Available Beds</span>
            <div className="metric-icon-box metric-icon-blue">
              <Bed className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="metric-value-row">
              <span className="metric-num">{metrics.available_beds}</span>
              <span className="metric-total-sub">/ {metrics.total_beds} total</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, 100 - Number(bedUtilization)))}%`,
                  backgroundColor: 'var(--color-secondary)',
                }}
              />
            </div>
          </div>
          <p className="metric-footer-text">
            {metrics.occupied_beds} occupied ({bedUtilization}% utilization rate)
          </p>
        </div>

        {/* Available Ventilators */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Available Ventilators</span>
            <div className="metric-icon-box metric-icon-green">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="metric-value-row">
              <span className="metric-num">{metrics.available_ventilators}</span>
              <span className="metric-total-sub">/ {metrics.total_ventilators} total</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, 100 - Number(ventilatorUtilization)))}%`,
                  backgroundColor: 'var(--color-success)',
                }}
              />
            </div>
          </div>
          <p className="metric-footer-text">
            {metrics.in_use_ventilators} in use ({ventilatorUtilization}% utilization rate)
          </p>
        </div>

        {/* Ambulances Ready */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Ambulances Ready</span>
            <div className="metric-icon-box metric-icon-amber">
              <Ambulance className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="metric-value-row">
              <span className="metric-num">{metrics.available_ambulances}</span>
              <span className="metric-total-sub">/ {metrics.total_ambulances} total</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${ambulanceAvailability}%`,
                  backgroundColor: 'var(--color-warning)',
                }}
              />
            </div>
          </div>
          <p className="metric-footer-text">
            {ambulanceAvailability}% ready response fleet
          </p>
        </div>

        {/* Blood Inventory */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Blood Units Stocked</span>
            <div className="metric-icon-box metric-icon-red">
              <Droplet className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="metric-value-row">
              <span className="metric-num">{metrics.available_blood_units}</span>
              <span className="metric-total-sub">/ {metrics.total_blood_units} total</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${bloodStockPct}%`,
                  backgroundColor: 'var(--color-critical)',
                }}
              />
            </div>
          </div>
          <p className="metric-footer-text">
            {metrics.total_blood_units - metrics.available_blood_units} units issued across facilities
          </p>
        </div>
      </div>

      {/* Network Overview Summary Cards */}
      <div className="secondary-grid">
        <div className="summary-card">
          <div>
            <p className="summary-label">Network Hospitals</p>
            <p className="summary-num">{metrics.total_hospitals}</p>
            <p className="summary-desc">Registered medical facilities reporting live status</p>
            <Link to="/hospitals" className="summary-link">
              <span>View network directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="summary-icon-box">
            <Hospital className="h-6 w-6" />
          </div>
        </div>

        <div className="summary-card">
          <div>
            <p className="summary-label">Emergency Patient Intake</p>
            <p className="summary-num">{metrics.total_emergency_cases}</p>
            <p className="summary-desc">
              {metrics.admitted_cases} currently admitted &bull; {metrics.open_cases} awaiting beds
            </p>
            <Link to="/emergency-cases" className="summary-link">
              <span>View patient triage list</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="summary-icon-box">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="summary-card">
          <div>
            <p className="summary-label">Inter-Facility Transfers</p>
            <p className="summary-num">{metrics.pending_transfers}</p>
            <p className="summary-desc">
              {metrics.pending_transfers > 0
                ? 'Active patient transfers in transit'
                : 'No pending patient transfers'}
            </p>
            <Link to="/resources" className="summary-link">
              <span>Check fleet availability</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="summary-icon-box">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Operational Threshold Status Banners */}
      <div className="status-banners-grid">
        {metrics.available_beds <= 2 ? (
          <div className="ops-banner ops-banner-warning">
            <div className="ops-banner-left">
              <AlertTriangle className="h-5 w-5 ops-banner-icon" style={{ color: 'var(--color-warning)' }} />
              <div>
                <p className="ops-banner-title">Low Bed Availability Threshold Warning</p>
                <p className="ops-banner-text">
                  Only {metrics.available_beds} beds remain available across all registered hospitals.
                </p>
              </div>
            </div>
            <Link to="/resources" className="ops-banner-action" style={{ color: 'var(--color-warning)' }}>
              Inspect Beds &rarr;
            </Link>
          </div>
        ) : (
          <div className="ops-banner ops-banner-success">
            <div className="ops-banner-left">
              <CheckCircle2 className="h-5 w-5 ops-banner-icon" style={{ color: 'var(--color-success)' }} />
              <div>
                <p className="ops-banner-title">Bed Capacity Normal</p>
                <p className="ops-banner-text">
                  Facility bed inventory is operating within standard reserve margins.
                </p>
              </div>
            </div>
          </div>
        )}

        {metrics.available_ventilators <= 2 ? (
          <div className="ops-banner ops-banner-warning">
            <div className="ops-banner-left">
              <AlertTriangle className="h-5 w-5 ops-banner-icon" style={{ color: 'var(--color-warning)' }} />
              <div>
                <p className="ops-banner-title">Ventilator Inventory Reserve Warning</p>
                <p className="ops-banner-text">
                  Only {metrics.available_ventilators} ventilators currently available for deployment.
                </p>
              </div>
            </div>
            <Link to="/resources" className="ops-banner-action" style={{ color: 'var(--color-warning)' }}>
              Inspect Vents &rarr;
            </Link>
          </div>
        ) : (
          <div className="ops-banner ops-banner-success">
            <div className="ops-banner-left">
              <CheckCircle2 className="h-5 w-5 ops-banner-icon" style={{ color: 'var(--color-success)' }} />
              <div>
                <p className="ops-banner-title">Ventilator Reserves Stable</p>
                <p className="ops-banner-text">
                  Critical life support ventilator inventory meets operational safety thresholds.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
