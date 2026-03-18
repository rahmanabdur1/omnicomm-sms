import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get('webhook')
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return this.whatsappService.verifyWebhook(mode, token, challenge);
  }

  @Post('webhook')
  handleWebhook(@Body() body: any) {
    return this.whatsappService.handleInbound(body);
  }

  @Post('send')
  send(@Body() body: { to: string; message: string }) {
    return this.whatsappService.sendMessage(body.to, body.message);
  }
}