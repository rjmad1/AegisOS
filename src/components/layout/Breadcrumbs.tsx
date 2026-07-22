"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { cn } from "@/utils/cn";

export const Breadcrumbs: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { getBreadcrumbs } = useNavigation();

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-1">
      {breadcrumbs.map((bc, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        
        return (
          <React.Fragment key={bc.href + idx}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.2 }}
              className="flex items-center"
            >
              <button
                onClick={() => !isLast && router.push(bc.href)}
                disabled={isLast}
                className={cn(
                  "text-sm font-medium transition-colors duration-200 px-2 py-1 rounded-md",
                  isLast 
                    ? "text-foreground cursor-default bg-accent/30" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {bc.label}
              </button>
            </motion.div>
            
            {!isLast && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
