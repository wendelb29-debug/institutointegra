import { Image, FileText, Play, Download } from 'lucide-react';
import { ChatMessage } from './types';
import { useSignedUrl } from '@/lib/storage';

interface MediaMessageProps {
  message: ChatMessage;
}

export const MediaMessage = ({ message }: MediaMessageProps) => {
  const resolvedUrl = useSignedUrl('whatsapp-media', message.mediaUrl);

  if (!message.mediaType || !message.mediaUrl) return null;
  if (!resolvedUrl) return null;

  const mediaUrl = resolvedUrl;

  switch (message.mediaType) {
    case 'image':

      return (
        <div className="rounded-lg overflow-hidden mb-1">
          <img
            src={mediaUrl}
            alt="Imagem"
            className="max-w-full max-h-64 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(mediaUrl, '_blank')}
          />
        </div>
      );

    case 'audio':
      return (
        <div className="mb-1">
          <audio controls className="max-w-full h-10" preload="none">
            <source src={mediaUrl} type={message.mediaMimeType || 'audio/mpeg'} />
          </audio>
        </div>
      );

    case 'document':
      return (
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors mb-1"
        >
          <FileText className="h-8 w-8 text-blue-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{message.mediaName || 'Documento'}</p>
            <p className="text-[10px] text-muted-foreground">{message.mediaMimeType || 'arquivo'}</p>
          </div>
          <Download className="h-4 w-4 text-muted-foreground shrink-0" />
        </a>
      );

    case 'video':
      return (
        <div className="rounded-lg overflow-hidden mb-1">
          <video controls className="max-w-full max-h-64 rounded-lg" preload="none">
            <source src={mediaUrl} type={message.mediaMimeType || 'video/mp4'} />
          </video>
        </div>
      );

    default:
      return null;
  }
};
