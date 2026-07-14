// src/modules/developer/kanban/tokens.ts

import { ServiceToken } from '@/platform/kernel/types';
import { IKanbanOrchestrator } from './types';

export const KanbanOrchestratorToken: ServiceToken<IKanbanOrchestrator> = 
  'platform.developer.kanbanOrchestrator' as ServiceToken<IKanbanOrchestrator>;
