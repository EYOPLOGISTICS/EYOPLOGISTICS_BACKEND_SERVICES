import {Injectable} from '@nestjs/common';
import {CreateProductDto} from '../dto/create-product.dto';
import {UpdateProductDto} from '../dto/update-product.dto';
import {CreateCategoryDto, CreateSubCategoryDto, CreateVendorCategoryDto} from "../dto/categories.dto";
import {Category} from "../entities/category.entity";
import {useSlugify} from "../../utils";
import {returnErrorResponse, successResponse} from "../../utils/response";
import {SubCategory} from "../entities/subcategory.entity";
import {VendorCategory} from "../../vendors/entities/category.entity";

@Injectable()
export class CategoryService {
    async createVendorCategory(createVendorCategoryDto: CreateVendorCategoryDto) {
        const {name, image} = createVendorCategoryDto;
        const slug = useSlugify(name)
        if (await VendorCategory.findOne({where: {slug}})) returnErrorResponse('Category already exists')
        const vendorCategory = new VendorCategory();
        vendorCategory.name = name;
        vendorCategory.image = image;
        vendorCategory.slug = slug;
        await vendorCategory.save();
        return successResponse({vendor_category:vendorCategory, message: 'vendor category created successfully'})
    }

    async editVendorCategory(id:string, createVendorCategoryDto: CreateVendorCategoryDto) {
        const {name, image} = createVendorCategoryDto;
        const slug = useSlugify(name)
        const vendorCategory = await VendorCategory.findOne({where:{id}});
        if (!vendorCategory) returnErrorResponse('vendor category does exists')
        vendorCategory.name = name;
        vendorCategory.image = image;
        vendorCategory.slug = slug;
        await vendorCategory.save();
        return successResponse({vendor_category:vendorCategory, message: 'vendor category updated successfully'})
    }

    async deleteVendorCategory(id:string) {
        const vendorCategory = await VendorCategory.findOne({where:{id}});
        if (!vendorCategory) returnErrorResponse('vendor category does exists')
        await vendorCategory.softRemove()
        return successResponse("deleted successfully")
    }
    async create(createCategoryDto: CreateCategoryDto) {
        const {name, image} = createCategoryDto;
        const slug = useSlugify(name)
        if (await Category.findOne({where: {slug}})) returnErrorResponse('Category already exists')
        const category = new Category();
        category.name = name;
        category.image = image;
        category.slug = slug;
        await category.save();
        return successResponse({category, message: 'category created successfully'})
    }
    async createSubCategory(createSubCategoryDto: CreateSubCategoryDto) {
        const {name, image, category_id} = createSubCategoryDto;
        const slug = useSlugify(name)
        if (await SubCategory.findOne({where: {slug}})) returnErrorResponse('sub category already exists')
        const subCategory = new SubCategory();
        subCategory.name = name;
        subCategory.image = image;
        subCategory.slug = slug;
        subCategory.category_id = category_id;
        await subCategory.save();
        return successResponse({sub_category: subCategory, message: 'sub category created successfully'})
    }

    async vendorCategories() {
        const vendorCategories = await VendorCategory.find({order: {name: 'ASC'}});
        return successResponse({vendor_categories: vendorCategories})
    }
    async findAll() {
        const categories = await Category.find({relations: {sub_categories: true}, order: {name: 'DESC'}});
        return successResponse({categories: categories})
    }

    async deleteCategory(id:string) {
        const category = await Category.findOne({where: {id}});
        if (!category) returnErrorResponse('category does not exists')
        await category.softRemove()
        return successResponse("category deleted successfully")
    }

    async deleteSubCategory(id:string) {
        const category = await SubCategory.findOne({where: {id}});
        if (!category) returnErrorResponse('category does not exists')
        await category.softRemove()
        return successResponse("sub category deleted successfully")
    }

}
