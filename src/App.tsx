import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store'
import { Shell } from './components/Shell'
import { OverviewPage } from './pages/OverviewPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ApplicationsPage } from './pages/ApplicationsPage'
import { DomainsPage } from './pages/DomainsPage'
import { ServersPage } from './pages/ServersPage'
import { ContainersPage } from './pages/ContainersPage'
import { BotsPage } from './pages/BotsPage'
import { IntegrationsPage } from './pages/IntegrationsPage'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<OverviewPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:slug" element={<ProjectDetailPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="domains" element={<DomainsPage />} />
            <Route path="servers" element={<ServersPage />} />
            <Route path="containers" element={<ContainersPage />} />
            <Route path="bots" element={<BotsPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
