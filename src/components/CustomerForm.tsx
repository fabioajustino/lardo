import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, AtSign, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CustomerData {
  name: string;
  cpf: string;
  phone: string;
  instagram: string;
}

interface RatingData {
  foodQuality: number;
  service: number;
  waitTime: number;
  cleanliness: number;
  valueForMoney: number;
  ambiance: number;
  comment: string;
}

export const CustomerForm = () => {
  const { toast } = useToast();
  const [customer, setCustomer] = useState<CustomerData>({
    name: "",
    cpf: "",
    phone: "",
    instagram: ""
  });

  const [ratings, setRatings] = useState<RatingData>({
    foodQuality: 0,
    service: 0,
    waitTime: 0,
    cleanliness: 0,
    valueForMoney: 0,
    ambiance: 0,
    comment: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingCriteria = [
    { key: "foodQuality" as keyof RatingData, label: "Qualidade da Comida", required: true },
    { key: "service" as keyof RatingData, label: "Atendimento da Equipe", required: true },
    { key: "waitTime" as keyof RatingData, label: "Tempo de Espera", required: true },
    { key: "cleanliness" as keyof RatingData, label: "Higiene e Limpeza", required: true },
    { key: "valueForMoney" as keyof RatingData, label: "Custo-Benefício", required: true },
    { key: "ambiance" as keyof RatingData, label: "Ambiente e Conforto", required: true }
  ];

  const handleCustomerChange = (field: keyof CustomerData, value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  const handleRatingChange = (field: keyof RatingData, value: number | string) => {
    setRatings(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!customer.name || !customer.cpf || !customer.phone || !customer.instagram) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os dados pessoais.",
        variant: "destructive"
      });
      return false;
    }

    const missingRatings = ratingCriteria.filter(criteria => 
      typeof ratings[criteria.key] === 'number' && ratings[criteria.key] === 0
    );

    if (missingRatings.length > 0) {
      toast({
        title: "Avaliações obrigatórias",
        description: "Por favor, avalie todos os critérios com pelo menos 1 estrela.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('feedbacks').insert({
        nome: customer.name,
        cpf: customer.cpf,
        telefone: customer.phone,
        instagram: customer.instagram,
        qualidade_comida: ratings.foodQuality,
        atendimento: ratings.service,
        tempo_espera: ratings.waitTime,
        higiene_limpeza: ratings.cleanliness,
        custo_beneficio: ratings.valueForMoney,
        ambiente_conforto: ratings.ambiance,
        comentario: ratings.comment || null
      });

      if (error) throw error;
      
      toast({
        title: "Avaliação enviada com sucesso!",
        description: "Obrigado pelo seu feedback. Sua opinião é muito importante para nós.",
      });

      // Reset form
      setCustomer({ name: "", cpf: "", phone: "", instagram: "" });
      setRatings({
        foodQuality: 0,
        service: 0,
        waitTime: 0,
        cleanliness: 0,
        valueForMoney: 0,
        ambiance: 0,
        comment: ""
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Erro ao enviar avaliação",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Lardo - Bar e Sebo
        </h1>
        <p className="text-muted-foreground text-lg">
          Conta pra gente como foi sua aventura gastronômica 🍽️
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Information */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              Diz aí quem é você
            </CardTitle>
            <CardDescription>
              Precisamos de algumas informações para identificar sua avaliação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={customer.name}
                  onChange={(e) => handleCustomerChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={customer.cpf}
                    onChange={(e) => handleCustomerChange("cpf", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={customer.phone}
                    onChange={(e) => handleCustomerChange("phone", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram *</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="instagram"
                    type="text"
                    placeholder="@seu_usuario"
                    value={customer.instagram}
                    onChange={(e) => handleCustomerChange("instagram", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-primary">Avalie a Sua Experiência</CardTitle>
            <CardDescription>
              Dê uma nota de 1 a 5 estrelas para cada critério
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              {ratingCriteria.map((criteria) => (
                <div key={criteria.key} className="flex items-center justify-between">
                  <Label className="text-base font-medium min-w-0 flex-1">
                    {criteria.label}
                  </Label>
                  <StarRating
                    value={ratings[criteria.key] as number}
                    onChange={(value) => handleRatingChange(criteria.key, value)}
                    name={criteria.label}
                    size="md"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comentário Adicional</Label>
              <Textarea
                id="comment"
                placeholder="Conte-nos mais sobre sua experiência... (opcional)"
                value={ratings.comment}
                onChange={(e) => handleRatingChange("comment", e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          className="w-full h-12 text-lg font-semibold shadow-elegant"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
        </Button>
      </form>
    </div>
  );
};