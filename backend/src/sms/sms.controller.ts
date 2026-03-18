@Post('sms/otp/send')
@UseGuards(JwtAuthGuard)
sendOtp(@Req() req, @Body('phone') phone: string) {
  return this.otpService.sendOtp(phone, req.user.tenantId);
}

@Post('sms/otp/verify')
@UseGuards(JwtAuthGuard)
verifyOtp(@Req() req, @Body() body: { phone: string; code: string }) {
  return this.otpService.verifyOtp(body.phone, body.code, req.user.tenantId);
}