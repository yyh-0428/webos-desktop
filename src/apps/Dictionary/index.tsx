import { useState, useCallback, useMemo } from 'react';
import { Search, BookOpen, Bookmark, BookmarkCheck, Star, RotateCcw, X } from 'lucide-react';

interface WordEntry {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definitions: { definition: string; example?: string }[];
  synonyms: string[];
  antonyms: string[];
}

const DICTIONARY: WordEntry[] = [
  { word: 'abandon', phonetic: '/əˈbændən/', partOfSpeech: 'verb', definitions: [
    { definition: 'To leave completely and finally; forsake utterly', example: 'He abandoned his family.' },
    { definition: 'To give up; discontinue; withdraw from', example: 'They abandoned the project due to lack of funding.' },
    { definition: 'To yield (oneself) without restraint or moderation', example: 'She abandoned herself to grief.' },
  ], synonyms: ['desert', 'forsake', 'leave', 'relinquish'], antonyms: ['keep', 'maintain', 'retain'] },
  { word: 'beautiful', phonetic: '/ˈbjuːtɪfəl/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Having beauty; possessing qualities that give great pleasure', example: 'A beautiful sunset.' },
    { definition: 'Excellent of its kind', example: 'A beautiful shot from the midfielder.' },
    { definition: 'Wonderful; very pleasing or satisfying', example: 'What a beautiful day!' },
  ], synonyms: ['attractive', 'gorgeous', 'stunning', 'lovely'], antonyms: ['ugly', 'hideous', 'unattractive'] },
  { word: 'calculate', phonetic: '/ˈkælkjʊleɪt/', partOfSpeech: 'verb', definitions: [
    { definition: 'To determine by mathematical methods; compute', example: 'Calculate the total cost.' },
    { definition: 'To ascertain by reasoning; estimate', example: 'We calculated the risks involved.' },
  ], synonyms: ['compute', 'figure', 'reckon', 'determine'], antonyms: ['guess', 'estimate'] },
  { word: 'demonstrate', phonetic: '/ˈdemənstreɪt/', partOfSpeech: 'verb', definitions: [
    { definition: 'To make evident or establish by arguments or reasoning', example: 'The experiment demonstrated the theory.' },
    { definition: 'To describe, explain, or illustrate by examples', example: 'Let me demonstrate how this works.' },
  ], synonyms: ['show', 'prove', 'illustrate', 'display'], antonyms: ['conceal', 'hide', 'obscure'] },
  { word: 'eloquent', phonetic: '/ˈeləkwənt/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Fluent, persuasive, and forceful in speech or writing', example: 'An eloquent speaker.' },
    { definition: 'Clearly expressing or indicating something', example: 'An eloquent gesture of goodwill.' },
  ], synonyms: ['articulate', 'expressive', 'fluent', 'persuasive'], antonyms: ['inarticulate', 'tongue-tied'] },
  { word: 'fascinate', phonetic: '/ˈfæsɪneɪt/', partOfSpeech: 'verb', definitions: [
    { definition: 'To attract and hold attentively by a unique power', example: 'The magician fascinated the audience.' },
    { definition: 'To arouse the interest or curiosity of', example: 'The mystery fascinated her.' },
  ], synonyms: ['captivate', 'enchant', 'mesmerize', 'enthrall'], antonyms: ['bore', 'repel'] },
  { word: 'generous', phonetic: '/ˈdʒenərəs/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Liberal in giving or sharing; unselfish', example: 'A generous donation to charity.' },
    { definition: 'Larger, more ample, or more lavish than usual', example: 'A generous portion of food.' },
  ], synonyms: ['charitable', 'giving', 'liberal', 'munificent'], antonyms: ['selfish', 'stingy', 'miserly'] },
  { word: 'hypothesis', phonetic: '/haɪˈpɒθɪsɪs/', partOfSpeech: 'noun', definitions: [
    { definition: 'A proposition assumed as a premise in an argument', example: 'The hypothesis was supported by evidence.' },
    { definition: 'A tentative assumption made to draw out and test its logical consequences', example: 'Scientists tested the hypothesis through experiments.' },
  ], synonyms: ['theory', 'thesis', 'assumption', 'proposition'], antonyms: ['fact', 'proof', 'certainty'] },
  { word: 'innovative', phonetic: '/ˈɪnəveɪtɪv/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Tending to innovate; introducing new methods or ideas', example: 'An innovative approach to solving problems.' },
    { definition: 'Characterized by originality and creativity', example: 'The innovative design won several awards.' },
  ], synonyms: ['creative', 'inventive', 'original', 'pioneering'], antonyms: ['conventional', 'traditional'] },
  { word: 'juxtapose', phonetic: '/ˌdʒʌkstəˈpəʊz/', partOfSpeech: 'verb', definitions: [
    { definition: 'To place close together for contrasting effect', example: 'The artist juxtaposed dark and light colors.' },
  ], synonyms: ['compare', 'contrast', 'set beside'], antonyms: ['separate', 'isolate'] },
  { word: 'knowledge', phonetic: '/ˈnɒlɪdʒ/', partOfSpeech: 'noun', definitions: [
    { definition: 'Acquaintance with facts, truths, or principles', example: 'Knowledge is power.' },
    { definition: 'The body of truths or facts accumulated in the course of time', example: 'Scientific knowledge has expanded rapidly.' },
  ], synonyms: ['understanding', 'wisdom', 'learning', 'expertise'], antonyms: ['ignorance', 'inexperience'] },
  { word: 'luminous', phonetic: '/ˈluːmɪnəs/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Radiating or reflecting light; shining; bright', example: 'The luminous moon lit up the night.' },
    { definition: 'Clear; readily intelligible', example: 'A luminous explanation of the theory.' },
  ], synonyms: ['bright', 'radiant', 'glowing', 'brilliant'], antonyms: ['dark', 'dim', 'dull'] },
  { word: 'meticulous', phonetic: '/mɪˈtɪkjʊləs/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Taking or showing extreme care about minute details; precise', example: 'A meticulous researcher.' },
    { definition: 'Excessively concerned with details; overly careful', example: 'She was meticulous about her appearance.' },
  ], synonyms: ['thorough', 'careful', 'precise', 'scrupulous'], antonyms: ['careless', 'sloppy', 'negligent'] },
  { word: 'nostalgia', phonetic: '/nɒˈstældʒə/', partOfSpeech: 'noun', definitions: [
    { definition: 'A sentimental longing or wistful affection for the past', example: 'Nostalgia for his college days.' },
  ], synonyms: ['longing', 'yearning', 'wistfulness'], antonyms: ['anticipation', 'indifference'] },
  { word: 'obfuscate', phonetic: '/ˈɒbfʌskeɪt/', partOfSpeech: 'verb', definitions: [
    { definition: 'To make unclear or unintelligible; to darken', example: 'The jargon obfuscated the meaning.' },
    { definition: 'To bewilder; perplex', example: 'His explanation only obfuscated the issue further.' },
  ], synonyms: ['confuse', 'obscure', 'muddle', 'complicate'], antonyms: ['clarify', 'illuminate', 'explain'] },
  { word: 'perseverance', phonetic: '/ˌpɜːsɪˈvɪərəns/', partOfSpeech: 'noun', definitions: [
    { definition: 'Steady persistence in a course of action; steadfastness', example: 'His perseverance paid off in the end.' },
    { definition: 'Continued effort to achieve something despite difficulty', example: 'Success requires perseverance.' },
  ], synonyms: ['determination', 'persistence', 'tenacity', 'resolve'], antonyms: ['laziness', 'apathy', 'surrender'] },
  { word: 'quintessential', phonetic: '/ˌkwɪntɪˈsenʃəl/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Representing the most perfect or typical example', example: 'The quintessential British pub.' },
  ], synonyms: ['classic', 'ideal', 'perfect', 'ultimate'], antonyms: ['atypical', 'uncharacteristic'] },
  { word: 'resilient', phonetic: '/rɪˈzɪlɪənt/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Springing back; rebounding', example: 'A resilient rubber ball.' },
    { definition: 'Recovering readily from illness, depression, adversity', example: 'Children are remarkably resilient.' },
  ], synonyms: ['tough', 'flexible', 'adaptable', 'strong'], antonyms: ['fragile', 'vulnerable', 'weak'] },
  { word: 'serendipity', phonetic: '/ˌserənˈdɪpɪti/', partOfSpeech: 'noun', definitions: [
    { definition: 'An aptitude for making desirable discoveries by accident', example: 'The discovery was pure serendipity.' },
  ], synonyms: ['chance', 'luck', 'fortune', 'providence'], antonyms: ['misfortune', 'design', 'plan'] },
  { word: 'transcend', phonetic: '/trænˈsend/', partOfSpeech: 'verb', definitions: [
    { definition: 'To rise above or go beyond; overpass; exceed', example: 'Her performance transcended expectations.' },
    { definition: 'To surpass; be superior to', example: 'Art transcends cultural boundaries.' },
  ], synonyms: ['surpass', 'exceed', 'rise above', 'outstrip'], antonyms: ['fall short', 'fail'] },
  { word: 'ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Present, appearing, or found everywhere', example: 'Smartphones are ubiquitous in modern life.' },
  ], synonyms: ['omnipresent', 'pervasive', 'universal'], antonyms: ['rare', 'scarce', 'uncommon'] },
  { word: 'vulnerable', phonetic: '/ˈvʌlnərəbəl/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Capable of or susceptible to being wounded or hurt', example: 'Vulnerable to attack.' },
    { definition: 'Exposed to the possibility of being attacked or harmed', example: 'Children are particularly vulnerable.' },
  ], synonyms: ['susceptible', 'exposed', 'defenseless'], antonyms: ['invulnerable', 'protected', 'strong'] },
  { word: 'whimsical', phonetic: '/ˈwɪmzɪkəl/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Given to whimsy; fanciful; capricious', example: 'A whimsical story about talking animals.' },
    { definition: 'Amusingly odd; fancifully playful', example: 'Whimsical decorations in the garden.' },
  ], synonyms: ['playful', 'fanciful', 'quirky', 'capricious'], antonyms: ['serious', 'practical', 'conventional'] },
  { word: 'yearning', phonetic: '/ˈjɜːnɪŋ/', partOfSpeech: 'noun', definitions: [
    { definition: 'A deep, often melancholy longing; an intense desire', example: 'A yearning for adventure.' },
  ], synonyms: ['longing', 'craving', 'desire', 'hunger'], antonyms: ['satisfaction', 'contentment'] },
  { word: 'zealous', phonetic: '/ˈzeləs/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Filled with or inspired by intense enthusiasm or zeal', example: 'A zealous supporter of the cause.' },
  ], synonyms: ['enthusiastic', 'fervent', 'passionate', 'ardent'], antonyms: ['apathetic', 'indifferent', 'lukewarm'] },
  { word: 'algorithm', phonetic: '/ˈælɡərɪðəm/', partOfSpeech: 'noun', definitions: [
    { definition: 'A set of rules for solving a problem in a finite number of steps', example: 'The search algorithm found the answer quickly.' },
  ], synonyms: ['procedure', 'process', 'method', 'formula'], antonyms: [] },
  { word: 'benevolent', phonetic: '/bɪˈnevələnt/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Desiring to help others; charitable', example: 'A benevolent organization.' },
  ], synonyms: ['kind', 'charitable', 'generous', 'compassionate'], antonyms: ['malevolent', 'cruel', 'hostile'] },
  { word: 'catalyst', phonetic: '/ˈkætəlɪst/', partOfSpeech: 'noun', definitions: [
    { definition: 'A substance that causes or accelerates a chemical reaction', example: 'Platinum acts as a catalyst.' },
    { definition: 'A person or thing that precipitates an event or change', example: 'She was the catalyst for reform.' },
  ], synonyms: ['stimulus', 'trigger', 'spark', 'impetus'], antonyms: ['inhibitor', 'suppressant'] },
  { word: 'diligent', phonetic: '/ˈdɪlɪdʒənt/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Constant in effort to accomplish something; attentive and persistent', example: 'A diligent student.' },
  ], synonyms: ['industrious', 'hardworking', 'assiduous', 'thorough'], antonyms: ['lazy', 'idle', 'negligent'] },
  { word: 'ephemeral', phonetic: '/ɪˈfemərəl/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Lasting a very short time; transitory; fleeting', example: 'Ephemeral pleasures.' },
  ], synonyms: ['transient', 'fleeting', 'momentary', 'brief'], antonyms: ['permanent', 'enduring', 'eternal'] },
  { word: 'paradigm', phonetic: '/ˈpærədaɪm/', partOfSpeech: 'noun', definitions: [
    { definition: 'A typical example or pattern of something; a model', example: 'A new paradigm for education.' },
  ], synonyms: ['model', 'pattern', 'example', 'standard'], antonyms: [] },
  { word: 'pragmatic', phonetic: '/præɡˈmætɪk/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Dealing with things sensibly and realistically', example: 'A pragmatic approach to the problem.' },
  ], synonyms: ['practical', 'realistic', 'sensible'], antonyms: ['idealistic', 'impractical', 'theoretical'] },
  { word: 'rhetoric', phonetic: '/ˈretərɪk/', partOfSpeech: 'noun', definitions: [
    { definition: 'The art of effective or persuasive speaking or writing', example: 'The power of rhetoric.' },
  ], synonyms: ['eloquence', 'oratory', 'persuasion', 'discourse'], antonyms: [] },
  { word: 'synergy', phonetic: '/ˈsɪnədʒi/', partOfSpeech: 'noun', definitions: [
    { definition: 'The interaction of elements that when combined produce a total effect greater than the sum', example: 'The synergy between the two companies.' },
  ], synonyms: ['cooperation', 'collaboration', 'harmony', 'unity'], antonyms: ['discord', 'conflict', 'opposition'] },
  { word: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Open to more than one interpretation; not having one obvious meaning', example: 'An ambiguous statement.' },
  ], synonyms: ['vague', 'unclear', 'equivocal', 'indefinite'], antonyms: ['clear', 'definite', 'unambiguous'] },
  { word: 'conundrum', phonetic: '/kəˈnʌndrəm/', partOfSpeech: 'noun', definitions: [
    { definition: 'A confusing and difficult problem or question', example: 'The conundrum of consciousness.' },
  ], synonyms: ['puzzle', 'enigma', 'mystery', 'riddle'], antonyms: ['solution', 'answer'] },
  { word: 'endeavor', phonetic: '/ɪnˈdevər/', partOfSpeech: 'noun', definitions: [
    { definition: 'An earnest attempt or effort', example: 'A worthwhile endeavor.' },
  ], synonyms: ['effort', 'attempt', 'enterprise', 'undertaking'], antonyms: ['inaction', 'idleness'] },
  { word: 'fortuitous', phonetic: '/fɔːˈtjuːɪtəs/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Happening by accident or chance', example: 'A fortuitous meeting.' },
  ], synonyms: ['accidental', 'chance', 'lucky', 'fortunate'], antonyms: ['planned', 'deliberate'] },
  { word: 'gregarious', phonetic: '/ɡrɪˈɡeərɪəs/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Fond of company; sociable', example: 'A gregarious person who loves parties.' },
  ], synonyms: ['sociable', 'outgoing', 'friendly', 'convivial'], antonyms: ['introverted', 'solitary', 'reclusive'] },
  { word: 'loquacious', phonetic: '/ləˈkweɪʃəs/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Tending to talk a great deal; talkative', example: 'A loquacious host.' },
  ], synonyms: ['talkative', 'garrulous', 'chatty', 'verbose'], antonyms: ['taciturn', 'quiet', 'reserved'] },
  { word: 'nefarious', phonetic: '/nɪˈfeərɪəs/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Wicked in the extreme; abominable', example: 'Nefarious activities.' },
  ], synonyms: ['wicked', 'evil', 'villainous', 'sinister'], antonyms: ['virtuous', 'righteous', 'noble'] },
  { word: 'sanguine', phonetic: '/ˈsæŋɡwɪn/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Optimistic or positive, especially in a difficult situation', example: 'She remained sanguine despite the setbacks.' },
  ], synonyms: ['optimistic', 'hopeful', 'positive', 'confident'], antonyms: ['pessimistic', 'gloomy', 'despondent'] },
  { word: 'vacillate', phonetic: '/ˈvæsɪleɪt/', partOfSpeech: 'verb', definitions: [
    { definition: 'To alternate or waver between different opinions or actions', example: 'She vacillated between accepting and declining.' },
  ], synonyms: ['waver', 'hesitate', 'fluctuate', 'dither'], antonyms: ['decide', 'commit', 'resolve'] },
  { word: 'dichotomy', phonetic: '/daɪˈkɒtəmi/', partOfSpeech: 'noun', definitions: [
    { definition: 'A division into two contrasting things or groups', example: 'The dichotomy between theory and practice.' },
  ], synonyms: ['division', 'split', 'contrast', 'separation'], antonyms: ['unity', 'agreement', 'harmony'] },
  { word: 'insidious', phonetic: '/ɪnˈsɪdɪəs/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Proceeding in a gradual, subtle way, but with harmful effects', example: 'The insidious effects of pollution.' },
  ], synonyms: ['subtle', 'stealthy', 'treacherous', 'underhand'], antonyms: ['obvious', 'direct', 'straightforward'] },
  { word: 'alacrity', phonetic: '/əˈlækrɪti/', partOfSpeech: 'noun', definitions: [
    { definition: 'Brisk and cheerful readiness', example: 'She accepted the invitation with alacrity.' },
  ], synonyms: ['eagerness', 'willingness', 'enthusiasm', 'readiness'], antonyms: ['reluctance', 'apathy', 'indifference'] },
  { word: 'acumen', phonetic: '/ˈækjʊmen/', partOfSpeech: 'noun', definitions: [
    { definition: 'The ability to make good judgments and quick decisions', example: 'Business acumen.' },
  ], synonyms: ['shrewdness', 'astuteness', 'insight', 'sagacity'], antonyms: ['ignorance', 'naivety'] },
  { word: 'equivocal', phonetic: '/ɪˈkwɪvəkəl/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Open to more than one interpretation; ambiguous', example: 'An equivocal answer.' },
  ], synonyms: ['ambiguous', 'vague', 'unclear', 'indefinite'], antonyms: ['unequivocal', 'clear', 'definite'] },
  { word: 'penultimate', phonetic: '/pɪˈnʌltɪmət/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Last but one; second to the last', example: 'The penultimate chapter of the book.' },
  ], synonyms: ['second-to-last'], antonyms: ['ultimate', 'final', 'last'] },
  { word: 'xenial', phonetic: '/ˈziːnɪəl/', partOfSpeech: 'adjective', definitions: [
    { definition: 'Of or relating to hospitality; hospitable', example: 'A xenial relationship between the two communities.' },
  ], synonyms: ['hospitable', 'welcoming', 'friendly', 'gracious'], antonyms: ['hostile', 'unwelcoming'] },
];

function getWordOfDay(): WordEntry {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DICTIONARY[dayOfYear % DICTIONARY.length];
}

export default function Dictionary({ windowId }: { windowId: string }) {
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<WordEntry | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const wordOfDay = useMemo(() => getWordOfDay(), []);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return DICTIONARY.filter(w => w.word.startsWith(q)).slice(0, 8);
  }, [query]);

  const search = useCallback((word?: string) => {
    const searchTerm = (word || query).trim().toLowerCase();
    if (!searchTerm) return;
    const entry = DICTIONARY.find(w => w.word === searchTerm);
    if (entry) {
      setSelectedWord(entry);
      setRecentSearches(prev => [entry.word, ...prev.filter(w => w !== entry.word)].slice(0, 10));
    }
    setShowSuggestions(false);
  }, [query]);

  const toggleBookmark = useCallback((word: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word); else next.add(word);
      return next;
    });
  }, []);

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Search bar */}
      <div className="p-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--bg-window)' }}>
        <div className="relative flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-input)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input type="text" value={query} onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }} onKeyDown={e => e.key === 'Enter' && search()} onFocus={() => setShowSuggestions(true)} placeholder="搜索单词..." className="flex-1 bg-transparent outline-none text-xs" style={{ color: 'var(--text-primary)' }} />
            {query && <button onClick={() => { setQuery(''); setShowSuggestions(false); }} className="p-0.5 rounded hover:bg-[var(--bg-hover)]"><X size={12} style={{ color: 'var(--text-muted)' }} /></button>}
          </div>
          <button onClick={() => search()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: 'var(--accent-dark-gray)' }}>搜索</button>
          <button onClick={() => setShowBookmarks(!showBookmarks)} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)]" style={{ color: bookmarks.size > 0 ? 'var(--accent-silver)' : 'var(--text-muted)' }}>
            {showBookmarks ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-[calc(100%-24px)] rounded-lg shadow-lg" style={{ background: 'var(--bg-window)', border: '1px solid rgba(0,0,0,0.1)' }}>
            {suggestions.map(word => (
              <button key={word.word} onClick={() => { setQuery(word.word); search(word.word); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-hover)] flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                <span className="font-medium">{word.word}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{word.partOfSpeech}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {showBookmarks ? (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <BookmarkCheck size={14} style={{ color: 'var(--accent-silver)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>收藏的单词</span>
            </div>
            {bookmarks.size === 0 ? <p className="text-xs" style={{ color: 'var(--text-muted)' }}>暂无收藏的单词</p> : (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(bookmarks).map(word => (
                  <button key={word} onClick={() => { setQuery(word); search(word); setShowBookmarks(false); }} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>{word}</button>
                ))}
              </div>
            )}
          </div>
        ) : selectedWord ? (
          <div className="p-4">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedWord.word}</h1>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{selectedWord.phonetic}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded italic" style={{ background: 'var(--bg-input)', color: 'var(--accent-silver)' }}>{selectedWord.partOfSpeech}</span>
                </div>
              </div>
              <button onClick={() => toggleBookmark(selectedWord.word)} className="p-1 rounded hover:bg-[var(--bg-hover)]" style={{ color: bookmarks.has(selectedWord.word) ? 'var(--accent-silver)' : 'var(--text-muted)' }}>
                {bookmarks.has(selectedWord.word) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>
            </div>
            <div className="mt-4">
              <div className="text-[10px] font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>释义</div>
              {selectedWord.definitions.map((def, i) => (
                <div key={i} className="mb-3 pl-3 border-l-2" style={{ borderColor: 'var(--accent-silver)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{i + 1}. {def.definition}</p>
                  {def.example && <p className="text-[11px] mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>"{def.example}"</p>}
                </div>
              ))}
            </div>
            {selectedWord.synonyms.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-medium mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>同义词</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedWord.synonyms.map(syn => (
                    <button key={syn} onClick={() => { setQuery(syn); search(syn); }} className="px-2 py-0.5 rounded text-[11px] hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--accent-silver)' }}>{syn}</button>
                  ))}
                </div>
              </div>
            )}
            {selectedWord.antonyms.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-medium mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>反义词</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedWord.antonyms.map(ant => (
                    <button key={ant} onClick={() => { setQuery(ant); search(ant); }} className="px-2 py-0.5 rounded text-[11px] hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: '#f87171' }}>{ant}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--bg-window)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Star size={12} style={{ color: 'var(--accent-silver)' }} />
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>每日一词</span>
              </div>
              <button onClick={() => { setQuery(wordOfDay.word); setSelectedWord(wordOfDay); }} className="text-left w-full">
                <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{wordOfDay.word}</div>
                <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{wordOfDay.phonetic}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{wordOfDay.definitions[0].definition}</div>
              </button>
            </div>
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <RotateCcw size={10} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>最近搜索</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map(word => (
                    <button key={word} onClick={() => { setQuery(word); search(word); }} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>{word}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
