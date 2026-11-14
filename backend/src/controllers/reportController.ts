import { Response, NextFunction } from 'express';
import { reportService } from '../services/reportService';
import { reportSchema, reviewReportSchema } from '../utils/validators';
import { AuthRequest } from '../types';

export const createReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = reportSchema.parse(req.body);
    const report = await reportService.createReport(
      req.user!.id, data.reportedId, data.reason as any, data.chatSessionId, data.description
    );
    res.status(201).json({ status: 'success', data: { report } });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as any;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await reportService.getReports(status, page, limit);
    res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const reviewReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const data = reviewReportSchema.parse(req.body);
    const report = await reportService.reviewReport(
      reportId, req.user!.id, data.action as any, data.banDuration, data.banReason
    );
    res.json({ status: 'success', data: { report } });
  } catch (error) {
    next(error);
  }
};
