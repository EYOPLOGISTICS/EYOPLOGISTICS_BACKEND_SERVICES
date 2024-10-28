import {Global, Module} from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import {CategoriesController} from "./controllers/categories.controller";
import {CategoryService} from "./services/categories.service";

@Global()
@Module({
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService, CategoryService],
  exports:[ProductsService]
})
export class ProductsModule {}
