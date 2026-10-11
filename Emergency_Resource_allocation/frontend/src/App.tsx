import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Hospitals from './pages/Hospitals';
import Resources from './pages/Resources';
import EmergencyCases from './pages/EmergencyCases';
import Allocations from './pages/Allocations';
import Header from './components/Header';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="App">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Navigate replace to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/hospitals" element={<Hospitals />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/emergency-cases" element={<EmergencyCases />} />
              <Route path="/allocations" element={<Allocations />} />
              <Route path="*" element={<Navigate replace to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;