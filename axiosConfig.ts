import axios from 'axios';

// יצירת מופע של אקסיוס עם הגדרות קבועות
const instance = axios.create({
  baseURL: 'http://localhost:4000',
});

// הוספת "מיירט" (Interceptor) שמוסיף את הטוקן לכל שליחה
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;