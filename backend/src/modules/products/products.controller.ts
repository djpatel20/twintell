import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productsQuerySchema,
} from './products.schema';
import { AppError } from '../../middleware/error-handler';

export class ProductsController {
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = productsQuerySchema.parse(req.query);
      const result = await productsService.getProducts(validatedQuery);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = productIdParamSchema.parse(req.params);
      const result = await productsService.getProductById(id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'COMPANY' || !req.user.companyId) {
        throw new AppError('Forbidden: Only registered company accounts can list products.', 403, 'FORBIDDEN');
      }

      const validatedData = createProductSchema.parse(req.body);
      const result = await productsService.createProduct(req.user.companyId, validatedData);

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'COMPANY' || !req.user.companyId) {
        throw new AppError('Forbidden: Only registered company accounts can edit products.', 403, 'FORBIDDEN');
      }

      const { id } = productIdParamSchema.parse(req.params);
      const validatedData = updateProductSchema.parse(req.body);
      const result = await productsService.updateProduct(id, req.user.companyId, validatedData);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'COMPANY' || !req.user.companyId) {
        throw new AppError('Forbidden: Only registered company accounts can delete products.', 403, 'FORBIDDEN');
      }

      const { id } = productIdParamSchema.parse(req.params);
      const result = await productsService.deleteProduct(id, req.user.companyId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
