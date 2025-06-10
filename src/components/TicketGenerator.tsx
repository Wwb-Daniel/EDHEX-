import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateTicketCode } from "@/utils/ticketUtils";
import { Plus, Sparkles, LogOut, RefreshCw, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TicketPreview from "./TicketPreview";

interface TicketData {
  student_name: string;
  guest_name: string | null;
  ticket_type: string;
  code: string;
  used: boolean;
  used_at: string | null;
  special_notes: string | null;
}

interface TicketGeneratorProps {
  student: any;
  onTicketGenerated: (ticket: TicketData) => void;
  onLogout: () => void;
}

const TicketGenerator = ({ student, onTicketGenerated, onLogout }: TicketGeneratorProps) => {
  const [guestName, setGuestName] = useState("");
  const [ticketType, setTicketType] = useState("familiar");
  const [specialNotes, setSpecialNotes] = useState("");
  const [generatedTicket, setGeneratedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [existingTickets, setExistingTickets] = useState<any[]>([]);
  const { toast } = useToast();

  const canGenerateMoreTickets = student.tickets_generated < student.max_tickets;

  // Map internal values to database values
  const ticketTypeNames = {
    graduado: "graduado",
    padrino: "padrino",
    familiar: "familiar"
  };

  // Cargar tickets existentes del estudiante
  const loadExistingTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('student_name', student.name);

      if (error) {
        console.error('Error loading existing tickets:', error);
        return;
      }

      setExistingTickets(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Cargar tickets existentes al montar el componente
  React.useEffect(() => {
    loadExistingTickets();
  }, [student.name]);

  const getTicketTypeCounts = () => {
    const counts = {
      graduado: 0,
      padrino: 0,
      familiar: 0
    };

    existingTickets.forEach(ticket => {
      // Convert database values back to internal values for counting
      const internalType = Object.keys(ticketTypeNames).find(
        key => ticketTypeNames[key] === ticket.ticket_type
      );
      if (internalType && counts.hasOwnProperty(internalType)) {
        counts[internalType]++;
      }
    });

    return counts;
  };

  const canGenerateTicketType = (type: string) => {
    const counts = getTicketTypeCounts();
    
    switch (type) {
      case 'graduado':
        return counts.graduado === 0;
      case 'padrino':
        return counts.padrino === 0;
      case 'familiar':
        return counts.familiar < 3;
      default:
        return false;
    }
  };

  const getTicketTypeDescription = (type: string) => {
    const counts = getTicketTypeCounts();
    
    switch (type) {
      case 'graduado':
        return counts.graduado > 0 ? "Ya generada" : "Disponible";
      case 'padrino':
        return counts.padrino > 0 ? "Ya generada" : "Disponible";
      case 'familiar':
        return `${counts.familiar}/3 generadas`;
      default:
        return "";
    }
  };

  const handleGenerateTicket = async () => {
    if (!canGenerateMoreTickets) {
      toast({
        title: "Límite alcanzado",
        description: `Ya has generado ${student.max_tickets} entradas (límite máximo)`,
        variant: "destructive",
      });
      return;
    }

    if (!canGenerateTicketType(ticketType)) {
      let message = "";
      switch (ticketType) {
        case 'graduado':
          message = "Ya tienes una entrada de graduado generada";
          break;
        case 'padrino':
          message = "Ya tienes una entrada de padrino generada";
          break;
        case 'familiar':
          message = "Ya has generado el máximo de 3 entradas familiares";
          break;
      }
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return;
    }

    if (ticketType === "familiar" && !guestName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el nombre del familiar",
        variant: "destructive",
      });
      return;
    }

    if (ticketType === "padrino" && !guestName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el nombre del padrino",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const ticket = {
        student_name: student.name,
        guest_name: ticketType === "graduado" ? null : guestName || null,
        ticket_type: ticketTypeNames[ticketType], // Use the mapped database value
        special_notes: specialNotes || null,
        code: generateTicketCode(student.name, Date.now()),
        used: false,
        used_at: null,
      };

      // Guardar en base de datos
      const { data, error } = await supabase
        .from('tickets')
        .insert([ticket])
        .select()
        .single();

      if (error) throw error;

      // Actualizar contador de tickets del estudiante
      await supabase
        .from('students')
        .update({ tickets_generated: student.tickets_generated + 1 })
        .eq('id', student.id);

      // Actualizar estado local del estudiante
      student.tickets_generated += 1;

      // Recargar tickets existentes
      await loadExistingTickets();

      // Crear ticket para preview
      const previewTicket = {
        ...data,
        id: data.id,
        createdAt: data.created_at,
        studentName: data.student_name,
        guestName: data.guest_name || (ticketType === "graduado" ? student.name : data.guest_name),
        ticketType: data.ticket_type,
        specialNotes: data.special_notes,
      };

      setGeneratedTicket(previewTicket);
      onTicketGenerated(data);

      toast({
        title: "¡Entrada generada! 🎉",
        description: `Entrada de ${ticketTypeNames[ticketType]} creada. Código: ${ticket.code}. Entradas restantes: ${student.max_tickets - student.tickets_generated}`,
      });

      // Reset form
      setGuestName("");
      setSpecialNotes("");
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la entrada",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setGuestName("");
    setSpecialNotes("");
    setGeneratedTicket(null);
  };

  const counts = getTicketTypeCounts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Generar Nueva Entrada
          </h2>
          <p className="text-white/70 text-sm sm:text-base">
            Bienvenido {student.name} - Entradas: {student.tickets_generated}/{student.max_tickets}
          </p>
        </div>
        <Button
          onClick={onLogout}
          variant="outline"
          className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white transition-all duration-300 w-full sm:w-auto"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Salir
        </Button>
      </div>

      {/* Resumen de entradas disponibles */}
      <Card className="glass-card p-4 sm:p-6">
        <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-400" />
          Resumen de Entradas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-400/30">
            <h4 className="text-yellow-200 font-medium text-sm">Graduado</h4>
            <p className="text-yellow-100 text-lg font-bold">{counts.graduado}/1</p>
            <p className="text-yellow-300 text-xs">{getTicketTypeDescription('graduado')}</p>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-400/30">
            <h4 className="text-purple-200 font-medium text-sm">Padrino</h4>
            <p className="text-purple-100 text-lg font-bold">{counts.padrino}/1</p>
            <p className="text-purple-300 text-xs">{getTicketTypeDescription('padrino')}</p>
          </div>
          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
            <h4 className="text-blue-200 font-medium text-sm">Familiares</h4>
            <p className="text-blue-100 text-lg font-bold">{counts.familiar}/3</p>
            <p className="text-blue-300 text-xs">{getTicketTypeDescription('familiar')}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Form */}
        <Card className="glass-card p-4 sm:p-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="type" className="text-white font-medium text-sm sm:text-base mb-3 block">
                Tipo de Entrada
              </Label>
              <Select value={ticketType} onValueChange={setTicketType}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    value="graduado" 
                    disabled={!canGenerateTicketType('graduado')}
                  >
                    🎓 Graduado {!canGenerateTicketType('graduado') && "(Ya generada)"}
                  </SelectItem>
                  <SelectItem 
                    value="padrino"
                    disabled={!canGenerateTicketType('padrino')}
                  >
                    👨‍🎓 Padrino {!canGenerateTicketType('padrino') && "(Ya generada)"}
                  </SelectItem>
                  <SelectItem 
                    value="familiar"
                    disabled={!canGenerateTicketType('familiar')}
                  >
                    👨‍👩‍👧‍👦 Familiar {!canGenerateTicketType('familiar') && "(Máximo alcanzado)"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(ticketType === "familiar" || ticketType === "padrino") && (
              <div>
                <Label htmlFor="guest" className="text-white font-medium text-sm sm:text-base mb-3 block">
                  {ticketType === "padrino" ? "Nombre del Padrino" : "Nombre del Familiar/Invitado"}
                </Label>
                <Input
                  id="guest"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={ticketType === "padrino" ? "Ej: Dr. Juan Pérez (Padrino)" : "Ej: María González (Mamá)"}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 text-base"
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes" className="text-white font-medium text-sm sm:text-base mb-3 block">
                Notas Especiales (Opcional)
              </Label>
              <Textarea
                id="notes"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Ej: Silla de ruedas, mesa especial, etc."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px] text-base resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleGenerateTicket}
                disabled={loading || !canGenerateMoreTickets || !canGenerateTicketType(ticketType)}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white h-12 text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                {loading ? "Generando..." : "Generar Entrada"}
              </Button>
              
              {generatedTicket && (
                <Button
                  onClick={resetForm}
                  className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 h-12 text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nueva Entrada
                </Button>
              )}
            </div>

            {!canGenerateMoreTickets && (
              <div className="p-4 bg-red-500/20 rounded-xl border border-red-500/30">
                <p className="text-red-300 text-center font-medium text-sm sm:text-base">
                  Has alcanzado el límite de {student.max_tickets} entradas
                </p>
              </div>
            )}

            {!canGenerateTicketType(ticketType) && canGenerateMoreTickets && (
              <div className="p-4 bg-orange-500/20 rounded-xl border border-orange-500/30">
                <p className="text-orange-300 text-center font-medium text-sm sm:text-base">
                  {ticketType === 'graduado' && "Ya tienes una entrada de graduado"}
                  {ticketType === 'padrino' && "Ya tienes una entrada de padrino"}
                  {ticketType === 'familiar' && "Ya has generado el máximo de 3 entradas familiares"}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Preview */}
        <div>
          {generatedTicket ? (
            <TicketPreview ticket={generatedTicket} />
          ) : (
            <Card className="glass-card p-6 sm:p-8 text-center h-full flex items-center justify-center min-h-[400px]">
              <div className="text-white/50">
                <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                <p className="text-base sm:text-lg">La vista previa de tu entrada aparecerá aquí</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketGenerator;