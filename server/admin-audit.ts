import { Request, Response, Application } from "express";
import { authenticateJWT, isAdmin } from "./auth";
import { storage } from "./storage";

// Admin middleware
const adminMiddleware = [authenticateJWT, isAdmin];

// Enhanced admin audit routes for transparency
export function setupAdminAuditRoutes(app: Application) {
  // Get all admin actions (paginated)
  app.get("/api/admin/audit/actions", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const adminActions = await storage.getAdminActions(limit);
      
      res.json({
        actions: adminActions,
        total: adminActions.length,
        message: "Admin actions retrieved successfully"
      });
    } catch (error) {
      console.error("Error fetching admin actions:", error);
      res.status(500).json({ message: "Failed to fetch admin actions" });
    }
  });

  // Get admin actions by specific admin
  app.get("/api/admin/audit/actions/by-admin/:adminId", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { adminId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const adminActions = await storage.getAdminActionsByAdmin(adminId, limit);
      
      res.json({
        actions: adminActions,
        adminId,
        total: adminActions.length,
        message: `Admin actions for admin ${adminId} retrieved successfully`
      });
    } catch (error) {
      console.error("Error fetching admin actions by admin:", error);
      res.status(500).json({ message: "Failed to fetch admin actions" });
    }
  });

  // Get admin actions for specific target user
  app.get("/api/admin/audit/actions/by-target/:targetUserId", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { targetUserId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const adminActions = await storage.getAdminActionsByTarget(targetUserId, limit);
      
      res.json({
        actions: adminActions,
        targetUserId,
        total: adminActions.length,
        message: `Admin actions for user ${targetUserId} retrieved successfully`
      });
    } catch (error) {
      console.error("Error fetching admin actions by target:", error);
      res.status(500).json({ message: "Failed to fetch admin actions" });
    }
  });

  // Get admin action statistics
  app.get("/api/admin/audit/stats", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getAdminActionStats();
      
      res.json({
        statistics: stats,
        message: "Admin action statistics retrieved successfully"
      });
    } catch (error) {
      console.error("Error fetching admin action stats:", error);
      res.status(500).json({ message: "Failed to fetch admin action statistics" });
    }
  });

  // Search admin actions by action type
  app.get("/api/admin/audit/actions/by-type/:actionType", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { actionType } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      // Get all actions and filter by type (for in-memory storage)
      const allActions = await storage.getAdminActions(1000); // Get larger set to filter
      const filteredActions = allActions
        .filter(action => action.action === actionType)
        .slice(0, limit);
      
      res.json({
        actions: filteredActions,
        actionType,
        total: filteredActions.length,
        message: `Admin actions of type ${actionType} retrieved successfully`
      });
    } catch (error) {
      console.error("Error fetching admin actions by type:", error);
      res.status(500).json({ message: "Failed to fetch admin actions" });
    }
  });

  // Get admin actions within date range
  app.get("/api/admin/audit/actions/by-date", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const limit = parseInt(req.query.limit as string) || 100;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          message: "Both startDate and endDate are required (YYYY-MM-DD format)" 
        });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999); // Include entire end date
      
      // Get all actions and filter by date (for in-memory storage)
      const allActions = await storage.getAdminActions(1000);
      const filteredActions = allActions
        .filter(action => {
          const actionDate = new Date(action.createdAt);
          return actionDate >= start && actionDate <= end;
        })
        .slice(0, limit);
      
      res.json({
        actions: filteredActions,
        dateRange: { startDate, endDate },
        total: filteredActions.length,
        message: `Admin actions within date range retrieved successfully`
      });
    } catch (error) {
      console.error("Error fetching admin actions by date:", error);
      res.status(500).json({ message: "Failed to fetch admin actions" });
    }
  });

  // Export admin audit data (for transparency reports)
  app.get("/api/admin/audit/export", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const format = req.query.format as string || 'json';
      const limit = parseInt(req.query.limit as string) || 1000;
      
      const adminActions = await storage.getAdminActions(limit);
      const stats = await storage.getAdminActionStats();
      
      const auditReport = {
        exportDate: new Date().toISOString(),
        exportedBy: (req.user as any)?.username || 'Unknown',
        summary: {
          totalActions: stats.totalActions,
          actionsByType: stats.actionsByType,
          actionsByAdmin: stats.actionsByAdmin,
        },
        actions: adminActions,
        metadata: {
          version: "1.0",
          description: "Shadow Casino Admin Audit Report",
          timeRange: adminActions.length > 0 ? {
            earliest: adminActions[adminActions.length - 1]?.createdAt,
            latest: adminActions[0]?.createdAt
          } : null
        }
      };
      
      if (format === 'csv') {
        // Convert to CSV format for Excel/Sheets compatibility
        const csvHeaders = ['ID', 'Admin ID', 'Admin Username', 'Action', 'Target User ID', 'Created At', 'Details'];
        const csvRows = adminActions.map(action => [
          action.id,
          action.adminId,
          action.adminUsername || 'Unknown',
          action.action,
          action.targetUserId || '',
          new Date(action.createdAt).toISOString(),
          JSON.stringify(action.details || {})
        ]);
        
        const csvContent = [csvHeaders, ...csvRows]
          .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
          .join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="admin-audit-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="admin-audit-${new Date().toISOString().split('T')[0]}.json"`);
        res.json(auditReport);
      }
    } catch (error) {
      console.error("Error exporting admin audit data:", error);
      res.status(500).json({ message: "Failed to export audit data" });
    }
  });
}