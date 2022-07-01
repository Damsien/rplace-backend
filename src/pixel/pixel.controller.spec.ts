import { Test, TestingModule } from '@nestjs/testing';
import { PixelController } from './pixel.controller';

describe('PixelController', () => {
  let controller: PixelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PixelController],
    }).compile();

    controller = module.get<PixelController>(PixelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
