import { Test, TestingModule } from '@nestjs/testing';
import { SurgicalConsentsService } from './surgical-consents.service';

describe('SurgicalConsentsService', () => {
  let service: SurgicalConsentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SurgicalConsentsService],
    }).compile();

    service = module.get<SurgicalConsentsService>(SurgicalConsentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
