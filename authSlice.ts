import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent' | 'admin'; 
}

interface AuthState {
  user: User | null;
  token: string | null;
}

const initialState: AuthState = { user: null, token: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLogin: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setLogin, logout } = authSlice.actions;
export default authSlice.reducer;