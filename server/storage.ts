import { users, games, gameResults, userStats, type User, type InsertUser, type Game, type InsertGame, type GameResult, type InsertGameResult, type UserStats, type InsertUserStats } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: string): Promise<User | undefined>;

  // Game operations
  getAllGames(): Promise<Game[]>;
  getGamesByCategory(category: string): Promise<Game[]>;
  getFeaturedGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  searchGames(query: string): Promise<Game[]>;

  // Game result operations
  createGameResult(result: InsertGameResult): Promise<GameResult>;
  getUserGameResults(userId: number): Promise<GameResult[]>;

  // User stats operations
  getUserStats(userId: number): Promise<UserStats | undefined>;
  updateUserStats(userId: number, stats: Partial<InsertUserStats>): Promise<UserStats | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private gameResults: Map<number, GameResult>;
  private userStats: Map<number, UserStats>;
  private currentUserId: number;
  private currentGameId: number;
  private currentResultId: number;
  private currentStatsId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.gameResults = new Map();
    this.userStats = new Map();
    this.currentUserId = 1;
    this.currentGameId = 1;
    this.currentResultId = 1;
    this.currentStatsId = 1;
    
    this.initializeGames();
    this.initializeDefaultUser();
  }

  private initializeDefaultUser() {
    const defaultUser: User = {
      id: 1,
      username: "player1",
      password: "password",
      balance: "10000.00",
      createdAt: new Date(),
    };
    this.users.set(1, defaultUser);
    this.currentUserId = 2;

    // Initialize default user stats
    const defaultStats: UserStats = {
      id: 1,
      userId: 1,
      totalBets: 1247,
      totalWins: 892,
      biggestWin: "2450.00",
      favoriteGame: "Blackjack",
    };
    this.userStats.set(1, defaultStats);
    this.currentStatsId = 2;
  }

  private initializeGames() {
    const mockGames: Game[] = [
      // Featured Games
      { id: 1, name: "Mega Fortune", category: "slots", provider: "NetEnt", image: "https://pixabay.com/get/gcea660a88d1605d19398003a3fdc246195482b4b9b948f2c4b3f1f8518964f54c60b4fc7e5410f34cef26228cfd304ce531e6a0566f5b11aabe12d307925567c_1280.jpg", rtp: "96.60", isLive: false, isFeatured: true, isHot: false },
      { id: 2, name: "Live Blackjack VIP", category: "live", provider: "Evolution", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400", rtp: "99.50", isLive: true, isFeatured: true, isHot: false },
      { id: 3, name: "European Roulette", category: "table", provider: "Evolution", image: "https://pixabay.com/get/ga1d1abed99f4ffa191a7e9b44b55ae8d0bc5eb14c32548635df60b8a80f4a3182bbdb805bc27cb78a954f5cee2a142569451eeacc2391055464678c178536083_1280.jpg", rtp: "97.30", isLive: false, isFeatured: true, isHot: true },

      // Slot Games
      { id: 4, name: "Book of Ra", category: "slots", provider: "Pragmatic Play", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", rtp: "95.10", isLive: false, isFeatured: false, isHot: false },
      { id: 5, name: "Starburst", category: "slots", provider: "NetEnt", image: "https://pixabay.com/get/gd678f1c3a706747bf5c812ba4f219050b876fc01ac9d56cb9a863d4ced89710b5cc4673286fd640cff0f589384763ff454c58e2faa5c862f5e5d1bba4afb00c7_1280.jpg", rtp: "96.10", isLive: false, isFeatured: false, isHot: true },
      { id: 6, name: "Pirates Gold", category: "slots", provider: "Pragmatic Play", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", rtp: "94.50", isLive: false, isFeatured: false, isHot: false },
      { id: 7, name: "Wizard of Gems", category: "slots", provider: "Play'n GO", image: "https://pixabay.com/get/gf2a4bc1f8e36b10aaf7053840e39d66aae97fa3fc8782a1974b7473745d6141a59b0d1a61cce57d5614b39a94b77733818d626230b21b88ea7b9af865b59424c_1280.jpg", rtp: "95.80", isLive: false, isFeatured: false, isHot: false },
      { id: 8, name: "Gates of Olympus", category: "slots", provider: "Pragmatic Play", image: "https://images.unsplash.com/photo-1551033406-611cf9a28f67?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", rtp: "96.50", isLive: false, isFeatured: false, isHot: true },
      { id: 9, name: "The Dog House", category: "slots", provider: "Pragmatic Play", image: "https://pixabay.com/get/gcb6a923a2ca2d83b3fdc57f1192df0fc545d3c752da3950ab54f889b53d18b506f95c27b6b73764887c673d27c5a860208aae17c8c0b449aa26d6e645ea99429_1280.jpg", rtp: "96.51", isLive: false, isFeatured: false, isHot: false },
      { id: 10, name: "Space Wars", category: "slots", provider: "NetEnt", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", rtp: "96.80", isLive: false, isFeatured: false, isHot: false },
      { id: 11, name: "Neon Staxx", category: "slots", provider: "NetEnt", image: "https://pixabay.com/get/ge5a45c208e95249772b8dab9aab91ef4aa3161513d1de61aa190f3b03301a42da11cbfefdf4bcc4d87f67f7023f38c20490236324fc23ced477d4f96fcbbfeb1_1280.jpg", rtp: "96.90", isLive: false, isFeatured: false, isHot: false },

      // Table Games
      { id: 12, name: "Texas Hold'em", category: "table", provider: "Evolution", image: "https://pixabay.com/get/g4a0844a00a8319fbed5e2b7085dd84900f34ed113ba48b7718d67fc729e967ecd8e45b2118916e0074bdfe6549f55c06029e07dece21debae06bf164e470d143_1280.jpg", rtp: "99.20", isLive: false, isFeatured: false, isHot: false },
      { id: 13, name: "Baccarat", category: "table", provider: "Evolution", image: "https://pixabay.com/get/g21cb35187800c01c1f110f071aed67d4df656096e29fbb3860d801ce384958b0ad2ae0d4727a15985cdfbb13b0d3ab52ea7612958e5001ae48a1bd8cc6392bdd_1280.jpg", rtp: "98.90", isLive: false, isFeatured: false, isHot: false },
      { id: 14, name: "Craps", category: "table", provider: "Evolution", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300", rtp: "98.60", isLive: false, isFeatured: false, isHot: false },

      // Live Games
      { id: 15, name: "Live Roulette", category: "live", provider: "Evolution", image: "https://pixabay.com/get/g218ea4a2e1b2877074962bd9b22f00852937285205149f84f056c9812fcd85fdc3a2b0a09b18c217118fae51c29cf2b54b17c1d699b16e63bd31e1359945e028_1280.jpg", rtp: "97.30", isLive: true, isFeatured: false, isHot: true },
    ];

    mockGames.forEach(game => {
      this.games.set(game.id, game);
    });
    this.currentGameId = mockGames.length + 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      balance: insertUser.balance || "10000.00"
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, newBalance: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      user.balance = newBalance;
      this.users.set(userId, user);
      return user;
    }
    return undefined;
  }

  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGamesByCategory(category: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.category === category);
  }

  async getFeaturedGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.isFeatured);
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async searchGames(query: string): Promise<Game[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.games.values()).filter(game => 
      game.name.toLowerCase().includes(searchTerm) ||
      game.provider.toLowerCase().includes(searchTerm)
    );
  }

  async createGameResult(result: InsertGameResult): Promise<GameResult> {
    const id = this.currentResultId++;
    const gameResult: GameResult = { 
      ...result, 
      id, 
      createdAt: new Date() 
    };
    this.gameResults.set(id, gameResult);
    return gameResult;
  }

  async getUserGameResults(userId: number): Promise<GameResult[]> {
    return Array.from(this.gameResults.values()).filter(result => result.userId === userId);
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    return Array.from(this.userStats.values()).find(stats => stats.userId === userId);
  }

  async updateUserStats(userId: number, statsUpdate: Partial<InsertUserStats>): Promise<UserStats | undefined> {
    const existingStats = Array.from(this.userStats.values()).find(stats => stats.userId === userId);
    
    if (existingStats) {
      const updatedStats = { ...existingStats, ...statsUpdate };
      this.userStats.set(existingStats.id, updatedStats);
      return updatedStats;
    } else {
      const id = this.currentStatsId++;
      const newStats: UserStats = { 
        id, 
        userId, 
        totalBets: 0,
        totalWins: 0,
        biggestWin: "0.00",
        favoriteGame: null,
        ...statsUpdate 
      };
      this.userStats.set(id, newStats);
      return newStats;
    }
  }
}

export const storage = new MemStorage();
