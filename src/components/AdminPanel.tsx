import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Star, TrendingDown, TrendingUp, Users, MessageSquare, Download, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  id: string;
  created_at: string;
  nome: string;
  cpf: string;
  telefone: string;
  instagram: string;
  qualidade_comida: number;
  atendimento: number;
  tempo_espera: number;
  higiene_limpeza: number;
  custo_beneficio: number;
  ambiente_conforto: number;
  comentario: string;
}

const criteriaMapping = {
  qualidade_comida: "Qualidade da Comida",
  atendimento: "Atendimento",
  tempo_espera: "Tempo de Espera", 
  higiene_limpeza: "Higiene e Limpeza",
  custo_beneficio: "Custo-Benefício",
  ambiente_conforto: "Ambiente e Conforto"
};

export const AdminPanel = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "best" | "worst">("recent");
  const [minRatingFilter, setMinRatingFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedbacks();
    
    // Real-time subscription
    const channel = supabase
      .channel('feedbacks-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedbacks' }, (payload) => {
        console.log('New feedback received:', payload);
        setFeedbacks(prev => [payload.new as Feedback, ...prev]);
        toast({
          title: "Nova avaliação recebida!",
          description: `${(payload.new as Feedback).nome} enviou uma nova avaliação.`,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast({
        title: "Erro ao carregar avaliações",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAverages = () => {
    if (feedbacks.length === 0) return {};
    
    const totals = feedbacks.reduce((acc, feedback) => ({
      qualidade_comida: acc.qualidade_comida + feedback.qualidade_comida,
      atendimento: acc.atendimento + feedback.atendimento,
      tempo_espera: acc.tempo_espera + feedback.tempo_espera,
      higiene_limpeza: acc.higiene_limpeza + feedback.higiene_limpeza,
      custo_beneficio: acc.custo_beneficio + feedback.custo_beneficio,
      ambiente_conforto: acc.ambiente_conforto + feedback.ambiente_conforto,
    }), {
      qualidade_comida: 0,
      atendimento: 0,
      tempo_espera: 0,
      higiene_limpeza: 0,
      custo_beneficio: 0,
      ambiente_conforto: 0,
    });

    const averages = Object.fromEntries(
      Object.entries(totals).map(([key, value]) => [key, value / feedbacks.length])
    );

    return averages;
  };

  const getWorstAndBestCriteria = () => {
    const averages = calculateAverages();
    const entries = Object.entries(averages);
    
    if (entries.length === 0) return { worst: null, best: null };
    
    const worst = entries.reduce((min, current) => 
      current[1] < min[1] ? current : min
    );
    const best = entries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );

    return {
      worst: { name: criteriaMapping[worst[0] as keyof typeof criteriaMapping], score: worst[1] },
      best: { name: criteriaMapping[best[0] as keyof typeof criteriaMapping], score: best[1] }
    };
  };

  const getRecurrentCustomers = () => {
    const cpfCounts = feedbacks.reduce((acc, feedback) => {
      acc[feedback.cpf] = (acc[feedback.cpf] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const recurrentCount = Object.values(cpfCounts).filter(count => count > 1).length;
    return Math.round((recurrentCount / Object.keys(cpfCounts).length) * 100) || 0;
  };

  const getRatingDistribution = () => {
    const distribution = Array.from({ length: 5 }, (_, i) => ({ rating: i + 1, count: 0 }));
    
    feedbacks.forEach(feedback => {
      const avgRating = Math.round((
        feedback.qualidade_comida + feedback.atendimento + feedback.tempo_espera +
        feedback.higiene_limpeza + feedback.custo_beneficio + feedback.ambiente_conforto
      ) / 6);
      
      if (avgRating >= 1 && avgRating <= 5) {
        distribution[avgRating - 1].count++;
      }
    });

    return distribution;
  };

  const getCriteriaChartData = () => {
    const averages = calculateAverages();
    return Object.entries(averages).map(([key, value]) => ({
      criteria: criteriaMapping[key as keyof typeof criteriaMapping],
      score: Number(value.toFixed(1))
    }));
  };

  const filteredAndSortedFeedbacks = () => {
    let filtered = feedbacks;
    
    if (minRatingFilter !== "all") {
      const minRating = Number(minRatingFilter);
      filtered = feedbacks.filter(feedback => {
        const avgRating = (
          feedback.qualidade_comida + feedback.atendimento + feedback.tempo_espera +
          feedback.higiene_limpeza + feedback.custo_beneficio + feedback.ambiente_conforto
        ) / 6;
        return avgRating >= minRating;
      });
    }

    return filtered.sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      const avgA = (a.qualidade_comida + a.atendimento + a.tempo_espera + a.higiene_limpeza + a.custo_beneficio + a.ambiente_conforto) / 6;
      const avgB = (b.qualidade_comida + b.atendimento + b.tempo_espera + b.higiene_limpeza + b.custo_beneficio + b.ambiente_conforto) / 6;
      
      return sortBy === "best" ? avgB - avgA : avgA - avgB;
    });
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'CPF', 'Telefone', 'Instagram', 'Data', 'Qualidade Comida', 'Atendimento', 'Tempo Espera', 'Higiene', 'Custo-Benefício', 'Ambiente', 'Comentário'];
    const csvContent = [
      headers.join(','),
      ...feedbacks.map(feedback => [
        feedback.nome,
        feedback.cpf,
        feedback.telefone,
        feedback.instagram,
        new Date(feedback.created_at).toLocaleDateString('pt-BR'),
        feedback.qualidade_comida,
        feedback.atendimento,
        feedback.tempo_espera,
        feedback.higiene_limpeza,
        feedback.custo_beneficio,
        feedback.ambiente_conforto,
        `"${feedback.comentario?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `avaliacoes_lardo_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Exportação concluída!",
      description: "Arquivo CSV baixado com sucesso.",
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const averages = calculateAverages();
  const { worst, best } = getWorstAndBestCriteria();
  const recurrentPercentage = getRecurrentCustomers();
  const overallAverage = Object.values(averages).length ? 
    Object.values(averages).reduce((sum, avg) => sum + avg, 0) / Object.values(averages).length : 0;

  const COLORS = ['#A72026', '#D73F47', '#E85A64', '#F07A82', '#F899A0'];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{feedbacks.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nota Média Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">{overallAverage.toFixed(1)}</div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < Math.round(overallAverage) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} 
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Recorrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold text-primary">{recurrentPercentage}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Melhor Critério</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium">{best?.name}</div>
              <Badge variant="secondary">{best?.score.toFixed(1)}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Notas</CardTitle>
            <CardDescription>Quantidade de avaliações por faixa de nota</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getRatingDistribution()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  nameKey="rating"
                >
                  {getRatingDistribution().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} avaliações`, `${name} estrelas`]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Média por Critério</CardTitle>
            <CardDescription>Desempenho de cada critério avaliado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getCriteriaChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="criteria" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="score" fill="#A72026" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {worst && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Ponto de Melhoria Identificado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              <strong>{worst.name}</strong> foi o critério com menor pontuação média ({worst.score.toFixed(1)} estrelas). 
              Considere focar melhorias nesta área para aumentar a satisfação geral.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista de Avaliações ({filteredAndSortedFeedbacks().length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={sortBy} onValueChange={(value: "recent" | "best" | "worst") => setSortBy(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais Recentes</SelectItem>
                  <SelectItem value="best">Melhores</SelectItem>
                  <SelectItem value="worst">Piores</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={minRatingFilter} onValueChange={setMinRatingFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as notas</SelectItem>
                  <SelectItem value="1">Nota ≥ 1</SelectItem>
                  <SelectItem value="2">Nota ≥ 2</SelectItem>
                  <SelectItem value="3">Nota ≥ 3</SelectItem>
                  <SelectItem value="4">Nota ≥ 4</SelectItem>
                  <SelectItem value="5">Nota = 5</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAndSortedFeedbacks().map((feedback) => {
              const avgRating = (
                feedback.qualidade_comida + feedback.atendimento + feedback.tempo_espera +
                feedback.higiene_limpeza + feedback.custo_beneficio + feedback.ambiente_conforto
              ) / 6;
              
              const isNegative = avgRating <= 3;

              return (
                <Card key={feedback.id} className={`${isNegative ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{feedback.nome}</h4>
                          <Badge variant="outline">@{feedback.instagram}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {Object.entries(criteriaMapping).map(([key, label]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">{label}:</span>
                              <div className="flex items-center gap-1">
                                <span>{feedback[key as keyof typeof feedback]}</span>
                                <Star className="h-3 w-3 fill-primary text-primary" />
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {feedback.comentario && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <p className="text-sm">{feedback.comentario}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{avgRating.toFixed(1)}</div>
                        <div className="flex justify-end">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < Math.round(avgRating) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredAndSortedFeedbacks().length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma avaliação encontrada com os filtros selecionados.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};