import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {HttpException, HttpStatus, ValidationPipe} from "@nestjs/common";
import {
    SwaggerModule,
    DocumentBuilder,
    SwaggerDocumentOptions
} from "@nestjs/swagger";
import {NestExpressApplication} from "@nestjs/platform-express";
import {join} from "path";
import {AllExceptionFilter} from "./utils/all-exception.filter";
import {useGoogleMapServices} from "./services/map";
import {NewRequest} from "./trips/entities/new-request.entity";
import {BetweenDates, useDayJs} from "./utils";
import {Between} from "typeorm";
import * as bodyParser from 'body-parser';

async function bootstrap() {
    try {
        const app = await NestFactory.create<NestExpressApplication>(AppModule, {rawBody: true,});
        app.enableCors();
        app.useStaticAssets(join(__dirname, "..", "public"), {
            prefix: "/public/"
        });

        // app.useStaticAssets(resolve('./src/public'));
        // app.setBaseViewsDir(resolve('./src/views'));
        app.setViewEngine('hbs');
        app.useGlobalPipes(new ValidationPipe());
        app.setGlobalPrefix("v1");
        app.useGlobalFilters(new AllExceptionFilter());
        const config = new DocumentBuilder()
            .setTitle("OSR Cruise")
            .setDescription("OSR Cruise API Documentation")
            .setVersion("1.0")
            .build();

        const options: SwaggerDocumentOptions = {
            operationIdFactory: (controllerKey: string, methodKey: string) =>
                controllerKey + "-" + methodKey
        };
        const document = SwaggerModule.createDocument(app, config, options);
        SwaggerModule.setup("v1/docs", app, document);
        await app.listen(process.env.PORT ?? 3000);
        await app.init()
    } catch (err) {
        console.log(err);
        throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

bootstrap();
