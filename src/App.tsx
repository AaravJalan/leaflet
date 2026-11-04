import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { AnnouncementDetail } from './pages/AnnouncementDetail'
import { Auth } from './pages/Auth'
import { Browse } from './pages/Browse'
import { CreateAnnouncement } from './pages/CreateAnnouncement'
import { CreateOrg } from './pages/CreateOrg'
import { Home } from './pages/Home'
import { MyOrgs } from './pages/MyOrgs'
import { OrgDetail } from './pages/OrgDetail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="browse" element={<Browse />} />
            <Route path="auth" element={<Auth />} />
            <Route path="me" element={<MyOrgs />} />
            <Route path="orgs/new" element={<CreateOrg />} />
            <Route path="org/:orgId" element={<OrgDetail />} />
            <Route path="org/:orgId/new" element={<CreateAnnouncement />} />
            <Route path="a/:announcementId" element={<AnnouncementDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
