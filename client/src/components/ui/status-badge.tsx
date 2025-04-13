import React from "react";
import { cn, getStatusColor } from "@/lib/utils";
import { Badge } from "./badge";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusText = status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const statusColorClass = getStatusColor(status);
  
  return (
    <Badge 
      className={cn(
        "text-xs font-semibold rounded-full px-2.5 py-0.5", 
        statusColorClass,
        className
      )}
    >
      {statusText}
    </Badge>
  );
}
