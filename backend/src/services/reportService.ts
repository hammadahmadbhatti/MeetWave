import { PrismaClient, ReportReason, ReportStatus } from '@prisma/client';
import { logger } from '../config/logger';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class ReportService {
  async createReport(
    reporterId: string,
    reportedId: string,
    reason: ReportReason,
    chatSessionId?: string,
    description?: string
  ) {
    const report = await prisma.report.create({
      data: { reporterId, reportedId, chatSessionId, reason, description },
    });

    // Auto-ban: 3+ reports in 24h
    const recentCount = await prisma.report.count({
      where: {
        reportedId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (recentCount >= 3) {
      await this.banUser(reportedId, 'Auto-ban: multiple reports received', 24);
      logger.warn(`Auto-banned user ${reportedId} due to ${recentCount} reports in 24h`);
    }

    return report;
  }

  async getReports(status?: ReportStatus, page = 1, limit = 20) {
    const where = status ? { status } : {};
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reporter: { select: { id: true, username: true } },
          reported: { select: { id: true, username: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return { reports, total, page, totalPages: Math.ceil(total / limit) };
  }

  async reviewReport(reportId: string, reviewerId: string, action: ReportStatus, banDuration?: number, banReason?: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new AppError('Report not found', 404);
    if (report.status !== ReportStatus.PENDING) throw new AppError('Report already reviewed', 400);

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { status: action, reviewedAt: new Date(), reviewedBy: reviewerId },
    });

    if (action === ReportStatus.RESOLVED && banDuration) {
      await this.banUser(report.reportedId, banReason || 'Violation of terms', banDuration);
    }

    return updated;
  }

  async banUser(userId: string, reason: string, durationHours: number) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason: reason,
        banExpiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
      },
    });
    logger.info(`User ${userId} banned for ${durationHours}h: ${reason}`);
  }
}

export const reportService = new ReportService();
