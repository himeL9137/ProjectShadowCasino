import React from "react";
import { AnimatedPinDemo } from "@/components/AnimatedPinDemo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PinDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              3D Pin Component
            </h1>
            <Badge variant="secondary">Prototype</Badge>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Interactive 3D pin component with hover effects, animations, and perspective transforms.
            Built with Framer Motion for smooth animations.
          </p>
        </div>

        {/* Demo Section */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardTitle className="text-2xl">Interactive Demo</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AnimatedPinDemo />
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3D Perspective</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Uses CSS transforms and perspective to create a realistic 3D effect with depth and rotation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Smooth Animations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Powered by Framer Motion with fluid transitions, hover effects, and pulsing animations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interactive Elements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Hover to reveal additional content, animated waves, and interactive lighting effects.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Dependencies</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Framer Motion - Animation library</li>
                  <li>• Tailwind CSS - Styling</li>
                  <li>• Wouter - Routing integration</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 3D transforms and perspective</li>
                  <li>• Hover state management</li>
                  <li>• Animated background waves</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}