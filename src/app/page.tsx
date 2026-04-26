"use client";

import Link from "next/link";
import { Shield, MapPin, Users, AlertTriangle, Smartphone, Globe } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;

    router.push("/onboarding");
  }, [isSignedIn, isLoaded, router]);

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950 dark:via-background dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is signed in, don't render the homepage (redirect will happen)
  if (isSignedIn) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950 dark:via-background dark:to-indigo-950">
      {/* Navigation */}
      <nav className="bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-foreground">Aegistrack</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/sign-up" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                Tourist Sign Up
              </Link>
              <Link href="/sign-in" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Sign In
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full">
                <Shield className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Aegistrack
            </h1>
            <p className="text-2xl md:text-3xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Smart Tourist Safety Monitoring System
            </p>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Your comprehensive safety companion for traveling in India. Real-time monitoring, emergency alerts, and peace of mind for tourists and their families.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users className="mr-2 h-5 w-5" />
                I am a Tourist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comprehensive Safety Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced technology working together to keep you safe during your travels
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow duration-200">
              <div className="bg-blue-100 dark:bg-blue-900/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Real-time Location Tracking</h3>
              <p className="text-muted-foreground">
                Continuous monitoring of your location with GPS accuracy for immediate assistance when needed.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow duration-200">
              <div className="bg-red-100 dark:bg-red-900/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Emergency SOS Alerts</h3>
              <p className="text-muted-foreground">
                One-touch emergency alerts sent to authorities and your emergency contacts instantly.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow duration-200">
              <div className="bg-green-100 dark:bg-green-900/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Wearable Integration</h3>
              <p className="text-muted-foreground">
                Compatible with smart wearables for automatic fall detection and health monitoring.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow duration-200">
              <div className="bg-purple-100 dark:bg-purple-900/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Multi-language Support</h3>
              <p className="text-muted-foreground">
                Available in 10+ Indian languages to serve diverse tourist populations effectively.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow duration-200">
              <div className="bg-orange-100 dark:bg-orange-900/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Family Coordination</h3>
              <p className="text-muted-foreground">
                Keep your family updated with real-time location sharing and safety status.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow duration-200">
              <div className="bg-indigo-100 dark:bg-indigo-900/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">24/7 Monitoring</h3>
              <p className="text-muted-foreground">
                Round-the-clock surveillance and rapid response coordination with local authorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Choose Aegistrack?
              </h2>
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  Aegistrack is India&apos;s premier tourist safety monitoring system, designed specifically for the unique challenges faced by domestic and international travelers.
                </p>
                <p className="text-lg text-muted-foreground">
                  Our platform combines cutting-edge technology with seamless integration to provide comprehensive protection, ensuring that help is always just a tap away.
                </p>
                <p className="text-lg text-muted-foreground">
                  Trusted by thousands of tourists and partnered with local authorities to create a safer travel experience across India.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started Today
                  <Shield className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="bg-card p-8 rounded-xl border border-border shadow-lg">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">10K+</div>
                  <div className="text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">24/7</div>
                  <div className="text-muted-foreground">Monitoring</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">50+</div>
                  <div className="text-muted-foreground">Cities Covered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">99.9%</div>
                  <div className="text-muted-foreground">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Travel Safely?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of tourists who trust Aegistrack for their safety across India
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Users className="mr-2 h-5 w-5" />
              Sign Up as Tourist
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-semibold text-white">Aegistrack</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm">© 2024 Aegistrack. Government of India Tourist Safety Initiative</p>
              <p className="text-xs mt-1">Keeping tourists safe across India</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
