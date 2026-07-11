import { PlatformModule } from '@/platform/kernel/types';
import { Folder, FileCode } from 'lucide-react';

export const artifactsModule: PlatformModule = {
  id: 'artifacts',
  name: 'Artifacts & Files',
  version: '1.0.0',
  domain: 'artifacts',
  description: 'Local file workspace browsing and artifact code output management',
  
  routes: [
    { path: '/files', moduleId: 'artifacts', label: 'File Explorer' },
    { path: '/artifacts', moduleId: 'artifacts', label: 'Artifact Registry' },
  ],
  
  navItems: [
    {
      id: 'nav-files',
      label: 'Files',
      href: '/files',
      icon: Folder,
      group: 'Artifacts',
      order: 1,
    },
    {
      id: 'nav-artifacts',
      label: 'Artifacts',
      href: '/artifacts',
      icon: FileCode,
      group: 'Artifacts',
      order: 2,
    },
  ],
  
  commands: [
    {
      id: 'cmd.files.goto',
      title: 'Go to File Explorer',
      category: 'navigation',
      action: () => {
        window.location.href = '/files';
      },
    },
    {
      id: 'cmd.artifacts.goto',
      title: 'Go to Artifact Registry',
      category: 'navigation',
      action: () => {
        window.location.href = '/artifacts';
      },
    },
  ],
};
