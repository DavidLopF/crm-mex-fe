export { getProducts, getStadistics, getProductById, getCategories, createProduct } from './products.service';
export type { 
  ProductFiltersDto, 
  PaginatedProductsDto, 
  ApiProduct, 
  ProductStatistics,
  ApiProductDetail,
  ApiVariant,
  ApiWarehouse,
  CategoryDto,
  CreateProductDto,
  CreateProductVariantDto,
} from './products.types';
export { mapApiProductToProducto } from './products.types';
