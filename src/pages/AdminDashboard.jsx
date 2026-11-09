import React from 'react';
import { Navigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

/**
 * AdminDashboard — legacy alias. The admin overview now lives inside
 * Admin.jsx (overview tab), so this page simply redirects there.
 */
export default function AdminDashboard() {
  return <Navigate to={createPageUrl('Admin')} replace />;
}
