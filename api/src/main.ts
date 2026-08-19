import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './utils/filters/http-exception.filter';
import { ResolvePromisesInterceptor } from './utils/interceptors/serializer.interceptor';
import validationOptions from './utils/validations-options';
import { useContainer } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from './config/config.type';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import { PaginationMeta } from './utils/types/paginated-response';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bodyParser: true,
  });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );

  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const options = new DocumentBuilder()
    .setTitle(
      'Sistema de Otimização Leve de Alocação de Recursos Acadêmicos - SOLARA',
    )
    .setDescription('The SOLARA API docs.')
    .setVersion('0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options, {
    extraModels: [PaginationMeta],
  });
  SwaggerModule.setup('/api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
