import { Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { MainLayout } from '../layout/MainLayout'
import Login from '../pages/Login'
import SuperAdminDashboard from '../pages/SuperAdminDashboard'
import Organizations from '../pages/superadmin/Organizations'
import Users from '../pages/superadmin/Users'
import Investment from '../pages/superadmin/Investment'
import FinancialOverview from '../pages/superadmin/FinancialOverview'
import AuditDashboard from '../pages/superadmin/AuditDashboard'
import EventAdminDashboard from '../pages/EventAdminDashboard'
import Events from '../pages/eventadmin/Events'
import Stands from '../pages/eventadmin/Stands'
import Products from '../pages/eventadmin/Products'
import OrdersLive from '../pages/OrdersLive'
import StandDashboard from '../pages/StandDashboard'
import UserHome from '../pages/UserHome'
import Wallet from '../pages/Wallet'
import UserEvents from '../pages/user/UserEvents'
import UserEventStands from '../pages/user/UserEventStands'
import UserStandProducts from '../pages/user/UserStandProducts'
import Checkout from '../pages/user/Checkout'

const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  EVENT_ADMIN: 'EVENT_ADMIN',
  STAND_ADMIN: 'STAND_ADMIN',
  USER: 'USER',
}

export const routes = [
  {
    path: '/login',
    element: <GuestOnlyRoute><Login /></GuestOnlyRoute>,
  },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <RoleRedirect />,
      },
      {
        path: 'superadmin/dashboard',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'superadmin/organizations',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}>
            <Organizations />
          </ProtectedRoute>
        ),
      },
      {
        path: 'superadmin/users',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}>
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: 'superadmin/investment',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}>
            <Investment />
          </ProtectedRoute>
        ),
      },
      {
        path: 'superadmin/financial',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}>
            <FinancialOverview />
          </ProtectedRoute>
        ),
      },
      {
        path: 'superadmin/audit',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]}>
            <AuditDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'eventadmin/dashboard',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.EVENT_ADMIN]}>
            <EventAdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'eventadmin/events',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.EVENT_ADMIN]}>
            <Events />
          </ProtectedRoute>
        ),
      },
      {
        path: 'eventadmin/stands',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.EVENT_ADMIN]}>
            <Stands />
          </ProtectedRoute>
        ),
      },
      {
        path: 'eventadmin/products',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.EVENT_ADMIN]}>
            <Products />
          </ProtectedRoute>
        ),
      },
      {
        path: 'wallet',
        element: (
          <ProtectedRoute>
            <Wallet />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            <OrdersLive />
          </ProtectedRoute>
        ),
      },
      {
        path: 'stand/dashboard',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.STAND_ADMIN]}>
            <StandDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'user/home',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.USER]}>
            <UserHome />
          </ProtectedRoute>
        ),
      },
      {
        path: 'user/events',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.USER]}>
            <UserEvents />
          </ProtectedRoute>
        ),
      },
      {
        path: 'user/events/:eventId/stands',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.USER]}>
            <UserEventStands />
          </ProtectedRoute>
        ),
      },
      {
        path: 'user/stands/:standId/products',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.USER]}>
            <UserStandProducts />
          </ProtectedRoute>
        ),
      },
      {
        path: 'user/checkout',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.USER]}>
            <Checkout />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]

function GuestOnlyRoute({ children }) {
  const { user, loading, getHomeForRole } = useAuth()
  if (loading) {
    return (
      <div className="page-loading">
        <div className="loader neon-loader" aria-hidden />
        <span>Loading...</span>
      </div>
    )
  }
  if (user) {
    const home = getHomeForRole(user.role)
    return <Navigate to={home} replace />
  }
  return children
}

function RoleRedirect() {
  const { user, getHomeForRole } = useAuth()
  const home = getHomeForRole(user?.role) || '/user/home'
  return <Navigate to={home} replace />
}
