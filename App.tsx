import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TicketDetails from './pages/TicketDetails';
import CreateTicket from './pages/CreateTicket';

function App() {
  const { token } = useSelector((state: RootState) => state.auth);

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/tickets/:id" element={token ? <TicketDetails /> : <Navigate to="/login" />} />
        <Route path="/create-ticket" element={token ? <CreateTicket /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;