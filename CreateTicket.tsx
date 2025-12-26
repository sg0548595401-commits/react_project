import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Container } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const CreateTicket = () => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const { token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:4000/tickets', { subject, description }, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/dashboard');
    } catch (err) { console.error(err); }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }} dir="rtl">
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>פתיחת קריאה חדשה</Typography>
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="נושא" value={subject} onChange={(e) => setSubject(e.target.value)} margin="normal" required />
          <TextField fullWidth label="תיאור" multiline rows={4} value={description} onChange={(e) => setDescription(e.target.value)} margin="normal" required />
          <Button fullWidth type="submit" variant="contained" sx={{ mt: 3, bgcolor: '#1a237e' }}>שלח פנייה</Button>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateTicket;