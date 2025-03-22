import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PdfModule } from './pdf/pdf.module';
import { PdfXlsxModule } from './pdf-xlsx/pdf-xlsx.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PdfModule,
    PdfXlsxModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}