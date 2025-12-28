import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axios from 'axios';
import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, Typography, Chip } from '@mui/material';

const TicketsList: React.FC = () => {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const { token, user } = useSelector((state: RootState) => state.auth);

  const fetchData = async () => {
    try {
      // לפי הסוואגר שלך, הנתיב הוא /tickets
      const res = await axios.get('http://localhost:4000/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data);
      
      if (user?.role === 'admin') {
        const agRes = await axios.get('http://localhost:4000/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAgents(agRes.data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }} dir="rtl">
      <Typography variant="h4" gutterBottom fontWeight="bold">ניהול קריאות</Typography>
      <TableContainer component={Paper} elevation={4}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell align="right">כותרת</TableCell>
              <TableCell align="right">סטטוס</TableCell>
              <TableCell align="right">טיפול ע"י</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((t: any) => (
              <TableRow key={t._id}>
                <TableCell align="right">{t.title}</TableCell>
                <TableCell align="right"><Chip label={t.status} color="primary" variant="outlined" /></TableCell>
                <TableCell align="right">
                  {user?.role === 'admin' ? (
                    <Select size="small" value={t.assignedTo || ''} displayEmpty 
                      onChange={(e) => console.log(e.target.value as string)}>
                      <MenuItem value="" disabled>בחר סוכן</MenuItem>
                      {agents.map((a: any) => <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>)}
                    </Select>
                  ) : (t.agentName || 'לא הוקצה')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default TicketsList;