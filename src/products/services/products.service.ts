import {Injectable} from '@nestjs/common';
import {CreateProductDto, SearchProductsDto} from '../dto/create-product.dto';
import {UpdateProductDto} from '../dto/update-product.dto';
import {Product} from "../entities/product.entity";
import {Image} from "../entities/images.entity";
import {returnErrorResponse, successResponse} from "../../utils/response";
import {Category} from "../entities/category.entity";
import {SubCategory} from "../entities/subcategory.entity";
import {useSlugify} from "../../utils";
import {Vendor} from "../../vendors/entities/vendor.entity";
import {User} from "../../users/entities/user.entity";
import {PaginationDto} from "../../decorators/pagination-decorator";
import {RatingsService} from "../../ratings/ratings.service";
import {Rating} from "../../ratings/entities/rating.entity";
import {RateProductDto} from "../../ratings/dto/create-rating.dto";

@Injectable()
export class ProductsService {
    constructor(private ratingService: RatingsService) {
    }

    async create(createProductDto: CreateProductDto, vendor: string, creator: User): Promise<Product | any> {
        const {
            name,
            description,
            selling_price,
            sub_category_slug,
            vat,
            cost_price,
            discount,
            category_slug,
            quantity,
            images
        } = createProductDto;
        const category = await Category.findOneBy({slug: category_slug})
        if (!category) returnErrorResponse('Category does not exist')
        const subCategory = await SubCategory.findOne({where: {slug: sub_category_slug}})
        if (!subCategory) returnErrorResponse('Sub Category does not exist')
        const slug = useSlugify(name)
        if (await Product.findOne({where: {slug}})) returnErrorResponse('Product name already exists')
        const product = new Product();
        product.name = name;
        product.slug = slug;
        product.description = description;
        product.vendor_id = vendor;
        product.selling_price = selling_price;
        product.cost_price = cost_price;
        product.vat = vat ?? 0;
        product.category_id = category.id;
        product.sub_category_id = subCategory.id;
        product.quantity = quantity;
        product.image_count = images.length;
        product.discount = discount ?? 0;
        await product.save();
        for (const url of images) {
            const newImage = new Image();
            newImage.product_id = product.id;
            newImage.url = url;
            await newImage.save()
        }

        product.image_url = images[0];
        await product.save();
        return product;
    }

    async products(searchProductsDto: SearchProductsDto, pagination: PaginationDto): Promise<{ products: Product[], total_rows: number }> {
        const {product_name, category, sub_category, vendor} = searchProductsDto;
        const conditions = {};
        if (product_name) conditions['name'] = product_name;
        if (category) conditions['category_id'] = category;
        if (sub_category) conditions['sub_category_id'] = sub_category;
        if (vendor) conditions['vendor_id'] = vendor;
        let select = {}
        select = {vendor: {verified: true, name: true, logo: true, id:true, location:true}}
        const [products, count] = await Product.findAndCount({
            relations: {vendor: true, images: true},
            select,
            where: conditions,
            skip: pagination.offset,
            take: pagination.limit
        })
        for(const product of products){
            product['ratings'] = await Rating.find({where: {product_id: product.id}, take: 1, order: {created_at: 'DESC'}, relations:{user:true}, select:{user:{full_name:true, profile_picture:true, id:true}}})
        }
        return {products, total_rows: count}
    }

    async viewProduct(data: string): Promise<any> {
        const product = await Product.findOne({
            where: {slug: data},
            relations: {vendor: true, images: true},
            select: {vendor: {verified: true, name: true, logo: true}}
        })
        if (!product) returnErrorResponse('product does not exist')
        product['ratings'] = await Rating.find({where: {product_id: product.id}, take: 1, order: {created_at: 'DESC'}})
        return successResponse({product})
    }

    async rateProduct(productId: string, rateProductDto: RateProductDto, user: User) {
        const {star, review} = rateProductDto;
        return await this.ratingService.create(user.id, productId, star, review);
    }

    async update(id: string, updateProductDto: UpdateProductDto) {

    }

    async remove(productId: string, vendor: string): Promise<Product | any> {
        const product = await Product.findOne({where: {id: productId}})
        if (!product) returnErrorResponse('Product does not exist')
        if (vendor != product.vendor_id) returnErrorResponse('Unauthorized')
        await product.softRemove();
        return product;
    }
}
