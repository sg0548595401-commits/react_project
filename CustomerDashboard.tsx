import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, Stack, Button, Chip, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = ({ token }: { token: string }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:4000/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data || []);
    } catch (err) {
      console.error("טעינת פניות נכשלה", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchTickets(); }, [token]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box dir="rtl" sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>הפניות שלי</Typography>
      <Button variant="contained" onClick={() => navigate('/create-ticket')} sx={{ mb: 3 }}>+ פתח פנייה חדשה</Button>
      <Stack spacing={2}>
        {tickets.map((t) => {
          const tId = t._id || t.id; // פתרון לבעיית ה-undefined
          return (
            <Paper key={tId} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">{t.subject || t.title}</Typography>
                <Chip label={t.status || 'open'} size="small" color="primary" variant="outlined" />
              </Box>
              <Button variant="outlined" onClick={() => navigate(`/tickets/${tId}`)}>צ'אט</Button>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
};

export default CustomerDashboard;