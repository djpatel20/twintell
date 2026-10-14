"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Building2,
  Bell,
  MessageSquare,
  User as UserIcon,
  Plus,
  LogIn,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { User } from "../../types";
import { useNotifications } from "../../context/NotificationContext";

interface SidebarProps {
  user?: User | null;
  isLoading?: boolean;
  onNewPostClick?: () => void;
}

export function Sidebar({ user, isLoading, onNewPostClick }: SidebarProps) {
  const pathname = usePathname();
  const [isMessagesActive, setIsMessagesActive] = useState(false);
  const isCompany = user?.role === "COMPANY";
  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMessagesActive(pathname === "/profile" && window.location.search.includes("tab=inquiries"));
    }
  }, [pathname]);

  const navItems = [
    { label: "Home", href: "/", icon: Home, isActive: pathname === "/" },
    { label: "Discover", href: "/discover", icon: Compass, isActive: pathname === "/discover" },
    { label: "Directory", href: "/directory", icon: Building2, isActive: pathname === "/directory" },
    {
      label: "Messages",
      href: user ? "/profile?tab=inquiries" : "/login",
      icon: MessageSquare,
      isActive: isMessagesActive,
    },
    {
      label: "Notifications",
      href: user ? "/notifications" : "/login",
      icon: Bell,
      isActive: pathname === "/notifications",
      badge:
        unreadCount > 0
          ? unreadCount > 99
            ? "99+"
            : String(unreadCount)
          : undefined,
    },
    {
      label: "Plans & Pricing",
      href: "/pricing",
      icon: Zap,
      isActive: pathname === "/pricing",
    },
    {
      label: "Profile",
      href: user ? "/profile" : "/login",
      icon: UserIcon,
      isActive: pathname === "/profile" && !isMessagesActive,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-slate-200 bg-white p-5 justify-between select-none">
      <div className="space-y-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 px-2">
          <span className="text-2xl font-black tracking-tight text-primary-500">
            Twintell
          </span>
        </Link>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={clsx(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-600 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={clsx(
                      "w-5 h-5",
                      isActive ? "text-primary-600" : "text-slate-500",
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Company New Post CTA */}
        {isCompany && (
          <div className="pt-2">
            <Button
              className="w-full shadow-md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onNewPostClick}
            >
              New Post
            </Button>
          </div>
        )}
      </div>

      {/* User profile section at bottom */}
      <div className="pt-4 border-t border-slate-100">
        {isLoading ? (
          <div className="flex items-center gap-3 p-1.5">
            <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse" />
              <div className="h-2 bg-slate-200 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
            <Link
              href="/profile"
              className="flex items-center gap-3 min-w-0 flex-1"
            >
              <Avatar
                src={user.avatarUrl}
                name={user.name}
                alt={user.name}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user.role === "COMPANY"
                    ? user.company?.name || "Company Account"
                    : user.headline || "Standard User"}
                </p>
              </div>
            </Link>
          </div>
        ) : (
          <Link href="/login" className="block">
            <Button
              variant="outline"
              className="w-full text-xs font-bold"
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign In / Register
            </Button>
          </Link>
        )}
      </div>
    </aside>
  );
}
