import React, { useState } from 'react';
import { RouteId, ProjectItem } from './types';
import { MOCK_PROJECTS } from './data/mockData';
import { DataProvider } from './context/DataContext';
import { AppShell } from './components/AppShell';
import { ExecutiveOverview } from './pages/ExecutiveOverview';
import { ProjectPortfolio } from './pages/ProjectPortfolio';
import { ProcurementExplorer } from './pages/ProcurementExplorer';
import { VowdAndRna } from './pages/VowdAndRna';
import { ProjectDetail } from './pages/ProjectDetail';
import { DataConnectionTest } from './pages/DataConnectionTest';

export default function App() {
  const [activeRoute, setActiveRoute] = useState<RouteId>('executive-overview');
  const [selectedProject, setSelectedProject] = useState<ProjectItem>(MOCK_PROJECTS[0]);

  const handleNavigate = (route: RouteId) => {
    setActiveRoute(route);
  };

  const handleSelectProject = (project: ProjectItem) => {
    setSelectedProject(project);
  };

  return (
    <DataProvider>
      <AppShell activeRoute={activeRoute} onNavigate={handleNavigate}>
        {activeRoute === 'executive-overview' && (
          <ExecutiveOverview onNavigate={handleNavigate} />
        )}

        {activeRoute === 'project-portfolio' && (
          <ProjectPortfolio
            onSelectProject={handleSelectProject}
            onNavigate={handleNavigate}
          />
        )}

        {activeRoute === 'procurement-explorer' && (
          <ProcurementExplorer
            onNavigate={handleNavigate}
            onSelectProject={handleSelectProject}
          />
        )}

        {activeRoute === 'vowd-rna' && (
          <VowdAndRna onNavigate={handleNavigate} />
        )}

        {activeRoute === 'project-detail' && (
          <ProjectDetail
            project={selectedProject}
            onNavigate={handleNavigate}
          />
        )}

        {activeRoute === 'data-connection-test' && (
          <DataConnectionTest />
        )}
      </AppShell>
    </DataProvider>
  );
}

