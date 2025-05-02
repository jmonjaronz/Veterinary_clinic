import { Test, TestingModule } from '@nestjs/testing';
import { SurgicalConsentsController } from './surgical-consents.controller';

describe('SurgicalConsentsController', () => {
  let controller: SurgicalConsentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SurgicalConsentsController],
    }).compile();

    controller = module.get<SurgicalConsentsController>(SurgicalConsentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
