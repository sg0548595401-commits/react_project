import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../store';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<'customer' | 'agent' | 'admin'>;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <h1 style={{textAlign: 'center'}}>אין גישה</h1>;

  return <>{children}</>;
};
export default RoleGuard;