import { useState, useCallback, useMemo } from 'react';
import { Languages, ArrowLeftRight, Copy, Check, RotateCcw, History } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: '英语' }, { code: 'es', name: '西班牙语' }, { code: 'fr', name: '法语' },
  { code: 'de', name: '德语' }, { code: 'zh', name: '中文' }, { code: 'ja', name: '日语' },
  { code: 'ko', name: '韩语' }, { code: 'ar', name: '阿拉伯语' }, { code: 'ru', name: '俄语' },
  { code: 'pt', name: '葡萄牙语' }, { code: 'it', name: '意大利语' }, { code: 'hi', name: '印地语' },
];

const TRANSLATIONS: Record<string, Record<string, Record<string, string>>> = {
  en: {
    es: { 'hello': 'hola', 'goodbye': 'adios', 'thank you': 'gracias', 'please': 'por favor', 'yes': 'si', 'no': 'no', 'good morning': 'buenos dias', 'good night': 'buenas noches', 'how are you': 'como estas', 'i am fine': 'estoy bien', 'what is your name': 'como te llamas', 'my name is': 'mi nombre es', 'i love you': 'te quiero', 'welcome': 'bienvenido', 'sorry': 'lo siento', 'help': 'ayuda', 'water': 'agua', 'food': 'comida', 'the': 'el', 'is': 'es', 'are': 'son', 'i': 'yo', 'you': 'tu', 'we': 'nosotros', 'good': 'bueno', 'bad': 'malo', 'big': 'grande', 'small': 'pequeno', 'today': 'hoy', 'tomorrow': 'manana', 'yesterday': 'ayer', 'house': 'casa', 'friend': 'amigo', 'family': 'familia', 'love': 'amor', 'time': 'tiempo', 'day': 'dia', 'night': 'noche', 'morning': 'manana', 'beautiful': 'hermoso', 'happy': 'feliz', 'sad': 'triste', 'cat': 'gato', 'dog': 'perro', 'book': 'libro', 'music': 'musica' },
    fr: { 'hello': 'bonjour', 'goodbye': 'au revoir', 'thank you': 'merci', 'please': "s'il vous plait", 'yes': 'oui', 'no': 'non', 'good morning': 'bonjour', 'good night': 'bonne nuit', 'how are you': 'comment allez-vous', 'i am fine': 'je vais bien', 'my name is': "je m'appelle", 'i love you': "je t'aime", 'welcome': 'bienvenue', 'sorry': 'desole', 'help': 'aide', 'water': 'eau', 'food': 'nourriture', 'the': 'le', 'is': 'est', 'are': 'sont', 'i': 'je', 'you': 'vous', 'we': 'nous', 'good': 'bon', 'bad': 'mauvais', 'big': 'grand', 'small': 'petit', 'today': "aujourd'hui", 'tomorrow': 'demain', 'yesterday': 'hier', 'house': 'maison', 'friend': 'ami', 'family': 'famille', 'love': 'amour', 'beautiful': 'beau', 'happy': 'heureux', 'sad': 'triste', 'cat': 'chat', 'dog': 'chien', 'book': 'livre', 'music': 'musique' },
    de: { 'hello': 'hallo', 'goodbye': 'auf wiedersehen', 'thank you': 'danke', 'please': 'bitte', 'yes': 'ja', 'no': 'nein', 'good morning': 'guten morgen', 'good night': 'gute nacht', 'how are you': 'wie geht es ihnen', 'i am fine': 'mir geht es gut', 'my name is': 'mein name ist', 'i love you': 'ich liebe dich', 'welcome': 'willkommen', 'sorry': 'entschuldigung', 'help': 'hilfe', 'water': 'wasser', 'food': 'essen', 'good': 'gut', 'bad': 'schlecht', 'big': 'gross', 'small': 'klein', 'today': 'heute', 'tomorrow': 'morgen', 'yesterday': 'gestern', 'house': 'haus', 'friend': 'freund', 'family': 'familie', 'love': 'liebe', 'beautiful': 'schon', 'happy': 'glucklich', 'sad': 'traurig', 'cat': 'katze', 'dog': 'hund', 'book': 'buch', 'music': 'musik' },
    zh: { 'hello': '你好', 'goodbye': '再见', 'thank you': '谢谢', 'please': '请', 'yes': '是', 'no': '不', 'good morning': '早上好', 'good night': '晚安', 'how are you': '你好吗', 'i am fine': '我很好', 'my name is': '我的名字是', 'i love you': '我爱你', 'welcome': '欢迎', 'sorry': '对不起', 'help': '帮助', 'water': '水', 'food': '食物', 'is': '是', 'are': '是', 'i': '我', 'you': '你', 'we': '我们', 'good': '好', 'bad': '坏', 'big': '大', 'small': '小', 'today': '今天', 'tomorrow': '明天', 'yesterday': '昨天', 'house': '房子', 'friend': '朋友', 'family': '家庭', 'love': '爱', 'time': '时间', 'day': '天', 'night': '夜晚', 'morning': '早上', 'beautiful': '美丽', 'happy': '快乐', 'sad': '悲伤', 'cat': '猫', 'dog': '狗', 'book': '书', 'music': '音乐' },
    ja: { 'hello': 'こんにちは', 'goodbye': 'さようなら', 'thank you': 'ありがとう', 'please': 'お願いします', 'yes': 'はい', 'no': 'いいえ', 'good morning': 'おはようございます', 'good night': 'おやすみなさい', 'how are you': 'お元気ですか', 'i am fine': '元気です', 'my name is': '私の名前は', 'i love you': '愛しています', 'welcome': 'ようこそ', 'sorry': 'すみません', 'help': '助けて', 'water': '水', 'food': '食べ物', 'is': 'です', 'are': 'です', 'i': '私', 'you': 'あなた', 'we': '私たち', 'good': '良い', 'bad': '悪い', 'big': '大きい', 'small': '小さい', 'today': '今日', 'tomorrow': '明日', 'yesterday': '昨日', 'house': '家', 'friend': '友達', 'family': '家族', 'love': '愛', 'beautiful': '美しい', 'happy': '幸せ', 'sad': '悲しい', 'cat': '猫', 'dog': '犬', 'book': '本', 'music': '音楽' },
    ko: { 'hello': '안녕하세요', 'goodbye': '안녕히 가세요', 'thank you': '감사합니다', 'please': '부탁합니다', 'yes': '네', 'no': '아니요', 'good morning': '좋은 아침', 'good night': '좋은 밤', 'how are you': '어떻게 지내세요', 'i am fine': '잘 지내요', 'my name is': '제 이름은', 'i love you': '사랑해요', 'welcome': '환영합니다', 'sorry': '죄송합니다', 'help': '도와주세요', 'water': '물', 'food': '음식', 'good': '좋은', 'bad': '나쁜', 'big': '큰', 'small': '작은', 'today': '오늘', 'tomorrow': '내일', 'yesterday': '어제', 'house': '집', 'friend': '친구', 'family': '가족', 'love': '사랑', 'beautiful': '아름다운', 'happy': '행복한', 'sad': '슬픈', 'cat': '고양이', 'dog': '개', 'book': '책', 'music': '음악' },
    ar: { 'hello': 'مرحبا', 'goodbye': 'مع السلامة', 'thank you': 'شكرا', 'please': 'من فضلك', 'yes': 'نعم', 'no': 'لا', 'good morning': 'صباح الخير', 'good night': 'تصبح على خير', 'how are you': 'كيف حالك', 'i am fine': 'أنا بخير', 'my name is': 'اسمي', 'i love you': 'أحبك', 'welcome': 'مرحبا', 'sorry': 'آسف', 'help': 'مساعدة', 'water': 'ماء', 'food': 'طعام', 'good': 'جيد', 'bad': 'سيئ', 'big': 'كبير', 'small': 'صغير', 'today': 'اليوم', 'tomorrow': 'غدا', 'yesterday': 'أمس', 'house': 'بيت', 'friend': 'صديق', 'family': 'عائلة', 'love': 'حب', 'beautiful': 'جميل', 'happy': 'سعيد', 'sad': 'حزين', 'cat': 'قطة', 'dog': 'كلب', 'book': 'كتاب', 'music': 'موسيقى' },
    ru: { 'hello': 'привет', 'goodbye': 'до свидания', 'thank you': 'спасибо', 'please': 'пожалуйста', 'yes': 'да', 'no': 'нет', 'good morning': 'доброе утро', 'good night': 'спокойной ночи', 'how are you': 'как дела', 'i am fine': 'хорошо', 'my name is': 'меня зовут', 'i love you': 'я тебя люблю', 'welcome': 'добро пожаловать', 'sorry': 'извините', 'help': 'помощь', 'water': 'вода', 'food': 'еда', 'good': 'хороший', 'bad': 'плохой', 'big': 'большой', 'small': 'маленький', 'today': 'сегодня', 'tomorrow': 'завтра', 'yesterday': 'вчера', 'house': 'дом', 'friend': 'друг', 'family': 'семья', 'love': 'любовь', 'beautiful': 'красивый', 'happy': 'счастливый', 'sad': 'грустный', 'cat': 'кошка', 'dog': 'собака', 'book': 'книга', 'music': 'музыка' },
    pt: { 'hello': 'ola', 'goodbye': 'adeus', 'thank you': 'obrigado', 'please': 'por favor', 'yes': 'sim', 'no': 'nao', 'good morning': 'bom dia', 'good night': 'boa noite', 'how are you': 'como voce esta', 'i am fine': 'estou bem', 'my name is': 'meu nome e', 'i love you': 'eu te amo', 'welcome': 'bem-vindo', 'sorry': 'desculpe', 'help': 'ajuda', 'water': 'agua', 'food': 'comida', 'good': 'bom', 'bad': 'mau', 'big': 'grande', 'small': 'pequeno', 'today': 'hoje', 'tomorrow': 'amanha', 'yesterday': 'ontem', 'house': 'casa', 'friend': 'amigo', 'family': 'familia', 'love': 'amor', 'beautiful': 'bonito', 'happy': 'feliz', 'sad': 'triste', 'cat': 'gato', 'dog': 'cao', 'book': 'livro', 'music': 'musica' },
  },
};

function translateText(text: string, from: string, to: string): string {
  if (from === to) return text;
  const dict = TRANSLATIONS[from]?.[to] || {};
  const lower = text.toLowerCase().trim();
  if (dict[lower]) return dict[lower];
  const words = lower.split(/\s+/);
  return words.map(word => dict[word] || word).join(' ');
}

interface HistoryEntry {
  id: string;
  source: string;
  target: string;
  from: string;
  to: string;
}

export default function Translator({ windowId }: { windowId: string }) {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [sourceText, setSourceText] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const translatedText = useMemo(() => {
    if (!sourceText.trim()) return '';
    return translateText(sourceText, sourceLang, targetLang);
  }, [sourceText, sourceLang, targetLang]);

  const swapLanguages = useCallback(() => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    if (translatedText) setSourceText(translatedText);
  }, [sourceLang, targetLang, translatedText]);

  const copyTranslation = useCallback(() => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      setHistory(prev => [{ id: Date.now().toString(), source: sourceText, target: translatedText, from: sourceLang, to: targetLang }, ...prev].slice(0, 20));
    }
  }, [translatedText, sourceText, sourceLang, targetLang]);

  const getLangName = (code: string) => LANGUAGES.find(l => l.code === code)?.name || code;

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--bg-window)' }}>
        <div className="flex items-center gap-2">
          <Languages size={16} style={{ color: 'var(--accent-silver)' }} />
          <span className="font-medium text-[var(--text-primary)]">翻译器</span>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] hover:bg-[var(--bg-hover)]" style={{ color: history.length > 0 ? 'var(--accent-silver)' : 'var(--text-muted)' }}>
          <History size={12} /> 历史 ({history.length})
        </button>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} className="flex-1 px-2 py-1 rounded text-xs outline-none" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}>
          {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
        </select>
        <button onClick={swapLanguages} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors" style={{ color: 'var(--accent-silver)' }}>
          <ArrowLeftRight size={16} />
        </button>
        <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="flex-1 px-2 py-1 rounded text-xs outline-none" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}>
          {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
        </select>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col border-r" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <div className="px-3 py-1.5 text-[10px] border-b flex items-center justify-between" style={{ borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
                <span>{getLangName(sourceLang)}</span><span>{sourceText.length} 字符</span>
              </div>
              <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} placeholder="输入要翻译的文本..." className="flex-1 p-3 text-xs outline-none resize-none" style={{ background: 'transparent', color: 'var(--text-primary)' }} />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="px-3 py-1.5 text-[10px] border-b flex items-center justify-between" style={{ borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
                <span>{getLangName(targetLang)}</span><span>{translatedText.length} 字符</span>
              </div>
              <div className="flex-1 p-3 text-xs overflow-y-auto" style={{ color: 'var(--text-primary)' }}>
                {translatedText || <span style={{ color: 'var(--text-muted)' }}>翻译结果将在此显示...</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <button onClick={() => setSourceText('')} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
              <RotateCcw size={10} /> 清除
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sourceLang.toUpperCase()} → {targetLang.toUpperCase()}</span>
              <button onClick={copyTranslation} disabled={!translatedText} className="flex items-center gap-1 px-3 py-1 rounded text-[10px] font-medium text-white disabled:opacity-50" style={{ background: 'var(--accent-dark-gray)' }}>
                {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? '已复制！' : '复制'}
              </button>
            </div>
          </div>
        </div>
        {showHistory && (
          <div className="w-48 flex flex-col border-l" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <div className="px-2 py-1.5 text-[10px] font-medium border-b flex items-center justify-between" style={{ borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
              <span>历史</span><button onClick={() => setHistory([])} className="hover:text-[var(--text-secondary)]">清除</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? <p className="px-2 py-3 text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>暂无翻译记录</p> : history.map(entry => (
                <button key={entry.id} onClick={() => { setSourceLang(entry.from); setTargetLang(entry.to); setSourceText(entry.source); }} className="w-full text-left px-2 py-1.5 hover:bg-[var(--bg-hover)] border-b transition-colors" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                  <div className="text-[10px] truncate" style={{ color: 'var(--text-primary)' }}>{entry.source}</div>
                  <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{entry.target}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{entry.from.toUpperCase()} → {entry.to.toUpperCase()}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
