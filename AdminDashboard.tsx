import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Stack, Paper, Chip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = ({ token }: { token: string }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [view, setView] = useState<'tickets' | 'users'>('tickets');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      console.log('Fetching admin data...');
      const [tRes, uRes, sRes] = await Promise.all([
        axios.get('http://localhost:4000/tickets', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:4000/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:4000/statuses', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      console.log('✅ Tickets fetched:', tRes.data);
      console.log('✅ Users fetched:', uRes.data);
      console.log('✅ Statuses fetched:', sRes.data);
      
      const agents = (uRes.data || []).filter((u: any) => u.role === 'agent');
      console.log('📊 Agents found:', agents.length, agents);
      
      setTickets(tRes.data || []);
      setUsers(uRes.data || []);
      setStatuses(sRes.data || []);
    } catch (err: any) { 
      console.error("Error fetching data:", err?.response?.data || err); 
    }
  };

  const handleAssign = async (tId: string, agentId: string) => {
    console.log('🔔 handleAssign called!');
    console.log('=== ASSIGN START ===');
    console.log('Ticket ID:', tId, 'Type:', typeof tId);
    console.log('Agent ID:', agentId, 'Type:', typeof agentId);
    console.log('Token:', token ? 'Present' : 'Missing');
    
    if (!agentId || agentId === '') {
      console.log('❌ No agent selected, returning');
      return;
    }
    
    if (!token) {
      console.log('❌ No token, cannot proceed');
      alert('אין הרשאה להקצאה');
      return;
    }
    
    try {
      console.log('📝 Updating local state...');
      setTickets(prev => prev.map(t => {
        const currentId = t._id || t.id;
        if (String(currentId) === String(tId)) {
          console.log('✅ Found ticket in local state, updating');
          return { ...t, assignedTo: agentId, assigned_to: agentId };
        }
        return t;
      }));
      
      const url = `http://localhost:4000/tickets/${tId}`;
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      };
      
      // נסה שני payloads אפשריים
      const payloads = [
        { assignedTo: agentId },
        { assigned_to: agentId },
        { assignedTo: Number(agentId) },
        { assigned_to: Number(agentId) },
        { agent_id: agentId }
      ];
      
      let success = false;
      let lastError = null;
      
      for (const payload of payloads) {
        try {
          console.log('🚀 Trying PATCH with payload:', payload);
          const patchRes = await axios.patch(url, payload, { headers });
          console.log('✅ Server response status:', patchRes.status);
          console.log('✅ Server response data:', patchRes.data);
          success = true;
          break;
        } catch (err: any) {
          console.log('❌ This payload failed:', payload);
          console.log('  Error:', err?.response?.status, err?.response?.data);
          lastError = err;
        }
      }
      
      if (!success) {
        throw lastError;
      }
      
      console.log('✅ Assignment succeeded');
      setTimeout(() => fetchData(), 500);
      
    } catch (err: any) { 
      console.log('❌ ASSIGN FAILED!');
      console.log('Error status:', err?.response?.status);
      console.log('Error data:', err?.response?.data);
      console.log('Error message:', err?.message);
      
      alert('❌ שגיאה בהקצאה לעובד:\n' + (err?.response?.data?.message || err?.message || 'Unknown error'));
      fetchData();
    }
    console.log('=== ASSIGN END ===');
  };

  const handleStatusChange = async (tId: string, newStatusId: number) => {
    console.log('🔔 handleStatusChange called!');
    console.log('=== STATUS CHANGE START ===');
    console.log('Ticket ID:', tId, 'New Status ID:', newStatusId, 'Type:', typeof newStatusId);
    
    if (!newStatusId || isNaN(newStatusId) || !token) {
      console.log('❌ Missing or invalid data:', { newStatusId, token: !!token });
      return;
    }
    
    try {
      console.log('📝 Updating local state...');
      const statusName = statuses.find((s: any) => s.id === newStatusId)?.name || '';
      
      setTickets(prev => prev.map(t => {
        const currentId = t._id || t.id;
        if (String(currentId) === String(tId)) {
          console.log('✅ Found ticket in local state, updating to status:', statusName);
          return { ...t, status_id: newStatusId, status_name: statusName };
        }
        return t;
      }));
      
      const url = `http://localhost:4000/tickets/${tId}`;
      
      // נסה שני payloads אפשריים
      const payloads = [
        { status_id: newStatusId },
        { statusId: newStatusId }
      ];
      
      let success = false;
      let lastError = null;
      
      for (const payload of payloads) {
        try {
          console.log('🚀 Trying PATCH with payload:', payload);
          const patchRes = await axios.patch(url, payload, {
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            }
          });
          console.log('✅ Server response:', patchRes.status, patchRes.data);
          success = true;
          break;
        } catch (err: any) {
          console.log('❌ This payload failed:', payload);
          lastError = err;
        }
      }
      
      if (!success) {
        throw lastError;
      }
      
      setTimeout(() => fetchData(), 500);
      
    } catch (err: any) {
      console.log('❌ STATUS CHANGE FAILED!');
      console.log('Error:', err?.response?.status, err?.response?.data);
      
      alert('❌ שגיאה בשינוי סטטוס:\n' + (err?.response?.data?.message || err?.message));
      fetchData();
    }
    console.log('=== STATUS CHANGE END ===');
  };

  const handleDeleteTicket = async (tId: string) => {
    console.log('🔔 handleDeleteTicket called!');
    console.log('Ticket ID to delete:', tId, 'Type:', typeof tId);
    const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק פנייה זו? לא ניתן לשחזר!');
    
    if (!confirmed) {
      console.log('Delete cancelled by user');
      return;
    }
    
    console.log('=== DELETE TICKET START ===');
    console.log('Ticket ID to delete:', tId, 'Type:', typeof tId);
    
    if (!token) {
      alert('אין הרשאה למחיקה');
      return;
    }
    
    try {
      console.log('🗑️ Removing ticket from local state...');
      setTickets(prev => prev.filter(t => {
        const currentId = t._id || t.id;
        return String(currentId) !== String(tId);
      }));
      
      const url = `http://localhost:4000/tickets/${tId}`;
      console.log('🚀 Sending DELETE request to:', url);
      
      const deleteRes = await axios.delete(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Server response status:', deleteRes.status);
      console.log('✅ Server response data:', deleteRes.data);
      
      alert('✅ הפנייה נמחקה בהצלחה');
      setTimeout(() => fetchData(), 500);
      
    } catch (err: any) {
      console.log('❌ DELETE FAILED!');
      console.log('Error status:', err?.response?.status);
      console.log('Error data:', err?.response?.data);
      console.log('Error message:', err?.message);
      
      alert('❌ שגיאה במחיקת הפנייה:\n' + (err?.response?.data?.message || err?.message));
      fetchData();
    }
    console.log('=== DELETE TICKET END ===');
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  return (
    <Box dir="rtl">
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button variant={view === 'tickets' ? 'contained' : 'outlined'} onClick={() => setView('tickets')}>ניהול פניות</Button>
        <Button variant={view === 'users' ? 'contained' : 'outlined'} onClick={() => setView('users')}>רשימת לקוחות</Button>
      </Stack>

      {view === 'tickets' ? (
        <Stack spacing={2}>
          {tickets.length === 0 ? (
            <Typography color="textSecondary" align="center">אין פניות להצגה</Typography>
          ) : (
            tickets.map((t) => {
              const ticketId = t._id || t.id;
              const agents = users.filter(u => u.role === 'agent');
              const assignedAgent = agents.find(a => (a._id || a.id) === t.assignedTo);
              
              console.log('Ticket:', ticketId, {
                assignedTo: t.assignedTo,
                agents: agents.map(a => ({ id: a._id || a.id, name: a.name })),
                assignedAgent: assignedAgent?.name || 'Not assigned'
              });
              
              return (
                <Paper key={ticketId} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight="bold">{t.subject || t.title || "פנייה חדשה"}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      סטטוס: {t.status_name || t.status || 'open'} | הוקצה ל: {assignedAgent?.name || 'לא הוקצה'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {/* סטטוס */}
                    {statuses && statuses.length > 0 ? (
                      <Select 
                        size="small" 
                        value={t.status_id ? String(t.status_id) : ''} 
                        displayEmpty 
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value && value !== '') {
                            console.log('🔄 Status Select changed for ticket', ticketId);
                            console.log('  New value:', value, 'Type:', typeof value);
                            handleStatusChange(String(ticketId), Number(value));
                          } else {
                            console.log('❌ Empty status selected, ignoring');
                          }
                        }}
                        sx={{ minWidth: 140 }}
                      >
                        <MenuItem value="">בחר סטטוס...</MenuItem>
                        {statuses.map((s: any) => (
                          <MenuItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <Typography variant="body2" color="error">
                        אין סטטוסים
                      </Typography>
                    )}

                    {/* הקצאה לעובד */}
                    {agents && agents.length > 0 ? (
                      <Select 
                        size="small" 
                        value={t.assignedTo ? String(t.assignedTo) : ''} 
                        displayEmpty 
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value && value !== '') {
                            console.log('🔄 Assign Select changed for ticket', ticketId);
                            console.log('  New value:', value, 'Type:', typeof value);
                            handleAssign(String(ticketId), value);
                          } else {
                            console.log('❌ Empty value selected, ignoring');
                          }
                        }}
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="">בחר עובד...</MenuItem>
                        {agents.map(a => {
                          const agentId = String(a._id || a.id);
                          return (
                            <MenuItem key={agentId} value={agentId}>
                              {a.name}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    ) : (
                      <Typography variant="body2" color="error" sx={{ minWidth: 180 }}>
                        אין עובדים זמינים ({users.length} users total)
                      </Typography>
                    )}
                    <Button variant="contained" size="small" onClick={() => navigate(`/tickets/${ticketId}`)}>צ'אט</Button>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      size="small" 
                      onClick={() => handleDeleteTicket(String(ticketId))}
                    >
                      🗑️ מחק
                    </Button>
                  </Stack>
                </Paper>
              );
            })
          )}
        </Stack>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}><TableRow>
              <TableCell align="right">שם הלקוח</TableCell>
              <TableCell align="right">אימייל</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {users.filter(u => u.role === 'customer').map((u) => (
                <TableRow key={u._id || u.id}>
                  <TableCell align="right">{u.name}</TableCell>
                  <TableCell align="right">{u.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AdminDashboard;