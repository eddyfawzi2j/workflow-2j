import React from "react";
import { Link } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, getInitials } from "@/lib/utils";
import { 
  User, 
  Tag, 
  Ticket,
  ChevronRight
} from "lucide-react";

export interface RequestListItemProps {
  id: number;
  ticketId: string;
  title: string;
  status: string;
  date: string | Date;
  requester: string;
  department: string;
  onClick?: () => void;
}

export function RequestListItem({
  id,
  ticketId,
  title,
  status,
  date,
  requester,
  department,
  onClick,
}: RequestListItemProps) {
  const formattedDate = formatDate(date);
  
  return (
    <li className="border-b border-gray-200 last:border-0">
      <div 
        className="block hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={onClick}
      >
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <p className="text-sm font-medium text-primary truncate">
                {title}
              </p>
              <div className="ml-2 flex-shrink-0 flex">
                <StatusBadge status={status} />
              </div>
            </div>
            <div className="ml-2 flex-shrink-0 flex items-center">
              <p className="text-sm text-gray-500">{formattedDate}</p>
              <ChevronRight className="ml-2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="sm:flex">
              <p className="flex items-center text-sm text-gray-500">
                <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span>{requester}</span>
              </p>
              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                <Tag className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span>{department}</span>
              </p>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
              <Ticket className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
              <span>{ticketId}</span>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
