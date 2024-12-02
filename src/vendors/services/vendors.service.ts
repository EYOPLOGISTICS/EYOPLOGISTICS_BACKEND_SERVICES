import {Injectable} from '@nestjs/common';
import {CACDto, CreateVendorDto, VendorSearchDto} from '../dto/create-vendor.dto';
import {UpdateVendorDto} from '../dto/update-vendor.dto';
import {useGoogleMapServices} from "../../services/map";
import {Vendor} from "../entities/vendor.entity";
import {returnErrorResponse, successResponse} from "../../utils/response";
import {User} from "../../users/entities/user.entity";
import {Not} from "typeorm";
import {VendorCategory} from "../entities/category.entity";
import {CreateProductDto, SearchProductsDto} from "../../products/dto/create-product.dto";
import {PaginationDto} from "../../decorators/pagination-decorator";
import {ProductsService} from "../../products/services/products.service";
import {Product} from "../../products/entities/product.entity";
import {NotificationsService} from "../../notifications/notifications.service";
import {Rating} from "../../ratings/entities/rating.entity";
import {Order} from "../../orders/entities/order.entity";
import {ORDER_STATUS} from "../../enums/type.enum";

@Injectable()
export class VendorsService {
    constructor(private productService: ProductsService, private notificationService: NotificationsService) {
    }

    async createVendor(owner: User, createVendorDto: CreateVendorDto) {
        const {name, email, phone_number, logo, location, description, vendor_category_slug} = createVendorDto;
        // vendor category
        const vendorCategory = await VendorCategory.findOne({where: {slug: vendor_category_slug}})
        if (!vendorCategory) returnErrorResponse('Vendor category does not exist');
        // ensure a different vendor does not have this email
        const anotherVendorWithEmailExists = await Vendor.findOne({
            where: {email, owner_id: Not(owner.id)},
            select: {id: true, phone_number: true, owner_id: true}
        })
        if (anotherVendorWithEmailExists) returnErrorResponse('A vendor with that email already exists')
        // ensure a different vendor does not have this phone number
        const anotherVendorWithPhoneExists = await Vendor.findOne({
            where: {phone_number, owner_id: Not(owner.id)},
            select: {id: true, phone_number: true, owner_id: true}
        })
        if (anotherVendorWithPhoneExists) returnErrorResponse('A vendor with that email already exists')

        const anotherVendorWithNameExists = await Vendor.findOne({
            where: {name},
            select: {id: true, name: true, owner_id: true}
        })
        if (anotherVendorWithNameExists) returnErrorResponse('A vendor with that name already exists')

        const mapServices = useGoogleMapServices();
        const {
            state,
            address,
            country
        } = await mapServices.getStateFromLatAndLng(mapServices.formatLatAndLng(location.lat, location.lng))
        const newVendor = new Vendor();
        newVendor.name = name;
        newVendor.email = email;
        newVendor.vendor_category_id = vendorCategory.id;
        newVendor.country = country;
        newVendor.city = state;
        newVendor.address = address;
        newVendor.location = location;
        newVendor.phone_number = phone_number;
        newVendor.logo = logo;
        newVendor.description = description;
        newVendor.location = location;
        newVendor.owner_id = owner.id;
        await newVendor.save()
        return successResponse({vendor: newVendor, message: 'vendor created successfully'})
    }

    async createProduct(createProductDto: CreateProductDto, vendor: string, creator: User) {
        const product = await this.productService.create(createProductDto, vendor, creator)
        await this.notificationService.createActivity(`${creator.full_name} created a product(${product.name})`, creator.id, vendor)
        return successResponse('product created successfully')
    }

    async vendorsCustomer(vendorSearchDto: VendorSearchDto, viewer: User, pagination: PaginationDto) {
        const {category_id, location, location_address, name} = vendorSearchDto;
        const conditions = {};
        if (vendorSearchDto.category_id) conditions['vendor_category_id'] = category_id;
        let select = {}
        select = {
            name: true,
            id: true,
            owner_id: true,
            logo: true,
            vendor_category_id: true,
            location: true,
            verified: true,
            phone_number: true,
            city: true,
            country: true,
            total_rating:true,
            rating_count:true
        }

        const [vendors, count] = await Vendor.findAndCount({
            where: conditions,
            take: pagination.limit,
            skip: pagination.offset,
            select
        })
        for (const vendor of vendors){
          vendor['ratings'] =  await Rating.find({where: {vendor_id: vendor.id}, take: 1, order: {created_at: 'DESC'}, relations:{user:true}, select:{user:{full_name:true, profile_picture:true, id:true}}})
        }
        return successResponse({vendors, total_rows:count})
    }

    async vendorsOwner(viewer: User) {
        const vendors = await Vendor.find({where: {owner_id: viewer.id}})
        return successResponse({vendors})
    }

    async products(searchProductDto: SearchProductsDto, vendorId: string, pagination: PaginationDto) {
        const {
            products,
            total_rows
        } = await this.productService.products({vendor:vendorId, filter:searchProductDto.filter, start_date:searchProductDto.start_date, sub_category:searchProductDto.sub_category, category:searchProductDto.category, end_date:searchProductDto.end_date, limit:pagination.limit, offset:pagination.offset}, pagination)
        return successResponse({products, total_rows: total_rows})
    }

    async viewProduct(productId: string, vendorId: string) {
        const product = await Product.findOne({where: {id: productId, vendor_id: vendorId}})
        if (!product) returnErrorResponse('product does not exist')
        return successResponse({product})
    }

    async dashboard(vendorId:string){
        const totalSales = await Order.sum('order_total', {status:ORDER_STATUS.COMPLETED, vendor_id:vendorId})
        const totalProducts = await Product.count({where:{vendor_id:vendorId}})
        const pendingOrders = await Order.count({where:{vendor_id:vendorId, status:ORDER_STATUS.ONGOING}})
        return successResponse({total_sales:totalSales, total_product:totalProducts, pending_orders:pendingOrders})
    }

    async removeProduct(productId: string, vendor: string, remover: User) {
        const product = await this.productService.remove(productId, vendor)
        await this.notificationService.createActivity(`${remover.full_name} deleted a product(${product.name})`, remover.id, vendor)
        return successResponse('product deleted successfully')
    }

    async updateVendor(vendorId: string, updateVendorDto: UpdateVendorDto, owner: User) {
        const {name, email, phone_number, logo, location, description, vendor_category_slug} = updateVendorDto;
        // vendor category
        const vendorCategory = await VendorCategory.findOne({where: {slug: vendor_category_slug}})
        if (!vendorCategory) returnErrorResponse('Vendor category does not exist');
        // ensure a different vendor does not have this email
        const anotherVendorWithEmailExists = await Vendor.findOne({
            where: {email, owner_id: Not(owner.id)},
            select: {id: true, phone_number: true, owner_id: true}
        })
        if (anotherVendorWithEmailExists) returnErrorResponse('A vendor with that email already exists')
        // ensure a different vendor does not have this phone number
        const anotherVendorWithPhoneExists = await Vendor.findOne({
            where: {phone_number, owner_id: Not(owner.id)},
            select: {id: true, phone_number: true, owner_id: true}
        })
        if (anotherVendorWithPhoneExists) returnErrorResponse('A vendor with that email already exists')
        const mapServices = useGoogleMapServices();
        const mapResponse = await mapServices.getStateFromLatAndLng(mapServices.formatLatAndLng(location.lat, location.lng))

        const vendor = await Vendor.findOne({where: {id: vendorId}});
        if (vendor) returnErrorResponse('Vendor does not exist')
        vendor.name = name;
        vendor.email = email;
        vendor.logo = logo;
        vendor.description = description;
        vendor.location = location;
        vendor.owner_id = owner.id;
        await vendor.save()
        this.notificationService.createActivity(`${owner.full_name} updated vendor profile`, owner.id, vendorId)
        return successResponse({vendor: vendor})
    }

    async removeVendor(vendorId: string, owner: User) {
        const vendor = await Vendor.findOne({where: {id: vendorId, owner_id: owner.id}})
        if (!vendor) returnErrorResponse('Vendor does not exists')
        await vendor.softRemove();
        return successResponse('vendor deleted successfully')
    }

    async submitCaC(vendor: Vendor, cacDto: CACDto, takenBy: User) {
        vendor.cac = cacDto.cac_number;
        await vendor.save();
        this.notificationService.createActivity(`${takenBy.full_name} submitted vendor cac number for verification`, takenBy.id, vendor.id)
        return successResponse('submitted successfully')
    }
}
