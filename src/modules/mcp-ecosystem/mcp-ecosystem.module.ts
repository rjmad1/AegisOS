import { PlatformModule } from '@/platform/kernel/types';
import { Server } from 'lucide-react';

export const mcpEcosystemModule: PlatformModule = {
  id: 'mcp-ecosystem', name: 'MCP Ecosystem', version: '1.0.0', domain: 'mcp-ecosystem',
  routes: [ { path: '/mcp-ecosystem', moduleId: 'mcp-ecosystem', label: 'MCP Ecosystem' } ],
  navItems: [
    { id: 'nav-mcp-ecosystem', label: 'MCP Ecosystem', href: '/mcp-ecosystem', icon: Server, group: 'Platform', order: 8 }
  ]
};
