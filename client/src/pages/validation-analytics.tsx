
import React from 'react';
import { Card } from '@/components/ui/card';
import { Chart } from '@/components/ui/chart';
import { MainLayout } from '@/components/layout/main-layout';

export default function ValidationAnalytics() {
  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Tableau de Bord Validation</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Temps Moyen de Validation</h3>
            <Chart type="line" data={[]} /> 
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Taux d'Approbation</h3>
            <Chart type="pie" data={[]} />
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Volume par Service</h3>
            <Chart type="bar" data={[]} />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
