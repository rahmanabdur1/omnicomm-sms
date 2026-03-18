import { Test, TestingModule } from '@nestjs/testing';
import { AuthnestController } from './authnest.controller';

describe('AuthnestController', () => {
  let controller: AuthnestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthnestController],
    }).compile();

    controller = module.get<AuthnestController>(AuthnestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
