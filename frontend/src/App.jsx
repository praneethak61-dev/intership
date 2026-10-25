import { Routes, Route, Navigate } from 'react-router-dom';
import History from './pages/History';
import StartCall from './pages/StartCall';
import ActiveCall from './pages/ActiveCall';
import CallDetail from './pages/CallDetail';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<History />} />
      <Route path="/new" element={<StartCall />} />
      <Route path="/call/:id" element={<ActiveCall />} />
      <Route path="/call/:id/review" element={<CallDetail />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
