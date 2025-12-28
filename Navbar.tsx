import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';

const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography sx={{ flexGrow: 1 }}>HelpDesk | שלום {user.name}</Typography>
        <Button color="inherit" onClick={() => { dispatch(logout()); navigate('/login'); }}>
          התנתק
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;