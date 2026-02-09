"use client"

import Link from "next/link"
import {
  Facebook,
  Instagram,
  Twitter,
  Github,
  Mail,
  Sparkles,
  MapPin,
  Phone,
  Heart,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-block text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent hover:from-amber-500 hover:to-orange-500 transition-all duration-500 ease-out">
                NEST STORE
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Revolutionizing your home with AI-driven interior design and
              premium furniture curated for your unique lifestyle.
            </p>
            <div className="flex space-x-4">
              <Link
                href="#"
                className="text-muted-foreground hover:text-emerald-500 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-blue-500 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Shop
            </h3>
            <ul className="mt-4 space-y-2">
              {[
                "Beds",
                "Chairs",
                "Lighting",
                "Sofas",
                "Tables",
                "Storages",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href={`/?category=${item.toLowerCase()}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & AI */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Experience
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm flex items-center gap-2 text-muted-foreground hover:text-emerald-500 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  AI Designer
                </Link>
              </li>
              {["Track Order", "Shipping Policy", "Returns", "FAQs"].map(
                (item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Stay Inspired
            </h3>
            <p className="text-sm text-muted-foreground">
              Get AI-curated style tips and exclusive offers.
            </p>
            <form className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex flex-col items-center gap-2 md:items-start">
              <p className="text-xs text-muted-foreground">
                &copy; {currentYear} Nest Store AI. All rights reserved.
              </p>
              {/* CATCHY CREDIT SECTION */}
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Built with{" "}
                <Heart className="h-3 w-3 fill-rose-500 text-rose-500" /> by{" "}
                <Link
                  href="https://nischaldev.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1 font-semibold text-foreground transition-all duration-300"
                >
                  <span className="group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-blue-500 group-hover:bg-clip-text group-hover:text-transparent">
                    Nischal Puri
                  </span>
                  <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-500" />
                </Link>
              </p>
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
