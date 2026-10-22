import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';

/** MetricsModule - exposes the process metrics (see metrics.ts) to Prometheus */
@Module({ controllers: [MetricsController] })
export class MetricsModule {}
