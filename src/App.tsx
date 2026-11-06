import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { DemoProvider } from './context/DemoContext'
import { Activity } from './pages/Activity'
import { Settings } from './pages/Settings'
import { AnnouncementDetail } from './pages/AnnouncementDetail'
import { Auth } from './pages/Auth'
import { BrowseAnnouncements } from './pages/BrowseAnnouncements'
import { BrowseOrgs } from './pages/BrowseOrgs'
import { EditAnnouncement } from './pages/EditAnnouncement'
import { EditOrg } from './pages/EditOrg'
import { CreateAnnouncement } from './pages/CreateAnnouncement'
import { CreateOrg } from './pages/CreateOrg'
import { OrgDetail } from './pages/OrgDetail'

export default function App() {
  return (
    <AuthProvider>
      <DemoProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<BrowseAnnouncements />} />
            <Route path="announcements" element={<Navigate to="/" replace />} />
            <Route path="orgs" element={<BrowseOrgs />} />
            <Route path="account" element={<Activity />} />
            <Route path="activity" element={<Navigate to="/account" replace />} />
            <Route path="browse" element={<Navigate to="/orgs" replace />} />
            <Route path="inbox" element={<Navigate to="/?scope=following" replace />} />
            <Route path="me" element={<Navigate to="/orgs?scope=mine" replace />} />
            <Route path="auth" element={<Auth />} />
            <Route path="settings" element={<Settings />} />
            <Route path="orgs/new" element={<CreateOrg />} />
            <Route path="org/:orgId" element={<OrgDetail />} />
            <Route path="org/:orgId/edit" element={<EditOrg />} />
            <Route path="org/:orgId/new" element={<CreateAnnouncement />} />
            <Route path="a/:announcementId/edit" element={<EditAnnouncement />} />
            <Route path="a/:announcementId" element={<AnnouncementDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </DemoProvider>
    </AuthProvider>
  )
}
