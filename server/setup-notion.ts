import { Client } from "@notionhq/client";
import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists, findDatabaseByTitle } from "./notion";

// Environment variables validation
if (!process.env.NOTION_INTEGRATION_SECRET) {
    console.error("WARNING: NOTION_INTEGRATION_SECRET is not defined. The integration will not work correctly.");
    console.error("Please set a valid Notion integration secret as an environment variable.");
}

// Note that we're not strictly requiring NOTION_PAGE_URL anymore since we have a fallback for development

// Setup all Notion databases
async function setupNotionDatabases() {
    console.log("Setting up Notion databases...");

    // Create Promotions database
    await createDatabaseIfNotExists("Promotions", {
        Name: {
            title: {}
        },
        Description: {
            rich_text: {}
        },
        ImageURL: {
            url: {}
        },
        StartDate: {
            date: {}
        },
        EndDate: {
            date: {}
        },
        Priority: {
            number: {}
        },
        Active: {
            checkbox: {}
        },
        PromoCode: {
            rich_text: {}
        },
        BonusAmount: {
            number: {}
        },
        BonusType: {
            select: {
                options: [
                    { name: "deposit", color: "green" },
                    { name: "free_spin", color: "blue" },
                    { name: "cashback", color: "red" },
                    { name: "no_deposit", color: "yellow" }
                ]
            }
        }
    });

    // Create Game Configurations database
    await createDatabaseIfNotExists("GameConfigurations", {
        GameName: {
            title: {}
        },
        GameType: {
            select: {
                options: [
                    { name: "plinko", color: "blue" },
                    { name: "slots", color: "purple" },
                    { name: "dice", color: "yellow" },
                    { name: "crash", color: "red" },
                    { name: "blackjack", color: "green" },
                    { name: "roulette", color: "orange" },
                    { name: "other", color: "gray" }
                ]
            }
        },
        Enabled: {
            checkbox: {}
        },
        MinBet: {
            number: {}
        },
        MaxBet: {
            number: {}
        },
        HouseEdge: {
            number: {}
        },
        MaxMultiplier: {
            number: {}
        },
        Description: {
            rich_text: {}
        },
        Rules: {
            rich_text: {}
        },
        CustomSettings: {
            rich_text: {}
        }
    });

    // Create Loyalty Tiers database
    await createDatabaseIfNotExists("LoyaltyTiers", {
        TierName: {
            title: {}
        },
        RequiredPoints: {
            number: {}
        },
        DepositBonusPercentage: {
            number: {}
        },
        WeeklyBonus: {
            number: {}
        },
        SpecialPromotions: {
            checkbox: {}
        },
        Description: {
            rich_text: {}
        },
        Color: {
            select: {
                options: [
                    { name: "bronze", color: "brown" },
                    { name: "silver", color: "gray" },
                    { name: "gold", color: "yellow" },
                    { name: "platinum", color: "blue" },
                    { name: "diamond", color: "purple" },
                    { name: "vip", color: "red" }
                ]
            }
        }
    });

    // Create FAQs database
    await createDatabaseIfNotExists("FAQs", {
        Question: {
            title: {}
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
                    { name: "Games", color: "yellow" },
                    { name: "Bonuses", color: "purple" },
                    { name: "Technical", color: "red" }
                ]
            }
        },
        Priority: {
            number: {}
        }
    });

    console.log("Notion databases setup complete!");
}

// Create sample data for the databases
async function createSampleData() {
    try {
        console.log("Adding sample data...");

        // Find the databases
        const promotionsDb = await findDatabaseByTitle("Promotions");
        const gameConfigDb = await findDatabaseByTitle("GameConfigurations");
        const loyaltyTiersDb = await findDatabaseByTitle("LoyaltyTiers");
        const faqsDb = await findDatabaseByTitle("FAQs");

        if (!promotionsDb || !gameConfigDb || !loyaltyTiersDb || !faqsDb) {
            throw new Error("Could not find the required databases.");
        }

        // Add sample promotions
        const promotions = [
            {
                name: "Welcome Bonus",
                description: "Get a 100% bonus on your first deposit up to $500!",
                imageUrl: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=2940&auto=format&fit=crop",
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                priority: 1,
                active: true,
                promoCode: "WELCOME100",
                bonusAmount: 100,
                bonusType: "deposit"
            },
            {
                name: "Weekly Reload",
                description: "Get a 50% bonus on your deposit every Wednesday!",
                imageUrl: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2787&auto=format&fit=crop",
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                priority: 2,
                active: true,
                promoCode: "RELOAD50",
                bonusAmount: 50,
                bonusType: "deposit"
            },
            {
                name: "10 Free Spins",
                description: "Get 10 free spins on Plinko when you deposit $20 or more!",
                imageUrl: "https://images.unsplash.com/photo-1596838132731-31a7e064c3ca?q=80&w=2880&auto=format&fit=crop",
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                priority: 3,
                active: true,
                promoCode: "FREESPIN10",
                bonusAmount: 10,
                bonusType: "free_spin"
            }
        ];

        for (const promo of promotions) {
            await notion.pages.create({
                parent: {
                    database_id: promotionsDb.id
                },
                properties: {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: promo.name
                                }
                            }
                        ]
                    },
                    Description: {
                        rich_text: [
                            {
                                text: {
                                    content: promo.description
                                }
                            }
                        ]
                    },
                    ImageURL: {
                        url: promo.imageUrl
                    },
                    StartDate: {
                        date: {
                            start: promo.startDate
                        }
                    },
                    EndDate: {
                        date: {
                            start: promo.endDate
                        }
                    },
                    Priority: {
                        number: promo.priority
                    },
                    Active: {
                        checkbox: promo.active
                    },
                    PromoCode: {
                        rich_text: [
                            {
                                text: {
                                    content: promo.promoCode
                                }
                            }
                        ]
                    },
                    BonusAmount: {
                        number: promo.bonusAmount
                    },
                    BonusType: {
                        select: {
                            name: promo.bonusType
                        }
                    }
                }
            });
        }

        console.log(`Created ${promotions.length} sample promotions.`);

        // Add sample game configurations
        const gameConfigs = [
            {
                name: "Plinko",
                gameType: "plinko",
                enabled: true,
                minBet: 1,
                maxBet: 500,
                houseEdge: 5,
                maxMultiplier: 5,
                description: "Drop the ball and watch it bounce through pegs for big wins!",
                rules: "Place your bet, choose your risk level, and drop the ball. The ball will bounce through pegs and land in a bucket with a multiplier. The higher the risk, the higher the potential payout!",
                customSettings: JSON.stringify({
                    numRows: 16,
                    numBuckets: 16,
                    riskOptions: ["low", "medium", "high"],
                    odds: {
                        low: { max: 2.5, min: 0.2 },
                        medium: { max: 5, min: 0.1 },
                        high: { max: 10, min: 0.05 }
                    }
                })
            },
            {
                name: "Slots",
                gameType: "slots",
                enabled: true,
                minBet: 0.5,
                maxBet: 100,
                houseEdge: 3,
                maxMultiplier: 1000,
                description: "Spin the reels and match symbols for big wins!",
                rules: "Place your bet and spin the reels. Match 3 or more symbols from left to right to win. Special symbols can trigger bonus features and free spins.",
                customSettings: JSON.stringify({
                    reels: 5,
                    rows: 3,
                    paylines: 20,
                    symbols: ["cherry", "lemon", "orange", "plum", "bell", "seven", "scatter", "wild"],
                    specialFeatures: ["free_spins", "bonus_round", "wild_multiplier"]
                })
            },
            {
                name: "Dice",
                gameType: "dice",
                enabled: true,
                minBet: 1,
                maxBet: 1000,
                houseEdge: 1,
                maxMultiplier: 98,
                description: "Predict the outcome of a dice roll and win big!",
                rules: "Place your bet and predict whether the roll will be over or under your selected number. The lower (or higher) your prediction, the bigger the potential payout!",
                customSettings: JSON.stringify({
                    minNumber: 1,
                    maxNumber: 100,
                    defaultTarget: 50,
                    winChance: 49
                })
            }
        ];

        for (const game of gameConfigs) {
            await notion.pages.create({
                parent: {
                    database_id: gameConfigDb.id
                },
                properties: {
                    GameName: {
                        title: [
                            {
                                text: {
                                    content: game.name
                                }
                            }
                        ]
                    },
                    GameType: {
                        select: {
                            name: game.gameType
                        }
                    },
                    Enabled: {
                        checkbox: game.enabled
                    },
                    MinBet: {
                        number: game.minBet
                    },
                    MaxBet: {
                        number: game.maxBet
                    },
                    HouseEdge: {
                        number: game.houseEdge
                    },
                    MaxMultiplier: {
                        number: game.maxMultiplier
                    },
                    Description: {
                        rich_text: [
                            {
                                text: {
                                    content: game.description
                                }
                            }
                        ]
                    },
                    Rules: {
                        rich_text: [
                            {
                                text: {
                                    content: game.rules
                                }
                            }
                        ]
                    },
                    CustomSettings: {
                        rich_text: [
                            {
                                text: {
                                    content: game.customSettings
                                }
                            }
                        ]
                    }
                }
            });
        }

        console.log(`Created ${gameConfigs.length} sample game configurations.`);

        // Add sample loyalty tiers
        const loyaltyTiers = [
            {
                name: "Bronze",
                requiredPoints: 0,
                depositBonus: 5,
                weeklyBonus: 0,
                specialPromos: false,
                description: "Welcome to our casino. Start earning points to unlock more rewards!",
                color: "bronze"
            },
            {
                name: "Silver",
                requiredPoints: 1000,
                depositBonus: 10,
                weeklyBonus: 10,
                specialPromos: false,
                description: "Silver tier rewards include increased deposit bonuses and weekly cashback!",
                color: "silver"
            },
            {
                name: "Gold",
                requiredPoints: 5000,
                depositBonus: 15,
                weeklyBonus: 25,
                specialPromos: true,
                description: "Gold tier members enjoy exclusive promotions and higher bonuses!",
                color: "gold"
            },
            {
                name: "Platinum",
                requiredPoints: 10000,
                depositBonus: 20,
                weeklyBonus: 50,
                specialPromos: true,
                description: "Premium rewards and personal account manager for our Platinum members!",
                color: "platinum"
            },
            {
                name: "Diamond",
                requiredPoints: 25000,
                depositBonus: 25,
                weeklyBonus: 100,
                specialPromos: true,
                description: "Our most exclusive tier with the best rewards and personalized bonuses!",
                color: "diamond"
            }
        ];

        for (const tier of loyaltyTiers) {
            await notion.pages.create({
                parent: {
                    database_id: loyaltyTiersDb.id
                },
                properties: {
                    TierName: {
                        title: [
                            {
                                text: {
                                    content: tier.name
                                }
                            }
                        ]
                    },
                    RequiredPoints: {
                        number: tier.requiredPoints
                    },
                    DepositBonusPercentage: {
                        number: tier.depositBonus
                    },
                    WeeklyBonus: {
                        number: tier.weeklyBonus
                    },
                    SpecialPromotions: {
                        checkbox: tier.specialPromos
                    },
                    Description: {
                        rich_text: [
                            {
                                text: {
                                    content: tier.description
                                }
                            }
                        ]
                    },
                    Color: {
                        select: {
                            name: tier.color
                        }
                    }
                }
            });
        }

        console.log(`Created ${loyaltyTiers.length} sample loyalty tiers.`);

        // Add sample FAQs
        const faqs = [
            {
                question: "How do I create an account?",
                answer: "To create an account, click on the 'Sign Up' button in the top-right corner of the page. Fill in your details and follow the instructions to complete the registration.",
                category: "Account",
                priority: 1
            },
            {
                question: "How do I make a deposit?",
                answer: "To make a deposit, log in to your account, go to the 'Wallet' section, and click on 'Deposit'. Choose your preferred payment method and follow the instructions.",
                category: "Payments",
                priority: 1
            },
            {
                question: "How do I withdraw my winnings?",
                answer: "To withdraw your winnings, go to the 'Wallet' section and click on 'Withdraw'. Enter the amount you want to withdraw and choose your preferred withdrawal method.",
                category: "Payments",
                priority: 2
            },
            {
                question: "What is Plinko?",
                answer: "Plinko is a popular casino game where you drop a ball from the top of a pegged board. The ball bounces off pegs and lands in a bucket at the bottom, determining your win.",
                category: "Games",
                priority: 1
            },
            {
                question: "How do the loyalty tiers work?",
                answer: "Our loyalty program rewards you for playing. You earn points for every bet you make. As you accumulate points, you unlock higher loyalty tiers with better rewards and bonuses.",
                category: "Bonuses",
                priority: 1
            },
            {
                question: "Is my personal information secure?",
                answer: "Yes, we use state-of-the-art encryption technology to protect your personal information. We never share your data with third parties without your consent.",
                category: "General",
                priority: 1
            },
            {
                question: "How do I change my password?",
                answer: "To change your password, go to your 'Account Settings' and click on 'Change Password'. Enter your current password and then your new password twice to confirm.",
                category: "Account",
                priority: 2
            },
            {
                question: "What is the minimum deposit amount?",
                answer: "The minimum deposit amount is $10 for most payment methods. Some methods may have higher minimums. Check the deposit page for specific details.",
                category: "Payments",
                priority: 3
            },
            {
                question: "The game is not loading. What should I do?",
                answer: "If a game isn't loading, try refreshing the page. If that doesn't work, clear your browser cache and cookies, or try using a different browser. If the issue persists, contact our support team.",
                category: "Technical",
                priority: 1
            },
            {
                question: "How do I claim a bonus?",
                answer: "To claim a bonus, go to the 'Promotions' page and find the bonus you want to claim. Click on 'Claim' and follow the instructions. Some bonuses may require a promo code or a minimum deposit.",
                category: "Bonuses",
                priority: 2
            }
        ];

        for (const faq of faqs) {
            await notion.pages.create({
                parent: {
                    database_id: faqsDb.id
                },
                properties: {
                    Question: {
                        title: [
                            {
                                text: {
                                    content: faq.question
                                }
                            }
                        ]
                    },
                    Answer: {
                        rich_text: [
                            {
                                text: {
                                    content: faq.answer
                                }
                            }
                        ]
                    },
                    Category: {
                        select: {
                            name: faq.category
                        }
                    },
                    Priority: {
                        number: faq.priority
                    }
                }
            });
        }

        console.log(`Created ${faqs.length} sample FAQs.`);

        console.log("Sample data creation complete.");
    } catch (error) {
        console.error("Error creating sample data:", error);
        throw error;
    }
}

// Run the setup
setupNotionDatabases().then(() => {
    return createSampleData();
}).then(() => {
    console.log("Setup complete!");
    process.exit(0);
}).catch(error => {
    console.error("Setup failed:", error);
    process.exit(1);
});