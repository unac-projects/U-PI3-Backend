import { Test, TestingModule } from '@nestjs/testing';
import { ReservasEspaciosService } from './reservas-espacios.service.js';

describe('ReservasEspaciosService', () => {
  let service: ReservasEspaciosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReservasEspaciosService],
    }).compile();

    service = module.get<ReservasEspaciosService>(ReservasEspaciosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
