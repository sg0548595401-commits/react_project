import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLogin } from '../store/authSlice';
import axios from 'axios';
import { Container, Paper, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // הכתובת המדויקת מה-Swagger שלך:
      const response = await axios.post('http://localhost:4000/auth/login', { 
        email: email.trim(), 
        password: password.trim() 
      });

      const { token, user } = response.data;
      dispatch(setLogin({ user, token }));
      navigate('/dashboard'); // או '/tickets' בהתאם למה שהגדרת ב-App.tsx
    } catch (err: any) {
      setError(err.response?.data?.message || 'פרטי התחברות שגויים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }} dir="rtl">
      <Paper elevation={10} sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>כניסה למערכת</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleLogin}>
          <TextField fullWidth label="אימייל" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField fullWidth label="סיסמה" type="password" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ mt: 3, py: 1.5 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'התחברות'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;