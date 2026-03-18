import { Module } from '@nestjs/common';
import { AuthnestService } from './authnest.service';
import { AuthnestController } from './authnest.controller';
import { AuthnestService } from './authnest.service';

@Module({
  providers: [AuthnestService],
  controllers: [AuthnestController]
})
export class AuthnestModule {}
