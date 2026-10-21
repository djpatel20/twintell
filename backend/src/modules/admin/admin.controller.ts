import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service';
import {
  overrideSubscriptionSchema,
  createAdSchema,
  updateAdSchema,
  promoteUserSchema,
} from './admin.schema';

export async function getStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getAdminStats();
    res.status(200).json({ data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getCompaniesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;
    const search = req.query.search as string | undefined;
    const planCode = req.query.planCode as string | undefined;

    const result = await adminService.getCompaniesWithSubscriptions({
      page,
      limit,
      search,
      planCode,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function overrideSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.params.id;
    const input = overrideSubscriptionSchema.parse(req.body);

    const result = await adminService.overrideCompanySubscription(companyId, input);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function toggleVerificationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.params.id;
    const result = await adminService.toggleCompanyVerification(companyId);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getAdsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const ads = await adminService.getAdminAds({ status });
    res.status(200).json({ data: ads });
  } catch (error) {
    next(error);
  }
}

export async function createAdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createAdSchema.parse(req.body);
    const ad = await adminService.createAdminAd(input);
    res.status(201).json({ data: ad });
  } catch (error) {
    next(error);
  }
}

export async function updateAdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const adId = req.params.id;
    const input = updateAdSchema.parse(req.body);
    const updated = await adminService.updateAdminAd(adId, input);
    res.status(200).json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const adId = req.params.id;
    const result = await adminService.deleteAdminAd(adId);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function promoteUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = promoteUserSchema.parse(req.body);
    const result = await adminService.promoteUserToAdmin(input.email);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

// Moderation
export async function getModerationPostsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const search = req.query.search as string | undefined;

    const result = await adminService.getAdminPosts({ page, limit, search });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteModerationPostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = req.params.id;
    const result = await adminService.deleteAdminPost(postId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getModerationProductsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const search = req.query.search as string | undefined;

    const result = await adminService.getAdminProducts({ page, limit, search });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteModerationProductHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = req.params.id;
    const result = await adminService.deleteAdminProduct(productId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
