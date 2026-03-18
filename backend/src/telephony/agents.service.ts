import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent, AgentStatus } from './entities/agent.entity';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(@InjectRepository(Agent) private agentRepo: Repository<Agent>) {}

  async registerAgent(tenantId: string, data: {
    name: string; sipExtension: string; department: string;
  }) {
    return this.agentRepo.save(this.agentRepo.create({ ...data, tenantId }));
  }

  async getAvailableAgent(tenantId: string, department: string): Promise<Agent | null> {
    return this.agentRepo.findOne({
      where: { tenantId, department, status: AgentStatus.AVAILABLE },
      order: { lastCallAt: 'ASC' }, // round-robin: longest idle first
    });
  }

  async setStatus(agentId: string, status: AgentStatus) {
    await this.agentRepo.update(agentId, { status, lastCallAt: new Date() });
  }

  async getAgents(tenantId: string) {
    return this.agentRepo.find({ where: { tenantId }, order: { department: 'ASC' } });
  }

  async routeCallToAgent(tenantId: string, department: string, callerNumber: string) {
    const agent = await this.getAvailableAgent(tenantId, department);
    if (!agent) {
      this.logger.warn(`No available agent in ${department} for tenant ${tenantId}`);
      return { routed: false, message: 'No agents available — call queued' };
    }
    await this.setStatus(agent.id, AgentStatus.BUSY);
    this.logger.log(`Routed ${callerNumber} → agent ${agent.name} (ext ${agent.sipExtension})`);
    return { routed: true, agent };
  }
}