import React from "react";
import { Helmet } from "react-helmet";
import { MainLayout } from "@/components/layout/main-layout";
import { ExpressionBesoinForm } from "@/components/forms/expression-besoin-form";
import { useLocation } from "wouter";

export default function BesoinPage() {
  const [, setLocation] = useLocation();

  return (
    <MainLayout>
      <Helmet>
        <title>Expression de besoin | Workflow GED</title>
      </Helmet>
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Créer une nouvelle demande</h1>
        <div className="mb-8">
          <p className="text-muted-foreground">
            Utilisez ce formulaire pour exprimer un besoin d'achat, de service ou d'investissement. 
            Votre demande sera soumise au processus d'approbation selon les procédures en vigueur.
          </p>
        </div>
        <ExpressionBesoinForm 
          onSubmitSuccess={() => setLocation('/my-requests')}
          onCancel={() => setLocation('/dashboard')}
        />
      </div>
    </MainLayout>
  );
}