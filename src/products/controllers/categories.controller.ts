import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import {CreateCategoryDto, CreateSubCategoryDto} from "../dto/categories.dto";
import {CategoryService} from "../services/categories.service";

@Controller('/categories')
export class CategoriesController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post('vendor-categories')
    createVendorCategory(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoryService.createVendorCategory(createCategoryDto);
    }
    @Post()
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoryService.create(createCategoryDto);
    }

    @Post('/sub-categories')
    createSubcategory(@Body() createSubCategoryDto: CreateSubCategoryDto) {
        return this.categoryService.createSubCategory(createSubCategoryDto);
    }

    @Get('vendor-categories')
    getVendorCategories() {
        return this.categoryService.vendorCategories();
    }

    @Get()
    findAll() {
        return this.categoryService.findAll();
    }



    // @Patch(':id')
    // update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    //     return this.categoryService.update(+id, updateProductDto);
    // }
    //
    // @Delete(':id')
    // remove(@Param('id') id: string) {
    //     return this.categoryService.remove(id);
    // }
}
