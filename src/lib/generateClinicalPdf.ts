import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfessionalData {
  full_name: string;
  specialty: string;
  registration_number?: string;
  signature_url?: string;
}

interface PdfOptions {
  type: 'prontuario' | 'diagnostico';
  patientName: string;
  patientCpf?: string;
  professional: ProfessionalData;
  content: { date: string; text: string }[];
  diagnosisCid?: string;
}

function addHeader(doc: jsPDF, y: number): number {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text('Instituto Integra', 105, y, { align: 'center' });
  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Saude & Bem-estar | Documento Clinico', 105, y, { align: 'center' });
  y += 4;
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  return y + 8;
}

function addFooter(doc: jsPDF, page: number, total: number) {
  const y = 282;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`Emitido em ${format(new Date(), "dd/MM/yyyy 'as' HH:mm")} | Instituto Integra`, 20, y + 4);
  doc.text(`Pagina ${page}/${total}`, 190, y + 4, { align: 'right' });
  doc.text('Documento gerado eletronicamente. Sugestoes de IA requerem revisao profissional.', 105, y + 8, { align: 'center' });
}

async function loadImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateClinicalPdf(options: PdfOptions): Promise<Blob> {
  const { type, patientName, patientCpf, professional, content, diagnosisCid } = options;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 170;
  let currentPage = 1;

  let y = addHeader(doc, 20);

  // Document title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  const title = type === 'prontuario' ? 'PRONTUARIO CLINICO' : 'DIAGNOSTICO CLINICO';
  doc.text(title, 105, y, { align: 'center' });
  y += 10;

  // Patient info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Paciente:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(patientName, 45, y);
  if (patientCpf) {
    doc.text(`CPF: ${patientCpf}`, 140, y);
  }
  y += 6;

  // Professional info
  doc.setFont('helvetica', 'bold');
  doc.text('Profissional:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(professional.full_name, 50, y);
  y += 5;
  if (professional.specialty) {
    doc.text(`Especialidade: ${professional.specialty}`, 20, y);
    y += 5;
  }
  if (professional.registration_number) {
    doc.text(`Registro: ${professional.registration_number}`, 20, y);
    y += 5;
  }
  y += 3;

  doc.setDrawColor(220, 220, 220);
  doc.line(20, y, 190, y);
  y += 8;

  // CID for diagnosis
  if (type === 'diagnostico' && diagnosisCid) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`CID: ${diagnosisCid}`, 20, y);
    y += 8;
  }

  // Content
  for (const item of content) {
    if (y > 240) {
      addFooter(doc, currentPage, 1);
      doc.addPage();
      currentPage++;
      y = addHeader(doc, 20);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(59, 130, 246);
    const dateLabel = format(new Date(item.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    doc.text(dateLabel, 20, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(item.text, pageWidth);
    for (const line of lines) {
      if (y > 240) {
        addFooter(doc, currentPage, 1);
        doc.addPage();
        currentPage++;
        y = addHeader(doc, 20);
      }
      doc.text(line, 20, y);
      y += 5;
    }
    y += 4;
  }

  // Signature area
  if (y > 220) {
    addFooter(doc, currentPage, 1);
    doc.addPage();
    currentPage++;
    y = addHeader(doc, 20);
  }

  y += 10;
  doc.setDrawColor(100, 100, 100);
  doc.line(60, y, 150, y);
  y += 5;

  // Try to load signature image
  if (professional.signature_url) {
    const sigData = await loadImage(professional.signature_url);
    if (sigData) {
      doc.addImage(sigData, 'PNG', 75, y - 30, 60, 22);
    }
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 46);
  doc.text(professional.full_name, 105, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const subtitle = [professional.specialty, professional.registration_number].filter(Boolean).join(' - ');
  if (subtitle) doc.text(subtitle, 105, y, { align: 'center' });

  // Update footers with correct total pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  return doc.output('blob');
}
