import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Helmet } from "react-helmet";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Shield, 
  Building, 
  Plus,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RegisterData } from "@/context/auth-context";
import { useAuth } from "@/context/auth-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

// Données mock pour les départements
const mockDepartments = [
  { id: 1, name: "Direction Informatique", code: "IT", description: "Services informatiques et numériques" },
  { id: 2, name: "Direction Financière", code: "Finance", description: "Gestion financière et comptabilité" },
  { id: 3, name: "Ressources Humaines", code: "RH", description: "Gestion du personnel" },
  { id: 4, name: "Opérations", code: "Operations", description: "Coordination des opérations" },
  { id: 5, name: "Marketing", code: "Marketing", description: "Marketing et communication" },
  { id: 6, name: "Juridique", code: "Legal", description: "Affaires juridiques et conformité" }
];

// Données mock pour les rôles
const mockRoles = [
  { 
    id: 1, 
    name: "Administrateur IT", 
    code: "admin", 
    description: "Accès complet au système",
    permissions: ["users_read", "users_write", "departments_read", "departments_write", "roles_read", "roles_write", "requests_read", "requests_write", "documents_read", "documents_write"]
  },
  { 
    id: 2, 
    name: "Approbateur", 
    code: "approver", 
    description: "Peut approuver les demandes",
    permissions: ["requests_read", "requests_approve", "documents_read"]
  },
  { 
    id: 3, 
    name: "Validateur", 
    code: "validator", 
    description: "Peut valider les demandes",
    permissions: ["requests_read", "requests_validate", "documents_read"]
  },
  { 
    id: 4, 
    name: "Utilisateur", 
    code: "user", 
    description: "Accès de base au système",
    permissions: ["requests_read", "requests_create", "documents_read", "documents_create"]
  },
  { 
    id: 5, 
    name: "Acheteur", 
    code: "buyer", 
    description: "Gère les achats et commandes",
    permissions: ["requests_read", "requests_create", "requests_validate", "documents_read", "documents_create"]
  },
  { 
    id: 6, 
    name: "Magasinier", 
    code: "warehouse", 
    description: "Gère les stocks et le magasin",
    permissions: ["requests_read", "documents_read", "documents_create"]
  }
];

// Liste des permissions disponibles
const availablePermissions = [
  { id: "users_read", name: "Lire les utilisateurs", category: "Utilisateurs" },
  { id: "users_write", name: "Modifier les utilisateurs", category: "Utilisateurs" },
  { id: "departments_read", name: "Lire les départements", category: "Départements" },
  { id: "departments_write", name: "Modifier les départements", category: "Départements" },
  { id: "roles_read", name: "Lire les rôles", category: "Rôles" },
  { id: "roles_write", name: "Modifier les rôles", category: "Rôles" },
  { id: "requests_read", name: "Lire les demandes", category: "Demandes" },
  { id: "requests_create", name: "Créer des demandes", category: "Demandes" },
  { id: "requests_approve", name: "Approuver des demandes", category: "Demandes" },
  { id: "requests_validate", name: "Valider des demandes", category: "Demandes" },
  { id: "requests_write", name: "Modifier toutes les demandes", category: "Demandes" },
  { id: "documents_read", name: "Lire les documents", category: "Documents" },
  { id: "documents_create", name: "Créer des documents", category: "Documents" },
  { id: "documents_write", name: "Modifier tous les documents", category: "Documents" }
];

// Mock data for users
const mockUsers = [
  {
    id: 1,
    username: "admin",
    fullName: "Administrateur Système",
    department: "IT",
    role: "admin",
    lastActive: "2023-04-05T10:30:00Z",
    status: "active",
  },
  {
    id: 2,
    username: "jdoe",
    fullName: "Jean Dupont",
    department: "Finance",
    role: "approver",
    lastActive: "2023-04-04T16:45:00Z",
    status: "active",
  },
  {
    id: 3,
    username: "mmoulin",
    fullName: "Marie Moulin",
    department: "RH",
    role: "validator",
    lastActive: "2023-04-03T09:15:00Z",
    status: "active",
  },
  {
    id: 4,
    username: "pmartin",
    fullName: "Pierre Martin",
    department: "Opérations",
    role: "user",
    lastActive: "2023-04-02T14:20:00Z",
    status: "inactive",
  },
  {
    id: 5,
    username: "sdiallo",
    fullName: "Seydou Diallo",
    department: "IT",
    role: "user",
    lastActive: "2023-04-01T11:10:00Z",
    status: "active",
  }
];

// Schema pour la création d'un département
const departmentSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit comporter au moins 2 caractères",
  }),
  code: z.string().min(1, {
    message: "Le code doit comporter au moins 1 caractère",
  }),
  description: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

// Schema pour la création d'un rôle
const roleSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit comporter au moins 2 caractères",
  }),
  code: z.string().min(1, {
    message: "Le code doit comporter au moins 1 caractère",
  }),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, {
    message: "Sélectionnez au moins une permission",
  }),
});

type RoleFormValues = z.infer<typeof roleSchema>;

// Form schema for new user
const newUserSchema = z.object({
  username: z.string().min(3, {
    message: "Le nom d'utilisateur doit comporter au moins 3 caractères",
  }),
  password: z.string().min(8, {
    message: "Le mot de passe doit comporter au moins 8 caractères",
  }).optional().or(z.literal('')), // Optional pour l'édition
  confirmPassword: z.string().optional().or(z.literal('')), // Optional pour l'édition
  fullName: z.string().min(2, {
    message: "Le nom complet doit comporter au moins 2 caractères",
  }),
  email: z.string().email({
    message: "Veuillez entrer une adresse e-mail valide",
  }),
  department: z.string().min(1, {
    message: "Veuillez sélectionner un département",
  }),
  role: z.string().min(1, {
    message: "Veuillez sélectionner un rôle",
  }),
}).refine((data) => {
  // Si un mot de passe est fourni, il doit correspondre à la confirmation
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

// Format date to readable format
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Role badge color map
const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-800";
    case "approver":
      return "bg-blue-100 text-blue-800";
    case "validator":
      return "bg-green-100 text-green-800";
    case "buyer":
      return "bg-purple-100 text-purple-800";
    case "warehouse":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function Users() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState(mockUsers);
  const [departments, setDepartments] = useState(mockDepartments);
  const [roles, setRoles] = useState(mockRoles);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState("");
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isNewDepartmentDialogOpen, setIsNewDepartmentDialogOpen] = useState(false);
  const [isNewRoleDialogOpen, setIsNewRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteDepartmentDialogOpen, setIsDeleteDepartmentDialogOpen] = useState(false);
  const [isDeleteRoleDialogOpen, setIsDeleteRoleDialogOpen] = useState(false);
  const [isEditPermissionsDialogOpen, setIsEditPermissionsDialogOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<(typeof mockUsers)[0] | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  
  // Vérifier si l'utilisateur est admin IT
  const isAdminIT = user?.role === "admin" && user?.department === "IT";
  
  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      department: "",
      role: "",
    },
  });

  // Réinitialiser le formulaire pour un nouvel utilisateur
  const setupNewUserForm = () => {
    setEditingUser(null);
    form.reset({
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      department: "",
      role: "",
    });
    setIsNewUserDialogOpen(true);
  };
  
  // Réinitialiser le formulaire avec les valeurs de l'utilisateur à modifier
  const setupEditForm = (user: (typeof mockUsers)[0]) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      password: "", // On ne remplit pas le mot de passe pour des raisons de sécurité
      confirmPassword: "",
      fullName: user.fullName,
      email: "", // Email n'est pas dans notre modèle d'utilisateur actuel
      department: user.department,
      role: user.role,
    });
    setIsEditUserDialogOpen(true);
  };
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle adding/editing a user
  const onSubmit = (data: NewUserFormValues) => {
    // Si nous sommes en mode édition
    if (editingUser) {
      const updatedUsers = users.map(user => {
        if (user.id === editingUser.id) {
          return {
            ...user,
            username: data.username,
            fullName: data.fullName,
            department: data.department,
            role: data.role,
            // On ne modifie pas le mot de passe si les champs sont vides
            ...(data.password ? { password: data.password } : {})
          };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
      form.reset();
      
      toast({
        title: "Utilisateur modifié",
        description: `L'utilisateur ${data.fullName} a été modifié avec succès.`,
      });
    } 
    // Sinon en mode création
    else {
      // In a real application, you would send this data to your API
      // Here we'll just add it to our local state
      const newUser = {
        id: users.length + 1,
        username: data.username,
        fullName: data.fullName,
        department: data.department,
        role: data.role,
        lastActive: new Date().toISOString(),
        status: "active",
      };
      
      setUsers([...users, newUser]);
      setIsNewUserDialogOpen(false);
      form.reset();
      
      toast({
        title: "Utilisateur créé",
        description: `L'utilisateur ${data.fullName} a été créé avec succès.`,
      });
    }
  };
  
  // Formulaires de gestion
  const departmentForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });
  
  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      permissions: [],
    },
  });
  
  // Filtrer les départements
  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(departmentSearchQuery.toLowerCase()) ||
    dept.code.toLowerCase().includes(departmentSearchQuery.toLowerCase())
  );
  
  // Filtrer les rôles
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
    role.code.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );
  
  // Handle user deletion
  const handleDeleteUser = () => {
    if (selectedUser) {
      const updatedUsers = users.filter(user => user.id !== selectedUser);
      setUsers(updatedUsers);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });
    }
  };
  
  // Ajouter un département
  const handleAddDepartment = (data: DepartmentFormValues) => {
    const newDepartment = {
      id: departments.length + 1,
      name: data.name,
      code: data.code,
      description: data.description || "",
    };
    
    setDepartments([...departments, newDepartment]);
    setIsNewDepartmentDialogOpen(false);
    departmentForm.reset();
    
    toast({
      title: "Département créé",
      description: `Le département ${data.name} a été créé avec succès.`,
    });
  };
  
  // Ajouter un rôle
  const handleAddRole = (data: RoleFormValues) => {
    const newRole = {
      id: roles.length + 1,
      name: data.name,
      code: data.code,
      description: data.description || "",
      permissions: data.permissions,
    };
    
    setRoles([...roles, newRole]);
    setIsNewRoleDialogOpen(false);
    roleForm.reset();
    
    toast({
      title: "Rôle créé",
      description: `Le rôle ${data.name} a été créé avec succès.`,
    });
  };
  
  // Supprimer un département
  const handleDeleteDepartment = () => {
    if (selectedDepartment) {
      const updatedDepartments = departments.filter(dept => dept.id !== selectedDepartment);
      setDepartments(updatedDepartments);
      setIsDeleteDepartmentDialogOpen(false);
      setSelectedDepartment(null);
      
      toast({
        title: "Département supprimé",
        description: "Le département a été supprimé avec succès.",
      });
    }
  };
  
  // Supprimer un rôle
  const handleDeleteRole = () => {
    if (selectedRole) {
      const updatedRoles = roles.filter(role => role.id !== selectedRole);
      setRoles(updatedRoles);
      setIsDeleteRoleDialogOpen(false);
      setSelectedRole(null);
      
      toast({
        title: "Rôle supprimé",
        description: "Le rôle a été supprimé avec succès.",
      });
    }
  };
  
  // Modifier les permissions d'un rôle
  const handleEditPermissions = () => {
    if (selectedRole) {
      const updatedRoles = roles.map(role => {
        if (role.id === selectedRole) {
          return { ...role, permissions: selectedRolePermissions };
        }
        return role;
      });
      
      setRoles(updatedRoles);
      setIsEditPermissionsDialogOpen(false);
      setSelectedRole(null);
      
      toast({
        title: "Permissions mises à jour",
        description: "Les permissions du rôle ont été mises à jour avec succès.",
      });
    }
  };
  
  // Ouvrir la boîte de dialogue d'édition des permissions
  const openEditPermissions = (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      setSelectedRole(roleId);
      setSelectedRolePermissions([...role.permissions]);
      setIsEditPermissionsDialogOpen(true);
    }
  };
  
  return (
    <MainLayout>
      <Helmet>
        <title>Gestion des utilisateurs | Workflow GED</title>
      </Helmet>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Administration du système</h1>
            <p className="text-muted-foreground">
              Gérez les utilisateurs, les départements et les droits d'accès.
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">
              <UserPlus className="mr-2 h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            {isAdminIT && (
              <>
                <TabsTrigger value="departments">
                  <Building className="mr-2 h-4 w-4" />
                  Départements
                </TabsTrigger>
                <TabsTrigger value="roles">
                  <Shield className="mr-2 h-4 w-4" />
                  Rôles & Permissions
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
        
        {/* Onglet des utilisateurs */}
        {activeTab === "users" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>
              <Button onClick={setupNewUserForm}>
                <UserPlus className="mr-2 h-4 w-4" />
                Nouvel utilisateur
              </Button>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Liste des utilisateurs</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Département</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Dernière activité</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{user.fullName}</div>
                                <div className="text-sm text-muted-foreground">@{user.username}</div>
                              </div>
                            </TableCell>
                            <TableCell>{user.department}</TableCell>
                            <TableCell>
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {user.role === 'admin' && 'Administrateur'}
                                {user.role === 'approver' && 'Approbateur'}
                                {user.role === 'validator' && 'Validateur'}
                                {user.role === 'user' && 'Utilisateur'}
                                {user.role === 'buyer' && 'Acheteur'}
                                {user.role === 'warehouse' && 'Magasinier'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(user.lastActive)}</TableCell>
                            <TableCell>
                              <Badge variant={user.status === 'active' ? "default" : "secondary"}>
                                {user.status === 'active' ? 'Actif' : 'Inactif'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Ouvrir le menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => setupEditForm(user)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                      setSelectedUser(user.id);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Aucun utilisateur trouvé.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        {/* Onglet des départements (visible uniquement pour les admins IT) */}
        {activeTab === "departments" && isAdminIT && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Gestion des départements</h2>
              <Dialog open={isNewDepartmentDialogOpen} onOpenChange={setIsNewDepartmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau département
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Ajouter un nouveau département</DialogTitle>
                    <DialogDescription>
                      Créez un nouveau département dans l'organisation.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...departmentForm}>
                    <form onSubmit={departmentForm.handleSubmit(handleAddDepartment)} className="space-y-4">
                      <FormField
                        control={departmentForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du département</FormLabel>
                            <FormControl>
                              <Input placeholder="Direction Informatique" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={departmentForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code du département</FormLabel>
                            <FormControl>
                              <Input placeholder="IT" {...field} />
                            </FormControl>
                            <FormDescription>
                              Code court utilisé pour identifier le département
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={departmentForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Description du département" 
                                className="resize-none" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit">Créer le département</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Liste des départements</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      className="pl-8"
                      value={departmentSearchQuery}
                      onChange={(e) => setDepartmentSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDepartments.length > 0 ? (
                        filteredDepartments.map((department) => (
                          <TableRow key={department.id}>
                            <TableCell className="font-medium">{department.name}</TableCell>
                            <TableCell>{department.code}</TableCell>
                            <TableCell className="max-w-md truncate">{department.description}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Ouvrir le menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                      setSelectedDepartment(department.id);
                                      setIsDeleteDepartmentDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            Aucun département trouvé.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        {/* Onglet des rôles et permissions (visible uniquement pour les admins IT) */}
        {activeTab === "roles" && isAdminIT && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Gestion des rôles et permissions</h2>
              <Dialog open={isNewRoleDialogOpen} onOpenChange={setIsNewRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau rôle
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Ajouter un nouveau rôle</DialogTitle>
                    <DialogDescription>
                      Créez un nouveau rôle avec des permissions spécifiques.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...roleForm}>
                    <form onSubmit={roleForm.handleSubmit(handleAddRole)} className="space-y-4">
                      <FormField
                        control={roleForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du rôle</FormLabel>
                            <FormControl>
                              <Input placeholder="Administrateur" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={roleForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code du rôle</FormLabel>
                            <FormControl>
                              <Input placeholder="admin" {...field} />
                            </FormControl>
                            <FormDescription>
                              Code court utilisé pour identifier le rôle
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={roleForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Description du rôle" 
                                className="resize-none" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={roleForm.control}
                        name="permissions"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel className="text-base">Permissions</FormLabel>
                              <FormDescription>
                                Sélectionnez les permissions pour ce rôle
                              </FormDescription>
                            </div>
                            <div className="space-y-4">
                              {Object.entries(
                                availablePermissions.reduce<Record<string, typeof availablePermissions>>((acc, perm) => {
                                  if (!acc[perm.category]) {
                                    acc[perm.category] = [];
                                  }
                                  acc[perm.category].push(perm);
                                  return acc;
                                }, {})
                              ).map(([category, perms]) => (
                                <div key={category} className="space-y-2">
                                  <h3 className="font-medium">{category}</h3>
                                  <div className="grid grid-cols-2 gap-2">
                                    {perms.map((perm) => (
                                      <FormField
                                        key={perm.id}
                                        control={roleForm.control}
                                        name="permissions"
                                        render={({ field }) => {
                                          return (
                                            <FormItem
                                              key={perm.id}
                                              className="flex flex-row items-start space-x-3 space-y-0"
                                            >
                                              <FormControl>
                                                <Checkbox
                                                  checked={field.value?.includes(perm.id)}
                                                  onCheckedChange={(checked) => {
                                                    return checked
                                                      ? field.onChange([...field.value, perm.id])
                                                      : field.onChange(
                                                          field.value?.filter(
                                                            (value) => value !== perm.id
                                                          )
                                                        )
                                                  }}
                                                />
                                              </FormControl>
                                              <FormLabel className="font-normal">
                                                {perm.name}
                                              </FormLabel>
                                            </FormItem>
                                          )
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit">Créer le rôle</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Liste des rôles</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      className="pl-8"
                      value={roleSearchQuery}
                      onChange={(e) => setRoleSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRoles.length > 0 ? (
                        filteredRoles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell className="font-medium">{role.name}</TableCell>
                            <TableCell>{role.code}</TableCell>
                            <TableCell className="max-w-xs truncate">{role.description}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="font-normal">
                                  {role.permissions.length} permissions
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Ouvrir le menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => openEditPermissions(role.id)}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Gérer les permissions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                      setSelectedRole(role.id);
                                      setIsDeleteRoleDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            Aucun rôle trouvé.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Dialogues de confirmation et modales */}
      
      {/* Dialog for adding a new user */}
      <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Créez un nouvel utilisateur pour lui donner accès au système.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="jdupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Jean Dupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse e-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="jean.dupont@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Département</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.code}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.code}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Créer l'utilisateur</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for editing a user */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="jdupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe (facultatif)</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Laissez vide pour conserver le mot de passe actuel
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Jean Dupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse e-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="jean.dupont@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Département</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.code}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.code}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Enregistrer les modifications</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation pour supprimer un utilisateur */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement l'utilisateur et toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Confirmation pour supprimer un département */}
      <AlertDialog open={isDeleteDepartmentDialogOpen} onOpenChange={setIsDeleteDepartmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le département.
              Les utilisateurs associés à ce département ne seront pas supprimés, mais ils n'auront plus de département assigné.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDepartment(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDepartment} className="bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Confirmation pour supprimer un rôle */}
      <AlertDialog open={isDeleteRoleDialogOpen} onOpenChange={setIsDeleteRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le rôle.
              Les utilisateurs associés à ce rôle ne seront pas supprimés, mais ils n'auront plus de rôle assigné.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedRole(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialogue pour éditer les permissions d'un rôle */}
      <Dialog open={isEditPermissionsDialogOpen} onOpenChange={setIsEditPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Gérer les permissions</DialogTitle>
            <DialogDescription>
              Modifiez les permissions associées à ce rôle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {Object.entries(
                availablePermissions.reduce<Record<string, typeof availablePermissions>>((acc, perm) => {
                  if (!acc[perm.category]) {
                    acc[perm.category] = [];
                  }
                  acc[perm.category].push(perm);
                  return acc;
                }, {})
              ).map(([category, perms]) => (
                <div key={category} className="space-y-2">
                  <h3 className="font-medium">{category}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map((perm) => (
                      <div key={perm.id} className="flex flex-row items-start space-x-3">
                        <Checkbox
                          id={`perm-${perm.id}`}
                          checked={selectedRolePermissions.includes(perm.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRolePermissions([...selectedRolePermissions, perm.id]);
                            } else {
                              setSelectedRolePermissions(
                                selectedRolePermissions.filter((id) => id !== perm.id)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`perm-${perm.id}`}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {perm.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={handleEditPermissions}>Enregistrer les modifications</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}