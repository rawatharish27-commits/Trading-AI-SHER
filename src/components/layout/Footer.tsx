"use client";

import { Github, Twitter, Mail } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="sticky bottom-0 mt-auto border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6 py-4">
        {/* Copyright */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>© 2024 Trading AI SHER. All rights reserved.</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-4">
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/docs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
        </div>

        {/* Social */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Twitter className="h-4 w-4" />
          </a>
          <a
            href="mailto:support@sher.com"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Mail className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
