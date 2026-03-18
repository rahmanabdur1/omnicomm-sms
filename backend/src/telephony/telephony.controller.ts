import { Controller, Get, Post, Body, Req, Query, UseGuards } from '@nestjs/common';
import { TelephonyService } from './telephony.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class TelephonyController {
  constructor(private telephonyService: TelephonyService) {}

  @Post('calls/originate')
  originate(@Req() req, @Body() body: { to: string }) {
    return this.telephonyService.originateCall(req.user.phone, body.to, req.user.tenantId);
  }

  @Get('calls/logs')
  getLogs(@Req() req, @Query('page') page: number, @Query('limit') limit: number) {
    return this.telephonyService.getCallLogs(req.user.tenantId, page, limit);
  }

  @Post('ivr/config')
  createIvr(@Req() req, @Body() body) {
    return this.telephonyService.createIvrConfig(req.user.tenantId, body);
  }

  @Get('ivr/configs')
  getIvrConfigs(@Req() req) {
    return this.telephonyService.getIvrConfigs(req.user.tenantId);
  }

  // Add to existing TelephonyController (no JwtAuthGuard — called by Twilio/Asterisk)
@Post('telephony/ivr/inbound')
async ivrInbound(@Body() body: any) {
  const twiml = await this.voiceAiService.generateIvrResponse(
    body.SpeechResult || 'Hello', 'customer support'
  );
  return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
}

@Post('telephony/ivr/input')
async ivrInput(@Req() req, @Body() body: { Digits: string }) {
  const twiml = await this.voiceAiService.handleDtmfInput(body.Digits, 'default');
  return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
}
}