import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Login from "@/pages/login";
import Register from "@/pages/register";
import { Briefcase } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect to dashboard if already logged in
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left side - Auth Form */}
      <div className="flex flex-col justify-center items-center p-10 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">WorkflowPro</h1>
            <p className="text-sm text-muted-foreground">
              {activeTab === "login" 
                ? "Connectez-vous à votre compte pour continuer" 
                : "Créez un compte pour commencer"}
            </p>
          </div>
          <Tabs 
            defaultValue="login" 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-0">
              <Login />
            </TabsContent>
            <TabsContent value="register" className="mt-0">
              <Register />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero Banner */}
      <div className="hidden md:flex flex-col justify-center items-center p-10 bg-gradient-to-br from-primary/90 to-primary text-white">
        <div className="max-w-xl space-y-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <Briefcase size={40} />
            </div>
          </div>
          <h2 className="text-4xl font-bold">
            Exprimez vos besoins et collectez les approbations facilement
          </h2>
          <p className="text-xl opacity-80">
            Simplifiez le flux de travail des demandes de votre organisation avec notre
            plateforme intuitive qui gère tout, de la soumission à l'approbation finale
            avec signatures électroniques.
          </p>
          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="space-y-2">
              <div className="font-bold text-xl">Approbation Multi-Niveaux</div>
              <p className="opacity-80">
                Flux de travail personnalisés pour la hiérarchie de votre organisation
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-xl">Signatures Électroniques</div>
              <p className="opacity-80">
                Validation sécurisée avec capacités de signature numérique
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-xl">Gestion des Documents</div>
              <p className="opacity-80">
                Joignez et organisez les documents justificatifs
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-xl">Suivi en Temps Réel</div>
              <p className="opacity-80">
                Suivez vos demandes à chaque étape d'approbation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}