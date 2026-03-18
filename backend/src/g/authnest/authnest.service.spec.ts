import { Test, TestingModule } from '@nestjs/testing';
import { AuthnestService } from './authnest.service';

describe('AuthnestService', () => {
  let service: AuthnestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthnestService],
    }).compile();

    service = module.get<AuthnestService>(AuthnestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
