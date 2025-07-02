import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Gamepad2, Dice5, TrendingUp, User } from "lucide-react";
const projectShadowLogo = "/assets/new-logo.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="h-16 bg-background-darker border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <img 
            src={projectShadowLogo} 
            alt="Project Shadow" 
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold text-white">
              PROJECT SHADOW
            </h1>
            <p className="text-sm text-gray-400">Gaming Platform</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/auth">
            <button className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors">
              Sign In
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-background-darker to-background py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            className="flex flex-col items-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src={projectShadowLogo} 
              alt="Project Shadow" 
              className="h-32 w-auto mb-6"
            />
            <h1 className="text-4xl md:text-6xl font-bold text-center">
              Welcome to <span className="text-primary">PROJECT SHADOW</span>
            </h1>
          </motion.div>
          <motion.p 
            className="text-xl mb-10 text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Experience the thrill of our exclusive games. Test out our animations below!
          </motion.p>
          
          {/* Game Access Buttons */}
          <motion.div 
            className="flex flex-wrap justify-center gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/slots">
              <button className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                <span>Try Slots Game</span>
              </button>
            </Link>
            <Link href="/dice">
              <button className="px-6 py-3 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors flex items-center gap-2">
                <Dice5 className="h-5 w-5" />
                <span>Try Dice Game</span>
              </button>
            </Link>
            <Link href="/plinko">
              <button className="px-6 py-3 bg-accent-gold text-black rounded-md hover:bg-accent-gold/90 transition-colors flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>Try Plinko Game</span>
              </button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Demo Description */}
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-card rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">What You Can Test</h2>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Slot game animations with spinning reels and win effects</li>
            <li>Dice game with rolling dice animations</li>
            <li>Plinko game with realistic dropping ball physics</li>
            <li>Win and loss visual feedback</li>
          </ul>
          <div className="mt-6 p-4 bg-background-darker rounded-md">
            <p className="text-sm text-gray-400">
              <span className="text-primary font-bold">Note:</span> You're currently using a demo version with mock data. 
              To access full functionality including real betting and account features, please sign in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}