import { useState, useRef } from 'react';
import { Image, FileText, Mic, X } from 'lucide-react';

interface AttachmentMenuProps {
  onFileSelected: (file: File, type: 'image' | 'audio' | 'document') => void;
  onClose: () => void;
}

export const AttachmentMenu = ({ onFileSelected, onClose }: AttachmentMenuProps) => {
  const imageRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio' | 'document') => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file, type);
      onClose();
    }
  };

  const items = [
    { label: 'Imagem', icon: Image, color: 'text-violet-500 bg-violet-500/10', ref: imageRef, accept: 'image/*' },
    { label: 'Áudio', icon: Mic, color: 'text-orange-500 bg-orange-500/10', ref: audioRef, accept: 'audio/*' },
    { label: 'Documento', icon: FileText, color: 'text-blue-500 bg-blue-500/10', ref: docRef, accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv' },
  ];

  return (
    <div className="absolute bottom-14 left-10 z-50 rounded-xl border border-border bg-card shadow-lg p-2 flex gap-2">
      {items.map(item => (
        <div key={item.label}>
          <input
            ref={item.ref}
            type="file"
            accept={item.accept}
            className="hidden"
            onChange={e => handleFile(e, item.label.toLowerCase() as any)}
          />
          <button
            onClick={() => item.ref.current?.click()}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-muted transition-colors`}
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
};
