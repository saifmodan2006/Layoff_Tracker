import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import CompanyPage from './pages/CompanyPage'
import TrendsPage from './pages/TrendsPage'
import AlertsPage from './pages/AlertsPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/company/:name" element={<CompanyPage />} />
      <Route path="/trends" element={<TrendsPage />} />
      <Route path="/alerts" element={<AlertsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
