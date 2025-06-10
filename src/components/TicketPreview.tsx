import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Shield, Calendar, User, Ticket } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from 'qrcode';

interface TicketPreviewProps {
  ticket: {
    id?: number;
    student_name?: string;
    studentName?: string;
    guest_name?: string | null;
    guestName?: string;
    ticket_type?: string;
    ticketType?: string;
    code: string;
    created_at?: string;
    createdAt?: string;
    special_notes?: string | null;
    specialNotes?: string;
    used?: boolean;
  };
}

const TicketPreview = ({ ticket }: TicketPreviewProps) => {
  const downloadTicket = async () => {
    // Crear una imagen del ticket para descargar
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas con mayor resolución
    canvas.width = 1200;
    canvas.height =800;

    // Crear gradiente púrpura como en la app
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#10002B'); // purple-900
    gradient.addColorStop(0.25, '#240046'); // purple-800
    gradient.addColorStop(0.5, '#3C096C'); // purple-700
    gradient.addColorStop(0.75, '#5A189A'); // purple-600
    gradient.addColorStop(1, '#7B2CBF'); // purple-500
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Añadir elementos decorativos glassmorphism
    // Círculo decorativo superior derecho
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 100, 80, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Círculo decorativo inferior izquierdo
    ctx.beginPath();
    ctx.arc(100, canvas.height - 100, 60, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Configurar texto con fuente similar a la app
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    
    // Logo y título principal
    ctx.font = 'bold 48px Inter, Arial, sans-serif';
    ctx.fillText('🎓 EDHEX GRADUADOS 2025', 60, 100);
    
    // Subtítulo tipo de entrada
    ctx.font = 'bold 28px Inter, Arial, sans-serif';
    ctx.fillStyle = '#E0AAFF'; // purple-200
    ctx.fillText(`ENTRADA ${ticketType.toUpperCase()}`, 60, 140);

    // Línea decorativa
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 160);
    ctx.lineTo(canvas.width - 60, 160);
    ctx.stroke();

    // Información del graduando
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '20px Inter, Arial, sans-serif';
    ctx.fillText('GRADUANDO:', 60, 220);
    ctx.font = 'bold 32px Inter, Arial, sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(studentName, 60, 260);

    // Información del invitado
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '20px Inter, Arial, sans-serif';
    const guestLabel = ticketType === 'padrino' ? 'PADRINO:' : 
                      ticketType === 'graduado' ? 'GRADUANDO:' : 'INVITADO:';
    ctx.fillText(guestLabel, 60, 320);
    ctx.font = 'bold 32px Inter, Arial, sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(guestName, 60, 360);

    // Código único con fondo glassmorphism
    const codeBoxX = 60;
    const codeBoxY = 400;
    const codeBoxWidth = 500;
    const codeBoxHeight = 80;
    
    // Fondo del código con efecto glass
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(codeBoxX, codeBoxY, codeBoxWidth, codeBoxHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(codeBoxX, codeBoxY, codeBoxWidth, codeBoxHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '18px Inter, Arial, sans-serif';
    ctx.fillText('CÓDIGO ÚNICO:', codeBoxX + 20, codeBoxY + 30);
    ctx.font = 'bold 32px Courier, monospace';
    ctx.fillStyle = '#FFD700'; // Dorado para destacar
    ctx.fillText(ticket.code, codeBoxX + 20, codeBoxY + 65);

    // Fecha de generación
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '18px Inter, Arial, sans-serif';
    ctx.fillText(`Generado: ${formatDate(createdAt)}`, 60, 520);

    // Notas especiales si existen
    if (specialNotes) {
      ctx.fillText('NOTAS ESPECIALES:', 60, 570);
      ctx.font = 'bold 20px Inter, Arial, sans-serif';
      ctx.fillStyle = '#C77DFF'; // purple-300
      ctx.fillText(specialNotes, 60, 600);
    }

    // Área del QR Code con fondo glass
    const qrX = canvas.width - 280;
    const qrY = 200;
    const qrSize = 220;
    
    // Fondo glassmorphism para QR
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
    ctx.strokeStyle = 'rgba(123, 44, 191, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);

    // Texto del QR
    ctx.fillStyle = '#3C096C'; // purple-700
    ctx.font = 'bold 16px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('', qrX + qrSize/2, qrY - 35);
    ctx.fillText('🔒 CÓDIGO SEGURO', qrX + qrSize/2, qrY + qrSize + 50);

    // Advertencia de seguridad en la parte inferior
    const warningY = canvas.height - 80;
    
    // Fondo de advertencia
    ctx.fillStyle = 'rgba(255, 193, 7, 0.2)';
    ctx.fillRect(0, warningY - 20, canvas.width, 60);
    ctx.strokeStyle = 'rgba(255, 193, 7, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, warningY - 20, canvas.width, 60);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ ESTA ENTRADA ES ÚNICA E INTRANSFERIBLE - NO COMPARTIR EL CÓDIGO', canvas.width / 2, warningY + 10);

    // Logo EDHEX en esquina superior izquierda
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 16px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🎓 EDHEX', 20, 30);

    // QR Code real
    const qrDataUrl = await QRCode.toDataURL(ticket.code, { 
      width: qrSize, 
      margin: 1,
      color: {
        dark: '#3C096C',
        light: '#FFFFFF'
      }
    });
    
    const qrImg = new window.Image();
    qrImg.onload = function () {
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      
      // Descargar imagen
      const link = document.createElement('a');
      link.download = `entrada-${ticket.code}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    };
    qrImg.src = qrDataUrl;
  };

  const getTicketTypeColor = (type: string) => {
    switch (type) {
      case "graduado": return "from-yellow-400 to-orange-500";
      case "padrino": return "from-purple-400 to-purple-600";
      case "familiar": return "from-blue-400 to-purple-500";
      default: return "from-blue-400 to-purple-500";
    }
  };

  const getTicketTypeIcon = (type: string) => {
    switch (type) {
      case "graduado": return "🎓";
      case "padrino": return "👨‍🎓";
      case "familiar": return "👨‍👩‍👧‍👦";
      default: return "🎫";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Manejar tanto el formato viejo como el nuevo
  const studentName = ticket.student_name || ticket.studentName || '';
  const guestName = ticket.guest_name || ticket.guestName || 'Entrada General';
  const ticketType = ticket.ticket_type || ticket.ticketType || 'familiar';
  const createdAt = ticket.created_at || ticket.createdAt || new Date().toISOString();
  const specialNotes = ticket.special_notes || ticket.specialNotes;

  return (
    <div className="space-y-4">
      {/* Ticket Preview */}
      <Card className={`relative overflow-hidden bg-gradient-to-br ${getTicketTypeColor(ticketType)} p-6 text-white shadow-2xl`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 border-2 border-white rounded-full"></div>
        </div>

        {/* Ticket Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src="/image.png" 
                  alt="EDHEX Logo" 
                  className="w-8 h-8 object-contain"
                />
                <h3 className="text-2xl font-bold">EDHEX GRADUADOS 2025</h3>
              </div>
              <p className="opacity-80 text-sm uppercase tracking-wider flex items-center gap-2">
                {getTicketTypeIcon(ticketType)} Entrada {ticketType.toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <Shield className="w-6 h-6 mb-1" />
              <p className="text-xs opacity-80">VERIFICADO</p>
            </div>
          </div>

          {/* Main Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                <span className="text-sm opacity-80">Graduando</span>
              </div>
              <p className="font-semibold text-lg">{studentName}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-4 h-4" />
                <span className="text-sm opacity-80">
                  {ticketType === 'graduado' ? 'Graduando' : 
                   ticketType === 'padrino' ? 'Padrino' : 'Familiar'}
                </span>
              </div>
              <p className="font-semibold">
                {ticketType === 'graduado' ? studentName : guestName}
              </p>
            </div>
          </div>

          {/* QR Code and Code */}
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm opacity-80">Generado</span>
              </div>
              <p className="text-sm">{formatDate(createdAt)}</p>
              
              <div className="mt-3 p-2 bg-black/20 rounded-lg">
                <p className="text-xs opacity-80 mb-1">CÓDIGO ÚNICO</p>
                <p className="font-mono font-bold text-lg tracking-wider">{ticket.code}</p>
              </div>
            </div>
            
            <div className="text-center">
              <QRCodeSVG 
                value={ticket.code} 
                size={80}
                bgColor="transparent"
                fgColor="white"
                className="bg-white/20 p-2 rounded-lg"
              />
              <p className="text-xs mt-1 opacity-80">Escanear para validar</p>
            </div>
          </div>

          {/* Special Notes */}
          {specialNotes && (
            <div className="mt-4 p-3 bg-black/20 rounded-lg">
              <p className="text-xs opacity-80 mb-1">NOTAS ESPECIALES</p>
              <p className="text-sm">{specialNotes}</p>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs opacity-60 text-center">
              ⚠️ Esta entrada es única e intransferible. No compartas el código.
            </p>
          </div>
        </div>
      </Card>

      {/* Download Button */}
      <Button 
        onClick={downloadTicket}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
      >
        <Download className="w-4 h-4 mr-2" />
        Descargar Entrada como Imagen
      </Button>
    </div>
  );
};

export default TicketPreview;