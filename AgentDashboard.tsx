import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, Stack, Button, MenuItem, Select, Chip, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';

const AgentDashboard = ({ token }: { token: string }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      const res = await axios.get('http://localhost:4000/tickets', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setTickets(res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (tId: string, newStatus: string) => {
    try {
      // עדכון הסטטוס בשרת
      await axios.patch(`http://localhost:4000/tickets/${tId}`, 
        { status_id: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // טעינה מחדש של הנתונים כדי שהשינוי ייראה מיד
      fetchTickets();
    } catch (err) { 
      alert("שגיאה: לא ניתן לעדכן את הסטטוס. וודא שזה לא טיקט דמה."); 
    }
  };

  useEffect(() => { if (token) fetchTickets(); }, [token]);

  return (
    <Container maxWidth="lg" dir="rtl" sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="800" sx={{ mb: 4, color: '#1a237e' }}>ניהול פניות - סוכן</Typography>
      <Stack spacing={2}>
        {tickets.map((t) => {
          const tId = t._id || t.id;
          return (
            <Paper key={tId} elevation={2} sx={{ p: 3, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ bgcolor: '#e8eaf6', p: 1.5, borderRadius: 2 }}><AssignmentIcon sx={{ color: '#1a237e' }} /></Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">{t.subject || t.title}</Typography>
                  <Chip label={t.status || 'open'} color="primary" size="small" variant="outlined" />
                </Box>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Select 
                  size="small" 
                  value={t.status || 'open'} 
                  onChange={(e) => handleStatusChange(tId, e.target.value)}
                  sx={{ minWidth: 120, borderRadius: 2 }}
                >
                  <MenuItem value="open">פתוח</MenuItem>
                  <MenuItem value="in-progress">בטיפול</MenuItem>
                  <MenuItem value="closed">סגור</MenuItem>
                </Select>
                <Button variant="contained" onClick={() => navigate(`/tickets/${tId}`)} sx={{ borderRadius: 2, bgcolor: '#1a237e' }}>צ'אט</Button>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Container>
  );
};

export default AgentDashboard;