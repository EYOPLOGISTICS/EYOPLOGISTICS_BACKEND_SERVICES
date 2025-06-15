import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreateCategoryDto, CreateSubCategoryDto } from '../dto/categories.dto';
import { CategoryService } from '../services/categories.service';

@Controller('/categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('vendor-categories')
  createVendorCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createVendorCategory(createCategoryDto);
  }

  @Post('vendor-categories/:id')
  editVendorCategory(
    @Param('id') id: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoryService.editVendorCategory(id, createCategoryDto);
  }

  @Delete('vendor-categories/:id')
  deleteVendorCategory(@Param('id') id: string) {
    return this.categoryService.deleteVendorCategory(id);
  }

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Post('/sub-categories')
  createSubcategory(@Body() createSubCategoryDto: CreateSubCategoryDto) {
    return this.categoryService.createSubCategory(createSubCategoryDto);
  }

  @Delete('sub-categories/:id')
  removeSubCat(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
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
  @Delete(':id')
  remove(@Param('id') id: string) {
      return this.categoryService.deleteCategory(id);
  }
}
