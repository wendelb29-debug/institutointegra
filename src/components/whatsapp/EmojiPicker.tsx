import { useState, useRef, useEffect } from 'react';

const EMOJI_LIST = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊',
  '😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋',
  '😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🤫','🤔',
  '🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄',
  '😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕',
  '🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸',
  '😎','🤓','🧐','😕','🫤','😟','🙁','☹️','😮','😯',
  '😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢',
  '😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤',
  '👍','👎','👏','🙏','🤝','💪','❤️','🔥','⭐','✅',
  '💯','🎉','🎊','💬','📞','📅','⏰','🏥','💊','🩺',
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker = ({ onSelect, onClose }: EmojiPickerProps) => {
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-14 left-0 z-50 w-72 rounded-xl border border-border bg-card shadow-lg p-3"
    >
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {EMOJI_LIST.map(emoji => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-lg transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
