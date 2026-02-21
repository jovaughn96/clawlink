"use client";

import { type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnimatedCounter, staggerItem } from "@/components/motion-primitives";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  const isNumeric = typeof value === "number";
  const animatedValue = useAnimatedCounter(isNumeric ? value : 0, 1200);

  return (
    <motion.div variants={staggerItem}>
      <Card className="relative overflow-hidden border-t-2 border-t-primary hover-glow transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && <Icon className="size-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="font-mono text-3xl font-bold text-foreground">
            {isNumeric ? animatedValue : value}
          </div>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
}

export function StatsGrid({ children }: StatsGridProps) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {children}
    </motion.div>
  );
}
