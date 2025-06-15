import {Controller, Get, Post, Body, Patch, Param, Delete, Query} from '@nestjs/common';
import {VendorsService} from '../services/vendors.service';
import {CACDto, CreateVendorDto, VendorSearchDto} from '../dto/create-vendor.dto';
import {UpdateVendorDto} from '../dto/update-vendor.dto';
import {AuthUser} from "../../decorators/user.decorator";
import {User} from "../../users/entities/user.entity";
import {successResponse} from "../../utils/response";
import {GetVendor, GetVendorId} from "../../decorators/vendor.decorator";
import {GetPagination, PaginationDto} from "../../decorators/pagination-decorator";
import {CreateProductDto, SearchProductsDto} from "../../products/dto/create-product.dto";
import {Vendor} from "../entities/vendor.entity";
import {BankAccountsService} from "../../bank_accounts/bank_accounts.service";
import {VendorCategory} from "../entities/category.entity";
import {ProductsService} from "../../products/services/products.service";
import {UpdateProductDto} from "../../products/dto/update-product.dto";

@Controller('vendors')
export class VendorsController {
    constructor(private productService: ProductsService, private readonly vendorsService: VendorsService, private bankAccountService: BankAccountsService) {
    }

    @Get('/categories/collections')
    async getVendorCategories() {
        const categories = await VendorCategory.find();
        return successResponse({categories})
    }

    @Post()
    create(@AuthUser() owner: User, @Body() createVendorDto: CreateVendorDto) {
        return this.vendorsService.createVendor(owner, createVendorDto);
    }

    @Get()
    vendors(@Query() vendorSearchDto: VendorSearchDto, @AuthUser() viewer: User, @GetPagination() pagination: PaginationDto) {
        return this.vendorsService.vendorsCustomer(vendorSearchDto, viewer, pagination);
    }

    @Get('/stores')
    vendorsOwner(@AuthUser() viewer: User) {
        return this.vendorsService.vendorsOwner(viewer);
    }

    @Get('/auth')
    authLoggedInVendor(@GetVendor() vendor: Vendor) {
        return successResponse({vendor});
    }

    @Get('/reviews/:vendor_id')
    vendorReviews(@Param('vendor_id') vendorId:string, @GetPagination() pagination:PaginationDto) {
        return this.vendorsService.reviews(vendorId, pagination)
    }

    @Post('/products')
    createProduct(@AuthUser() creator: User, @Body() createProductDto: CreateProductDto, @GetVendorId() vendor: string) {
        return this.vendorsService.createProduct(createProductDto, vendor, creator);
    }

    @Patch('/products/:product_id')
    async updateProduct(@Param('product_id') productId: string, @AuthUser() creator: User, @Body() updateProductDto: UpdateProductDto, @GetVendorId() vendor: string) {
        return successResponse({product: await this.productService.update(productId, updateProductDto, vendor, creator)});
    }

    @Get('/products')
    products(@Query()searchProductDto: SearchProductsDto, @AuthUser() owner: User, @GetVendorId() vendorId: string, @GetPagination() pagination: PaginationDto) {
        return this.vendorsService.products(owner,searchProductDto, vendorId, pagination);
    }

    @Get('/products/:product_id')
    viewProduct(@Param('product_id') productId: string, @GetVendorId() vendorId: string) {
        return this.vendorsService.viewProduct(productId, vendorId);
    }

    @Get('/vendor/dashboard')
    dashboard(@GetVendorId() vendorId: string) {
        return this.vendorsService.dashboard(vendorId);
    }

    @Get('/earnings')
    earnings(@GetVendorId() vendorId: string, @GetPagination() pagination:PaginationDto) {
        return this.vendorsService.earningAndPayouts(vendorId, pagination);
    }

    @Delete('/products/:product_id')
    removeProduct(@Param('product_id') productId: string, @AuthUser() remover: User, @GetVendorId() vendor: string) {
        return this.vendorsService.removeProduct(productId, vendor, remover);
    }


    @Patch()
    updateVendor(@Body() updateVendorDto: UpdateVendorDto, @GetVendorId() vendorId: string, @AuthUser() owner: User) {
        return this.vendorsService.updateVendor(vendorId, updateVendorDto, owner);
    }

    @Delete()
    removeVendor(@GetVendorId() vendorId: string, @AuthUser() owner: User) {
        return this.vendorsService.removeVendor(vendorId, owner);
    }

    @Post('/verification/cac')
    submitCac(@GetVendor() vendor: Vendor, @AuthUser() takenBy: User, @Body() cacDto: CACDto) {
        return this.vendorsService.submitCaC(vendor, cacDto, takenBy)
    }

    @Get('/bank-account')
    async getBankAccount(@AuthUser() user: User, @GetVendorId() vendor: string) {
        return successResponse(await this.bankAccountService.findOne(user, vendor))
    }

}
