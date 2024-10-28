import {Controller, Get, Post, Body, Patch, Param, Delete, Query} from '@nestjs/common';
import {ProductsService} from '../services/products.service';
import {CreateProductDto, SearchProductsDto} from '../dto/create-product.dto';
import {UpdateProductDto} from '../dto/update-product.dto';
import {GetVendor} from "../../decorators/vendor.decorator";
import {Vendor} from "../../vendors/entities/vendor.entity";
import {AuthUser} from "../../decorators/user.decorator";
import {User} from "../../users/entities/user.entity";
import {GetPagination, PaginationDto} from "../../decorators/pagination-decorator";
import {RateProductDto} from "../../ratings/dto/create-rating.dto";

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {
    }

    // @Post()
    // create(@Body() createProductDto: CreateProductDto, @GetVendor() vendor: Vendor, @AuthUser() user: User) {
    //     return this.productsService.create(createProductDto, vendor, user);
    // }

    @Get()
    products(@Query() searchProductsDto: SearchProductsDto, @GetPagination() pagination: PaginationDto) {
        return this.productsService.products(searchProductsDto, pagination);
    }

    @Get(':product_slug')
    findOne(@Param('product_slug') slug: string) {
        return this.productsService.viewProduct(slug);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }

    @Post('/ratings/:product_id')
    rateProduct(@Param('product_id') productId: string, @AuthUser() user: User, @Body() rateProductDto: RateProductDto) {
        return this.productsService.rateProduct(productId, rateProductDto, user)
    }

}
