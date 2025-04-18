import { Module } from '@nestjs/common';
import { MeController } from './me.controller';

@Module({
  imports: [],
  controllers: [MeController],
})
export class MeModule {}
