import React from "react";
import { Link, useLocation } from "wouter";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  UserCog,
  Settings,
  LogOut,
  Menu,
  Files,
  PlusCircle,
} from "lucide-react";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    {
      name: "Tableau de bord",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Mes demandes",
      href: "/my-requests",
      icon: FileText,
    },
    {
      name: "Nouvelle demande",
      href: "/besoin",
      icon: PlusCircle,
    },
    {
      name: "À approuver",
      href: "/to-approve",
      icon: CheckSquare,
      roles: ["validator", "approver"],
    },
    {
      name: "Documents",
      href: "/documents",
      icon: Files,
    },
    {
      name: "Gestion des utilisateurs",
      href: "/users",
      icon: UserCog,
      roles: ["admin"],
      departments: ["IT"], // Seuls les admin IT ont accès
    },
    {
      name: "Paramètres",
      href: "/settings",
      icon: Settings,
    },
  ];

  // Filter items based on user role and department
  const filteredNavItems = navItems.filter(item => {
    // Si pas de restrictions de rôle ou département, toujours afficher
    if (!item.roles && !item.departments) return true;
    
    // Si l'utilisateur n'est pas connecté, ne pas afficher les éléments avec restrictions
    if (!user) return false;
    
    // Vérifier si le rôle de l'utilisateur est autorisé (si des rôles sont spécifiés)
    const roleMatch = !item.roles || item.roles.includes(user.role);
    
    // Vérifier si le département de l'utilisateur est autorisé (si des départements sont spécifiés)
    const deptMatch = !item.departments || item.departments.includes(user.department);
    
    // L'élément est visible seulement si le rôle ET le département correspondent
    return roleMatch && deptMatch;
  });

  if (!user) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200",
      isMobile ? "w-full" : "w-64"
    )}>
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">WorkflowPro</h1>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={onClose}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* User Info */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
          {getInitials(user.fullName)}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "text-white bg-primary"
                  : "text-gray-900 hover:bg-gray-100"
              )}
            >
              <Icon className={cn(
                "mr-3 h-5 w-5",
                isActive ? "text-white" : "text-gray-400"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-900 hover:bg-gray-100"
          onClick={() => {
            logout();
            if (isMobile && onClose) onClose();
          }}
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
