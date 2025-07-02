import { Express, Request, Response } from 'express';
import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists, getNotionDatabases, findDatabaseByTitle } from './notion';
import { authenticateJWT, isAdmin } from './auth';

export function setupNotionRoutes(app: Express) {
  // Check status of Notion secrets
  app.get("/api/admin/notion/status", authenticateJWT, isAdmin, async (_req: Request, res: Response) => {
    try {
      // Check if environment variables are set
      const hasIntegrationSecret = !!process.env.NOTION_INTEGRATION_SECRET;
      const hasPageUrl = !!process.env.NOTION_PAGE_URL;
      
      res.json({
        hasIntegrationSecret,
        hasPageUrl,
        pageId: hasPageUrl ? NOTION_PAGE_ID : null
      });
    } catch (error) {
      console.error("Error checking Notion status:", error);
      res.status(500).json({ error: "Failed to check Notion integration status" });
    }
  });

  // List all Notion databases
  app.get("/api/admin/notion/databases", authenticateJWT, isAdmin, async (_req: Request, res: Response) => {
    try {
      const databases = await getNotionDatabases();
      res.json({ databases });
    } catch (error) {
      console.error("Error listing Notion databases:", error);
      res.status(500).json({ error: "Failed to list Notion databases" });
    }
  });

  // Setup Notion databases
  app.post("/api/admin/notion/setup", authenticateJWT, isAdmin, async (_req: Request, res: Response) => {
    try {
      // Create or update necessary databases
      const promotionsDb = await createDatabaseIfNotExists("Promotions", {
        Title: {
          title: {}
        },
        Description: {
          rich_text: {}
        },
        StartDate: {
          date: {}
        },
        EndDate: {
          date: {}
        },
        RewardType: {
          select: {
            options: [
              { name: "Free Spins", color: "blue" },
              { name: "Bonus", color: "green" },
              { name: "Cashback", color: "orange" },
              { name: "Deposit Bonus", color: "purple" }
            ]
          }
        },
        Amount: {
          number: {}
        },
        Active: {
          checkbox: {}
        }
      });

      const gameConfigurationsDb = await createDatabaseIfNotExists("Game Configurations", {
        Title: {
          title: {}
        },
        GameType: {
          select: {
            options: [
              { name: "Slots", color: "blue" },
              { name: "Dice", color: "green" },
              { name: "Plinko", color: "orange" },
              { name: "Global", color: "gray" }
            ]
          }
        },
        Parameter: {
          select: {
            options: [
              { name: "Win Chance", color: "blue" },
              { name: "Max Multiplier", color: "red" },
              { name: "House Edge", color: "green" },
              { name: "Min Bet", color: "purple" },
              { name: "Max Bet", color: "yellow" }
            ]
          }
        },
        Value: {
          number: {}
        },
        Enabled: {
          checkbox: {}
        },
        UpdatedAt: {
          date: {}
        }
      });

      const faqsDb = await createDatabaseIfNotExists("FAQs", {
        Title: {
          title: {}
        },
        Question: {
          rich_text: {}
        },
        Answer: {
          rich_text: {}
        },
        Category: {
          select: {
            options: [
              { name: "General", color: "gray" },
              { name: "Account", color: "blue" },
              { name: "Payments", color: "green" },
              { name: "Games", color: "orange" },
              { name: "Technical", color: "red" }
            ]
          }
        },
        Priority: {
          number: {}
        }
      });

      // Return information about the created/updated databases
      const databases = [
        {
          id: promotionsDb.id,
          title: "Promotions",
          propertyCount: Object.keys(promotionsDb.properties).length
        },
        {
          id: gameConfigurationsDb.id,
          title: "Game Configurations",
          propertyCount: Object.keys(gameConfigurationsDb.properties).length
        },
        {
          id: faqsDb.id,
          title: "FAQs",
          propertyCount: Object.keys(faqsDb.properties).length
        }
      ];

      res.json({
        success: true,
        message: "Notion databases successfully set up",
        databases
      });
    } catch (error) {
      console.error("Error setting up Notion databases:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to set up Notion databases",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Public API endpoints to get data from Notion
  
  // Get all active promotions
  app.get("/api/promotions", async (_req: Request, res: Response) => {
    try {
      const promotionsDb = await findDatabaseByTitle("Promotions");
      
      if (!promotionsDb) {
        return res.status(404).json({ error: "Promotions database not found" });
      }
      
      const response = await notion.databases.query({
        database_id: promotionsDb.id,
        filter: {
          property: "Active",
          checkbox: {
            equals: true
          }
        },
        sorts: [
          {
            property: "StartDate",
            direction: "descending"
          }
        ]
      });
      
      // Transform the data to a simpler format for the frontend
      const promotions = response.results.map((page: any) => {
        const properties = page.properties;
        
        return {
          id: page.id,
          title: properties.Title?.title?.[0]?.plain_text || "Untitled Promotion",
          description: properties.Description?.rich_text?.[0]?.plain_text || "",
          startDate: properties.StartDate?.date?.start || null,
          endDate: properties.EndDate?.date?.start || null,
          rewardType: properties.RewardType?.select?.name || "Bonus",
          amount: properties.Amount?.number || 0,
          active: properties.Active?.checkbox || false
        };
      });
      
      res.json({ promotions });
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ error: "Failed to fetch promotions" });
    }
  });

  // Get FAQs
  app.get("/api/faqs", async (_req: Request, res: Response) => {
    try {
      const faqsDb = await findDatabaseByTitle("FAQs");
      
      if (!faqsDb) {
        return res.status(404).json({ error: "FAQs database not found" });
      }
      
      const response = await notion.databases.query({
        database_id: faqsDb.id,
        sorts: [
          {
            property: "Priority",
            direction: "ascending"
          }
        ]
      });
      
      // Transform the data
      const faqs = response.results.map((page: any) => {
        const properties = page.properties;
        
        return {
          id: page.id,
          title: properties.Title?.title?.[0]?.plain_text || "Untitled FAQ",
          question: properties.Question?.rich_text?.[0]?.plain_text || "",
          answer: properties.Answer?.rich_text?.[0]?.plain_text || "",
          category: properties.Category?.select?.name || "General",
          priority: properties.Priority?.number || 0
        };
      });
      
      res.json({ faqs });
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  // Get game configurations
  app.get("/api/game-configurations", async (_req: Request, res: Response) => {
    try {
      const gameConfigurationsDb = await findDatabaseByTitle("Game Configurations");
      
      if (!gameConfigurationsDb) {
        return res.status(404).json({ error: "Game Configurations database not found" });
      }
      
      const response = await notion.databases.query({
        database_id: gameConfigurationsDb.id,
        filter: {
          property: "Enabled",
          checkbox: {
            equals: true
          }
        }
      });
      
      // Transform and organize by game type
      const configurations: Record<string, any> = {};
      
      response.results.forEach((page: any) => {
        const properties = page.properties;
        const gameType = properties.GameType?.select?.name || "Global";
        const parameter = properties.Parameter?.select?.name || "";
        const value = properties.Value?.number ?? 0;
        
        if (!configurations[gameType]) {
          configurations[gameType] = {};
        }
        
        // Convert parameter to camelCase
        const paramKey = parameter
          .replace(/\s(.)/g, (_: string, $1: string) => $1.toLowerCase())
          .replace(/\s/g, '')
          .replace(/^(.)/, (_: string, $1: string) => $1.toLowerCase());
        
        configurations[gameType][paramKey] = value;
      });
      
      res.json({ configurations });
    } catch (error) {
      console.error("Error fetching game configurations:", error);
      res.status(500).json({ error: "Failed to fetch game configurations" });
    }
  });
}