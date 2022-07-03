import { Test, TestingModule } from '@nestjs/testing';
import { UserPixelHistoryService } from './user-pixel-history.service';

describe('UserPixelHistoryService', () => {
  let service: UserPixelHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPixelHistoryService],
    }).compile();

    service = module.get<UserPixelHistoryService>(UserPixelHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
