import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    // Create tenant (workspace) for new registration
    const tenant = this.tenantRepo.create({
      name: dto.companyName,
      slug: dto.companyName.toLowerCase().replace(/\s+/g, '-'),
    });
    await this.tenantRepo.save(tenant);

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
      tenantId: tenant.id,
      role: 'admin' as any,
    });
    await this.userRepo.save(user);

    return this.generateTokens(user);
  }

  async refreshToken(token: string) {
  const record = await this.refreshTokenRepo.findOne({
    where: { token, isRevoked: false },
  });
  if (!record || record.expiresAt < new Date()) {
    throw new UnauthorizedException('Refresh token expired or invalid');
  }

  const user = await this.userRepo.findOne({ where: { id: record.userId } });
  if (!user) throw new UnauthorizedException('User not found');

  // Revoke old token, issue new pair
  await this.refreshTokenRepo.update(record.id, { isRevoked: true });
  return this.generateTokens(user);
}

async logout(token: string) {
  await this.refreshTokenRepo.update({ token }, { isRevoked: true });
  return { message: 'Logged out successfully' };
}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user);
  }

private async generateTokens(user: User) {
  const payload = {
    sub: user.id, email: user.email,
    tenantId: user.tenantId, role: user.role,
  };
  const accessToken  = this.jwtService.sign(payload, { expiresIn: '15m' });
  const refreshValue = require('crypto').randomBytes(64).toString('hex');

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  await this.refreshTokenRepo.save(
    this.refreshTokenRepo.create({
      userId: user.id, token: refreshValue, expiresAt: expiry,
    }),
  );

  return {
    accessToken,
    refreshToken: refreshValue,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}
}