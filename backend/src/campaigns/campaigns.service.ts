import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { Contact } from '../contacts/entities/contact.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectQueue('sms') private smsQueue: Queue,
  ) {}

  async createCampaign(tenantId: string, data: { name: string; message: string; scheduledAt?: Date }) {
    const campaign = this.campaignRepo.create({ ...data, tenantId, status: CampaignStatus.DRAFT });
    return this.campaignRepo.save(campaign);
  }

  async launchCampaign(campaignId: string, tenantId: string) {
    const campaign = await this.campaignRepo.findOneOrFail({ where: { id: campaignId, tenantId } });
    const contacts = await this.contactRepo.find({ where: { tenantId, isActive: true } });

    campaign.status = CampaignStatus.RUNNING;
    campaign.totalRecipients = contacts.length;
    await this.campaignRepo.save(campaign);

    // Enqueue SMS for each contact
    const jobs = contacts.map(c => ({
      name: 'send',
      data: { to: c.phone, message: campaign.message, tenantId, campaignId },
    }));
    await this.smsQueue.addBulk(jobs);

    return { campaignId, queued: contacts.length };
  }

  async updateStats(campaignId: string, success: boolean) {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) return;
    if (success) campaign.sent += 1;
    else campaign.failed += 1;

    const total = campaign.sent + campaign.failed;
    if (total >= campaign.totalRecipients) campaign.status = CampaignStatus.COMPLETED;
    await this.campaignRepo.save(campaign);
  }

  async getCampaigns(tenantId: string) {
    return this.campaignRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }
}