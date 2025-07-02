import { Client } from "@notionhq/client";

// Initialize Notion client
export const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET,
});

// Extract the page ID from the Notion page URL
export function extractPageIdFromUrl(pageUrl: string): string {
  // Handle URLs in different formats
  // Format 1: https://www.notion.so/{workspace}/{page-id}
  // Format 2: https://www.notion.so/{page-id}
  // Format 3: https://www.notion.so/{page-id}?{query-params}
  try {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
      return match[1];
    }
    
    throw new Error("Invalid Notion page URL format");
  } catch (error) {
    console.error("Error extracting page ID:", error);
    throw new Error("Failed to extract page ID from URL");
  }
}

// Get the page ID from environment variable or use a default for development
let pageIdToUse: string;
try {
  if (process.env.NOTION_PAGE_URL) {
    pageIdToUse = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);
    console.log(`Using Notion page ID: ${pageIdToUse}`);
  } else if (process.env.NODE_ENV === 'development') {
    pageIdToUse = "placeholder_page_id_for_development";
    console.log("Using placeholder page ID for development environment");
  } else {
    pageIdToUse = "default_page_id";
    console.warn("No Notion page URL provided, using default page ID");
  }
} catch (error) {
  pageIdToUse = "fallback_page_id";
  console.warn("Failed to parse Notion page ID, using fallback ID");
}

export const NOTION_PAGE_ID = pageIdToUse;

/**
 * Lists all child databases contained within NOTION_PAGE_ID
 * @returns {Promise<Array<any>>} - Array of database objects with id and title
 */
export async function getNotionDatabases() {
  // Array to store the child databases
  const childDatabases = [];

  try {
    // Query all child blocks in the specified page
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const response = await notion.blocks.children.list({
        block_id: NOTION_PAGE_ID,
        start_cursor: startCursor,
      });

      // Process the results
      for (const block of response.results) {
        // Check if the block is a child database
        if ('type' in block && block.type === "child_database") {
          const databaseId = block.id;

          // Retrieve the database title
          try {
            const databaseInfo = await notion.databases.retrieve({
              database_id: databaseId,
            });

            // Add the database to our list
            childDatabases.push(databaseInfo);
          } catch (error) {
            console.error(`Error retrieving database ${databaseId}:`, error);
          }
        }
      }

      // Check if there are more results to fetch
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    return childDatabases;
  } catch (error) {
    console.error("Error listing child databases:", error);
    throw error;
  }
}

// Find get a Notion database with the matching title
export async function findDatabaseByTitle(title: string) {
  const databases = await getNotionDatabases();

  for (const db of databases) {
    // Handle different formats of the title property in Notion API responses
    const dbTitle = getNotionDatabaseTitle(db);
    if (dbTitle.toLowerCase() === title.toLowerCase()) {
      return db;
    }
  }

  return null;
}

// Extract the title from a Notion database object (handles different API response formats)
function getNotionDatabaseTitle(database: any): string {
  if (!database) return "";
  
  // Handle different formats of title in the Notion API
  if (database.title && Array.isArray(database.title)) {
    // Format 1: title is an array of rich text objects
    return database.title[0]?.plain_text || "";
  } else if (database.title && typeof database.title === 'object') {
    // Format 2: title is a property object
    return database.title.title?.[0]?.plain_text || "";
  } else if (database.properties && database.properties.title) {
    // Format 3: title is in properties
    return database.properties.title.title?.[0]?.plain_text || "";
  } else if (database.properties && database.properties.Title) {
    // Format 4: Title (capital T) is in properties
    return database.properties.Title.title?.[0]?.plain_text || "";
  } else if (database.properties && database.properties.Name) {
    // Format 5: Name is in properties
    return database.properties.Name.title?.[0]?.plain_text || "";
  } else if (database.properties && database.properties.name) {
    // Format 6: name (lowercase) is in properties
    return database.properties.name.title?.[0]?.plain_text || "";
  }
  
  // If no title can be found
  return "";
}

// Create a new database if one with a matching title does not exist
export async function createDatabaseIfNotExists(title: string, properties: any) {
  try {
    const existingDb = await findDatabaseByTitle(title);
    if (existingDb) {
      console.log(`Database "${title}" already exists with ID: ${existingDb.id}`);
      return existingDb;
    }
    
    console.log(`Creating new database "${title}"...`);
    return await notion.databases.create({
      parent: {
        type: "page_id",
        page_id: NOTION_PAGE_ID
      },
      title: [
        {
          type: "text",
          text: {
            content: title
          }
        }
      ],
      properties
    });
  } catch (error) {
    console.error(`Error creating database "${title}":`, error);
    throw error;
  }
}

// Create a new page in a Notion database
export async function createNotionPage(databaseId: string, properties: any) {
  try {
    return await notion.pages.create({
      parent: {
        database_id: databaseId
      },
      properties
    });
  } catch (error) {
    console.error("Error creating Notion page:", error);
    throw error;
  }
}

// Helper function to get promotions (used in client app)
export async function getPromotions() {
  try {
    const promotionsDb = await findDatabaseByTitle("Promotions");
    if (!promotionsDb) {
      throw new Error("Promotions database not found");
    }
    
    const response = await notion.databases.query({
      database_id: promotionsDb.id,
      filter: {
        property: "Active",
        checkbox: {
          equals: true
        }
      }
    });
    
    return response.results.map((page: any) => {
      const properties = page.properties;
      
      return {
        id: page.id,
        title: properties.Title?.title?.[0]?.plain_text || "Untitled Promotion",
        description: properties.Description?.rich_text?.[0]?.plain_text || "",
        startDate: properties.StartDate?.date?.start || null,
        endDate: properties.EndDate?.date?.start || null,
        rewardType: properties.RewardType?.select?.name || "Bonus",
        amount: properties.Amount?.number || 0
      };
    });
  } catch (error) {
    console.error("Error fetching promotions:", error);
    throw error;
  }
}

// Helper function to get game configurations
export async function getGameConfigurations() {
  try {
    const gameConfigDb = await findDatabaseByTitle("Game Configurations");
    if (!gameConfigDb) {
      throw new Error("Game Configurations database not found");
    }
    
    const response = await notion.databases.query({
      database_id: gameConfigDb.id,
      filter: {
        property: "Enabled",
        checkbox: {
          equals: true
        }
      }
    });
    
    // Group configurations by game type
    const configsByGame: Record<string, any> = {};
    
    response.results.forEach((page: any) => {
      const properties = page.properties;
      const gameType = properties.GameType?.select?.name || "Global";
      const parameter = properties.Parameter?.select?.name || "";
      const value = properties.Value?.number ?? 0;
      
      if (!configsByGame[gameType]) {
        configsByGame[gameType] = {};
      }
      
      // Convert parameter to camelCase
      const paramKey = parameter
        .replace(/\s(.)/g, (_: string, $1: string) => $1.toLowerCase())
        .replace(/\s/g, '')
        .replace(/^(.)/, (_: string, $1: string) => $1.toLowerCase());
      
      configsByGame[gameType][paramKey] = value;
    });
    
    return configsByGame;
  } catch (error) {
    console.error("Error fetching game configurations:", error);
    throw error;
  }
}

// Helper function to get loyalty tiers
export async function getLoyaltyTiers() {
  try {
    const loyaltyDb = await findDatabaseByTitle("Loyalty Tiers");
    if (!loyaltyDb) {
      // Return default tiers if database doesn't exist yet
      return [
        { name: "Bronze", points: 0, cashbackRate: 0.01 },
        { name: "Silver", points: 100, cashbackRate: 0.02 },
        { name: "Gold", points: 500, cashbackRate: 0.03 },
        { name: "Platinum", points: 1000, cashbackRate: 0.05 },
        { name: "Diamond", points: 5000, cashbackRate: 0.07 }
      ];
    }
    
    const response = await notion.databases.query({
      database_id: loyaltyDb.id,
      sorts: [
        {
          property: "Points",
          direction: "ascending"
        }
      ]
    });
    
    return response.results.map((page: any) => {
      const properties = page.properties;
      
      return {
        name: properties.Name?.title?.[0]?.plain_text || "Unknown Tier",
        points: properties.Points?.number || 0,
        cashbackRate: properties.CashbackRate?.number || 0,
        color: properties.Color?.select?.name || "gray"
      };
    });
  } catch (error) {
    console.error("Error fetching loyalty tiers:", error);
    // Return default tiers on error
    return [
      { name: "Bronze", points: 0, cashbackRate: 0.01 },
      { name: "Silver", points: 100, cashbackRate: 0.02 },
      { name: "Gold", points: 500, cashbackRate: 0.03 },
      { name: "Platinum", points: 1000, cashbackRate: 0.05 },
      { name: "Diamond", points: 5000, cashbackRate: 0.07 }
    ];
  }
}

// Helper function to get FAQs
export async function getFAQs() {
  try {
    const faqsDb = await findDatabaseByTitle("FAQs");
    if (!faqsDb) {
      // Return empty array if database doesn't exist yet
      return [];
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
    
    return response.results.map((page: any) => {
      const properties = page.properties;
      
      return {
        id: page.id,
        question: properties.Question?.rich_text?.[0]?.plain_text || "Unknown question",
        answer: properties.Answer?.rich_text?.[0]?.plain_text || "No answer provided",
        category: properties.Category?.select?.name || "General"
      };
    });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }
}