import { Test, TestingModule } from '@nestjs/testing';
import { PatternShapeService } from './pattern-shape.service';

describe('PatternShapeService', () => {
  let service: PatternShapeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatternShapeService],
    }).compile();

    service = module.get<PatternShapeService>(PatternShapeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
