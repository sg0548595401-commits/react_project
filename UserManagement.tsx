import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axios from 'axios';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const UserManagement = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await axios.get('http://localhost:4000/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    };
    fetchUsers();
  }, [token]);

  return (
    <Container maxWidth="md" sx={{ mt: 5 }} dir="rtl">
      <Typography variant="h4" fontWeight="bold" gutterBottom>ניהול משתמשים (אדמין בלבד)</Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell align="right">שם המשתמש</TableCell>
              <TableCell align="right">אימייל</TableCell>
              <TableCell align="right">תפקיד</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u: any) => (
              <TableRow key={u._id}>
                <TableCell align="right">{u.name}</TableCell>
                <TableCell align="right">{u.email}</TableCell>
                <TableCell align="right">{u.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default UserManagement;