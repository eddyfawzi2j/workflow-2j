import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileFormSchema = z.object({
  fullName: z.string().min(2, {
    message: "Le nom complet doit comporter au moins 2 caractères.",
  }),
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
  department: z.string().min(1, {
    message: "Veuillez sélectionner un département.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Vérifier si l'utilisateur est admin IT
  const isAdminIT = user?.role === "admin" && user?.department === "IT";

  const [themeConfig, setThemeConfig] = useState({
    primaryColor: "#0097FB",
    variant: "light",
    borderRadius: 8,
    companyLogo: "",
    companyName: ""
  });

  const handleSaveTheme = async () => {
    try {
      await fetch("/api/theme/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(themeConfig)
      });
      toast({
        title: "Configuration sauvegardée",
        description: "Les changements ont été appliqués avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive"
      });
    }
  };
  
  // Rediriger si pas admin IT
  if (!isAdminIT) {
    return (
      <MainLayout>
        <div className="container py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-2">Accès restreint</h1>
              <p className="text-muted-foreground">
                Cette section est réservée aux administrateurs IT.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const defaultValues: Partial<ProfileFormValues> = {
    fullName: user?.fullName || "",
    email: "", // Email n'est pas dans l'objet user actuel
    department: user?.department || "",
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: ProfileFormValues) {
    toast({
      title: "Mise à jour réussie",
      description: "Vos informations de profil ont été mises à jour.",
    });
  }

  return (
    <MainLayout>
      <Helmet>
        <title>Paramètres | Workflow GED</title>
      </Helmet>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez vos paramètres et préférences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="appearance">Apparence</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profil</CardTitle>
                <CardDescription>
                  Gérez les informations de votre profil.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre nom complet" {...field} />
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
                          <FormLabel>Adresse email</FormLabel>
                          <FormControl>
                            <Input placeholder="exemple@organisation.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Département / Direction</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un département" />

{isAdminIT && (
  <TabsContent value="customization" className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Personnalisation</CardTitle>
        <CardDescription>
          Personnalisez l'apparence de l'application selon votre identité visuelle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Couleur principale</Label>
            <div className="flex gap-4 mt-2">
              <Input
                type="color"
                value={themeConfig.primaryColor}
                onChange={(e) => setThemeConfig({...themeConfig, primaryColor: e.target.value})}
              />
              <Input
                value={themeConfig.primaryColor}
                onChange={(e) => setThemeConfig({...themeConfig, primaryColor: e.target.value})}
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <Label>Thème</Label>
            <Select 
              value={themeConfig.variant}
              onValueChange={(value) => setThemeConfig({...themeConfig, variant: value})}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choisir un thème" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Clair</SelectItem>
                <SelectItem value="dark">Sombre</SelectItem>
                <SelectItem value="tint">Teinté</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Rayon des bordures</Label>
            <Slider
              className="mt-2"
              value={[themeConfig.borderRadius]}
              onValueChange={([value]) => setThemeConfig({...themeConfig, borderRadius: value})}
              max={20}
              step={1}
            />
          </div>

          <div>
            <Label>Logo de l'entreprise</Label>
            <Input
              type="file"
              className="mt-2"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setThemeConfig({...themeConfig, companyLogo: reader.result as string});
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            {themeConfig.companyLogo && (
              <img 
                src={themeConfig.companyLogo} 
                alt="Logo preview"
                className="mt-2 h-16 object-contain"
              />
            )}
          </div>

          <div>
            <Label>Nom de l'entreprise</Label>
            <Input
              className="mt-2"
              value={themeConfig.companyName}
              onChange={(e) => setThemeConfig({...themeConfig, companyName: e.target.value})}
              placeholder="Nom de votre entreprise"
            />
          </div>
        </div>

        <Button onClick={handleSaveTheme}>
          Sauvegarder les changements
        </Button>
      </CardContent>
    </Card>
  </TabsContent>
)}

                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="IT">Direction Informatique</SelectItem>
                              <SelectItem value="finance">Direction Financière</SelectItem>
                              <SelectItem value="hr">Ressources Humaines</SelectItem>
                              <SelectItem value="operations">Opérations</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="legal">Juridique</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Mettre à jour le profil</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Apparence</CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de l'application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Thème</Label>
                  <Select defaultValue="system">
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Sélectionnez un thème" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Clair</SelectItem>
                      <SelectItem value="dark">Sombre</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="animations">Animations</Label>
                  <Switch id="animations" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configurez vos préférences de notification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="new-requests">Nouvelles demandes</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications pour les nouvelles demandes
                    </p>
                  </div>
                  <Switch id="new-requests" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="approvals">Approbations requises</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications pour les approbations en attente
                    </p>
                  </div>
                  <Switch id="approvals" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="updates">Mises à jour</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications pour les mises à jour de vos demandes
                    </p>
                  </div>
                  <Switch id="updates" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir également des notifications par email
                    </p>
                  </div>
                  <Switch id="email-notifications" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>
                  Gérez les paramètres de sécurité de votre compte.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Changement de mot de passe</h3>
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mot de passe actuel</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <Button>Mettre à jour le mot de passe</Button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Connexions actives</h3>
                  <div className="space-y-4">
                    <div className="rounded-md border p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">Session actuelle</p>
                          <p className="text-sm text-muted-foreground">
                            Navigateur: Chrome sur Windows
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Dernière activité: Aujourd'hui, 15:32
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Déconnecter
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Actions de sécurité</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor">Authentification à deux facteurs</Label>
                      <p className="text-sm text-muted-foreground">
                        Activer l'authentification à deux facteurs pour renforcer la sécurité
                      </p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
                  <Button variant="destructive">Déconnecter toutes les sessions</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}