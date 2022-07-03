import { Test, TestingModule } from '@nestjs/testing';
import { PixelHistoryService } from './pixel-history.service';

describe('PixelHistoryService', () => {
  let service: PixelHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PixelHistoryService],
    }).compile();

    service = module.get<PixelHistoryService>(PixelHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
