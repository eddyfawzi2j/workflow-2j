import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { requestFormSchema, type RequestForm } from "@shared/schema";

// Composants UI
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

const validationSchema = requestFormSchema.pick({
  title: true,
  description: true,
  demandeur: true,
  service: true,
  direction: true,
  dateCreation: true,
  priority: true,
  department: true,
  lignesBesoins: true,
  observations: true,
});

type FormValues = z.infer<typeof validationSchema>;

interface ExpressionBesoinFormProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpressionBesoinForm({
  onSubmitSuccess,
  onCancel,
}: ExpressionBesoinFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: Partial<FormValues> = {
    title: "",
    description: "",
    demandeur: user?.fullName || "",
    service: "",
    direction: user?.department || "",
    dateCreation: format(new Date(), "dd/MM/yyyy", { locale: fr }),
    priority: "normal",
    department: user?.department || "",
    lignesBesoins: [
      {
        ordre: 1,
        cbu: "",
        designation: "",
        quantite: 1,
        budgetise: false,
        memoAccord: "",
      },
    ],
    observations: "",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  // Utilisation de useFieldArray pour gérer le tableau dynamique des lignes de besoins
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lignesBesoins",
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      // Formatage des données pour l'API
      const requestData: RequestForm = {
        ...data,
        createdBy: user?.id || 0,
      };

      const response = await apiRequest("POST", "/api/requests", requestData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Échec de la soumission");
      }

      toast({
        title: "Demande soumise avec succès",
        description: "Votre expression de besoin a été enregistrée et envoyée pour approbation.",
      });

      // Invalider les requêtes pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] });
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Fonction pour ajouter une nouvelle ligne de besoin
  const addLigneBesoin = () => {
    append({
      ordre: fields.length + 1,
      cbu: "",
      designation: "",
      quantite: 1,
      budgetise: false,
      memoAccord: "",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-center text-xl font-bold">
              FICHE D'EXPRESSION DE BESOINS / CONTRÔLE BUDGETAIRE
            </CardTitle>
            <div className="text-right text-sm">
              Ouagadougou, le {form.getValues("dateCreation")}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre de la demande</FormLabel>
                    <FormControl>
                      <Input placeholder="Titre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border rounded-md"
                        {...field}
                      >
                        <option value="low">Basse</option>
                        <option value="normal">Normale</option>
                        <option value="high">Haute</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <FormField
                control={form.control}
                name="demandeur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identité du demandeur</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service / Représentation</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direction</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description du besoin</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez votre besoin en détail..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">DÉTAIL DES BESOINS</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLigneBesoin}
                >
                  <Plus className="h-4 w-4 mr-1" /> Ajouter une ligne
                </Button>
              </div>

              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">N°</TableHead>
                      <TableHead className="w-24">CBU</TableHead>
                      <TableHead>DESIGNATION DES FOURNITURES ET/OU BESOINS</TableHead>
                      <TableHead className="w-24 text-center">QUANTITÉ</TableHead>
                      <TableHead className="w-24 text-center">BUDGÉTISÉ</TableHead>
                      <TableHead className="w-24 text-center">ACCORD MÉMO</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lignesBesoins.${index}.cbu`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="CBU"
                                    className="h-8"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lignesBesoins.${index}.designation`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Désignation"
                                    className="h-8"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lignesBesoins.${index}.quantite`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    className="h-8 text-center"
                                    onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <FormField
                            control={form.control}
                            name={`lignesBesoins.${index}.budgetise`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lignesBesoins.${index}.memoAccord`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Réf."
                                    className="h-8"
                                    disabled={form.getValues(`lignesBesoins.${index}.budgetise`)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {form.formState.errors.lignesBesoins?.root && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.lignesBesoins.root.message}
                </p>
              )}
            </div>

            <div className="mt-8">
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observations</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observations complémentaires..."
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-8">
              <div className="flex flex-col md:flex-row gap-2 justify-between items-start border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  <p>NB : Mentionner « 00 » au cas où l'achat n'est pas prévu et joindre le Memo adressé au DG</p>
                  <Badge variant="outline" className="mt-2">
                    Cette demande sera soumise pour approbation
                  </Badge>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Soumission..." : "Soumettre la demande"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}