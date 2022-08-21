import { Test, TestingModule } from '@nestjs/testing';
import { PatternShapeController } from './pattern-shape.controller';

describe('PatternShapeController', () => {
  let controller: PatternShapeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatternShapeController],
    }).compile();

    controller = module.get<PatternShapeController>(PatternShapeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
