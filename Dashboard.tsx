import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Container, Typography } from '@mui/material';
import { RootState } from '../store';

import AdminDashboard from '../components/dashboard/AdminDashboard';
import AgentDashboard from '../components/dashboard/AgentDashboard';
import CustomerDashboard from '../components/dashboard/CustomerDashboard';

const Dashboard = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);

  if (!user || !token) {
    return <Typography sx={{ p: 5, textAlign: 'center' }}>אנא המתן לטעינה...</Typography>;
  }

  return (
    <Box sx={{ bgcolor: '#f4f7fe', minHeight: '100vh', py: 4 }} dir="rtl">
      <Container maxWidth="xl">
        {user.role === 'admin' && <AdminDashboard token={token} />}
        {user.role === 'agent' && <AgentDashboard token={token} />}
        {user.role === 'customer' && <CustomerDashboard token={token} />}
      </Container>
    </Box>
  );
};

export default Dashboard;