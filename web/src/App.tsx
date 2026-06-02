import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Today from './pages/Today';
import Upcoming from './pages/Upcoming';
import Inbox from './pages/Inbox';
import ProjectView from './pages/ProjectView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<Today />} />
          <Route path="/upcoming" element={<Upcoming />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/project/:id" element={<ProjectView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
