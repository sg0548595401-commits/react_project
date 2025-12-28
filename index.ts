import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// יצירת ה-Store המרכזי של האפליקציה
export const store = configureStore({
  reducer: {
    auth: authReducer, // מחברים את ה-authSlice שהכנו קודם
  },
});

// הגדרות סוגים (Types) עבור TypeScript - כדי שהמערכת תזהה את המידע שלנו
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;