import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return format(d, "MMM d, yyyy h:mm a");
}

export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getInitials(name: string): string {
  if (!name) return "";
  
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-green-500 text-white';
    case 'pending_approval':
    case 'pending':
      return 'bg-amber-500 text-white';
    case 'rejected':
      return 'bg-red-500 text-white';
    case 'draft':
      return 'bg-gray-300 text-gray-700';
    default:
      return 'bg-gray-300 text-gray-700';
  }
}

export function formatStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending_approval':
      return 'Pending Approval';
    case 'pending':
      return 'Pending';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  }
}

export function generateTicketId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REQ-${year}-${random}`;
}

export function dataURLtoBlob(dataURL: string): Blob {
  // Split on comma to get the data part
  const arr = dataURL.split(',');
  // Match the mime type
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  // Convert base64 to raw binary data
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}
