import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, FileText, Filter, FolderPlus, Plus, Search, Tag, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn, formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Document } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Documents() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false);
  
  const onCreateFolder = async () => {
    const folderName = prompt("Entrez le nom du nouveau dossier:");
    if (!folderName) return;
    
    try {
      // TODO: Implémenter l'appel API pour créer le dossier
      toast({
        title: "Dossier créé",
        description: `Le dossier "${folderName}" a été créé avec succès.`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le dossier.",
        variant: "destructive"
      });
    }
  };
  
  const onCreateDocument = () => {
    // Ouvrir la modal pour créer un nouveau document
    setShowNewDocumentModal(true);
    toast({
      title: "Création de document",
      description: "Fonctionnalité en cours de développement. Disponible prochainement!"
    });
  };

  // Fetch documents
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/document-categories"],
  });

  // Fetch tags
  const { data: tags = [] } = useQuery<any[]>({
    queryKey: ["/api/document-tags"],
  });

  // Filter documents
  const filteredDocuments = documents
    ?.filter((doc) => {
      if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedCategory && doc.categoryId.toString() !== selectedCategory) {
        return false;
      }
      if (selectedStatus && doc.status !== selectedStatus) {
        return false;
      }
      if (activeTab === "draft" && doc.status !== "draft") {
        return false;
      }
      if (activeTab === "published" && doc.status !== "published") {
        return false;
      }
      if (activeTab === "archived" && doc.status !== "archived") {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <MainLayout>
      <div className="px-6 py-4 flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestion des Documents</h1>
          <div className="flex gap-2">
            <Button onClick={onCreateFolder} variant="outline" className="flex items-center gap-2">
              <FolderPlus size={16} />
              <span>Nouveau Dossier</span>
            </Button>
            <Button onClick={onCreateDocument} className="flex items-center gap-2">
              <Plus size={16} />
              <span>Nouveau Document</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="draft">Brouillons</TabsTrigger>
              <TabsTrigger value="published">Publiés</TabsTrigger>
              <TabsTrigger value="archived">Archivés</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter size={16} />
                <span>Filtres</span>
              </Button>
            </div>
          </div>

          {showFilters && (
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Recherche</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par titre..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Catégorie</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Toutes les catégories</SelectItem>
                        {Array.isArray(categories) && categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Statut</label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous les statuts</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <TabsContent value="all" className="mt-0">
            <DocumentList documents={filteredDocuments as Document[] | undefined} isLoading={isLoading} categories={categories} />
          </TabsContent>
          <TabsContent value="draft" className="mt-0">
            <DocumentList documents={filteredDocuments as Document[] | undefined} isLoading={isLoading} categories={categories} />
          </TabsContent>
          <TabsContent value="published" className="mt-0">
            <DocumentList documents={filteredDocuments as Document[] | undefined} isLoading={isLoading} categories={categories} />
          </TabsContent>
          <TabsContent value="archived" className="mt-0">
            <DocumentList documents={filteredDocuments as Document[] | undefined} isLoading={isLoading} categories={categories} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

interface DocumentListProps {
  documents?: Document[];
  isLoading: boolean;
  categories?: any[];
  currentFolder?: string;
  onCreateFolder?: () => void;
  onMoveDocument?: (documentId: number, folderId: string) => void;
}

function DocumentList({ 
  documents, 
  isLoading, 
  categories,
  currentFolder,
  onCreateFolder,
  onMoveDocument 
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!documents?.length) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <FileText className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">Aucun document trouvé</h3>
          <p className="text-muted-foreground mt-1">
            Aucun document ne correspond à votre recherche ou aux filtres sélectionnés.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Function to get category name by id
  const getCategoryName = (categoryId: number) => {
    const category = categories?.find((cat: any) => cat.id === categoryId);
    return category ? category.name : "Catégorie inconnue";
  };

  return (
    <div className="space-y-4">
      {documents?.map((document) => (
        <Card key={document.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-start gap-4 p-4">
              <div className="flex-shrink-0">
                <div className="bg-primary/10 h-14 w-14 rounded-md flex items-center justify-center">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-lg truncate">{document.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{document.reference}</span>
                      <span>•</span>
                      <span>{getCategoryName(document.categoryId)}</span>
                      <span>•</span>
                      <span>{formatDate(document.createdAt)}</span>
                    </div>
                    {document.description && (
                      <p className="mt-2 text-sm line-clamp-2">
                        {document.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Badge
                      variant={
                        document.status === "published" 
                          ? "default" 
                          : document.status === "draft" 
                            ? "outline" 
                            : "secondary"
                      }
                    >
                      {document.status === "published" 
                        ? "Publié" 
                        : document.status === "draft" 
                          ? "Brouillon" 
                          : "Archivé"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>Voir</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Download className="h-4 w-4 mr-1" />
                  <span>Télécharger</span>
                </Button>
              </div>
              <div>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  <span>Supprimer</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}