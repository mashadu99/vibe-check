interface Props {
  onSelect: (text: string) => void;
}

const QUICK_ACTIONS = [
  { emoji: "🧊", label: "מייבש/ת אותי?", prompt: "רוצה לדעת אם מישהו מייבש אותי בשיחה" },
  { emoji: "💬", label: "מה לענות?", prompt: "עזרי לי לגבש תשובה לשיחה שיש לי" },
  { emoji: "📖", label: "ניתוח שיחה", prompt: "רוצה שתנתחי לי שיחה שלמה ותגידי מה הוויב" },
  { emoji: "🚩", label: "Red flags?", prompt: "רוצה לדעת אם יש red flags במישהו שאני מדבר/ת איתו" },
  { emoji: "💌", label: "פתיחת שיחה", prompt: "עזרי לי לפתוח שיחה עם מישהו שאני אוהב/ת" },
  { emoji: "🤐", label: "האם לענות?", prompt: "אני לא בטוח/ה אם לענות, עזרי לי להחליט" },
];

export default function QuickActions({ onSelect }: Props) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2 text-center">בחר/י נושא להתחיל</p>
      <div className="grid grid-cols-3 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onSelect(action.prompt)}
            className="flex flex-col items-center gap-1 bg-brand-card border border-brand-border rounded-xl px-2 py-3 text-xs text-gray-300 hover:border-brand-purple hover:text-white transition-all"
          >
            <span className="text-xl">{action.emoji}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
