import { useState, useMemo } from 'react';
import {
  Search, Bookmark, BookmarkCheck, RefreshCw, Clock, ExternalLink, ChevronLeft, ArrowUpRight,
  Layers, Monitor, FlaskConical, TrendingUp, Trophy, Film, X,
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  source: string;
  time: string;
  thumbnail: string;
  readTime: string;
  bookmarked: boolean;
}

const categories = [
  { id: 'all', name: '头条', icon: Layers },
  { id: 'technology', name: '科技', icon: Monitor },
  { id: 'science', name: '科学', icon: FlaskConical },
  { id: 'business', name: '商业', icon: TrendingUp },
  { id: 'sports', name: '体育', icon: Trophy },
  { id: 'entertainment', name: '娱乐', icon: Film },
];

const initialArticles: Article[] = [
  {
    id: '1', title: 'AI Agents Now Write 40% of Production Code at Major Tech Firms',
    summary: 'A new study reveals that AI-powered coding assistants are contributing significantly to codebases at companies like Google, Meta, and Microsoft, raising questions about software development\'s future.',
    content: 'According to a comprehensive study released by the Software Engineering Research Institute, AI coding agents now write approximately 40% of production code at major technology companies. The study examined code contributions across 50 large-scale projects over the past 12 months.\n\nThe findings show a dramatic shift in how software is built. At Google, AI agents contributed 38% of new code in their core search infrastructure. Microsoft reported 42% AI-generated code in Azure services, while Meta\'s internal tools showed a 45% AI contribution rate.\n\n"These aren\'t just autocomplete suggestions," said Dr. Sarah Chen, the study\'s lead researcher. "These are fully functional modules, test suites, and even architectural decisions being made by AI systems."\n\nThe implications are significant. While productivity has increased by an estimated 60%, the study also notes a shift in developer roles toward code review, system design, and AI prompt engineering.',
    category: 'technology', source: 'TechCrunch', time: '2 小时前',
    thumbnail: '🤖', readTime: '5 分钟阅读', bookmarked: false,
  },
  {
    id: '2', title: 'NASA Confirms Water Ice Deposits Larger Than Expected on Mars',
    summary: 'New data from the Perseverance rover reveals substantial subsurface water ice reserves near the Martian equator, potentially suitable for future human missions.',
    content: 'NASA scientists announced today that the Perseverance rover has discovered water ice deposits significantly larger than previously estimated near Mars\'s Jezero Crater.\n\nGround-penetrating radar data indicates ice sheets extending up to 30 meters below the surface in some regions, with an estimated total volume that could sustain a human colony for years.\n\n"This changes the calculus for human Mars missions entirely," said Dr. Michael Torres, lead scientist on the Mars Ice Mapping project. "Having accessible water ice near the equator means we don\'t need to choose landing sites based solely on ice proximity."\n\nThe discovery could accelerate NASA\'s timeline for crewed Mars missions by several years.',
    category: 'science', source: 'NASA News', time: '3 小时前',
    thumbnail: '🔴', readTime: '4 分钟阅读', bookmarked: false,
  },
  {
    id: '3', title: 'Global Semiconductor Market Hits Record $800B as AI Demand Surges',
    summary: 'The chip industry reaches unprecedented heights driven by insatiable demand for AI accelerators, with NVIDIA maintaining its dominant position.',
    content: 'The global semiconductor market has reached a historic milestone, surpassing $800 billion in annual revenue for the first time, according to a new report from the Semiconductor Industry Association.\n\nThe explosive growth is primarily driven by demand for AI accelerator chips, which now account for 35% of total semiconductor revenue. NVIDIA continues to dominate this segment with a 78% market share, though competition from AMD, Intel, and several startups is intensifying.\n\n"The AI compute demand curve is unlike anything we\'ve seen in semiconductor history," said Lisa Park, SIA president. "Every hyperscaler is racing to build out infrastructure, and that demand shows no signs of slowing."\n\nManufacturing capacity remains a bottleneck, with TSMC and Samsung operating at near-full utilization at their most advanced process nodes.',
    category: 'business', source: 'Bloomberg', time: '4 小时前',
    thumbnail: '📊', readTime: '4 分钟阅读', bookmarked: false,
  },
  {
    id: '4', title: 'SpaceX Starship Completes First Orbital Refueling Test',
    summary: 'In a breakthrough for deep space exploration, SpaceX successfully demonstrated propellant transfer between two Starship vehicles in low Earth orbit.',
    content: 'SpaceX achieved a major milestone today as two Starship vehicles successfully performed an orbital propellant transfer demonstration, a critical technology for missions to the Moon and Mars.\n\nThe test involved transferring approximately 100 metric tons of liquid oxygen and methane between the ships during a 45-minute rendezvous in low Earth orbit.\n\n"This is the key that unlocks everything beyond low Earth orbit," said SpaceX CEO Elon Musk during a post-mission briefing. "With orbital refueling, Starship can reach the Moon, Mars, and eventually anywhere in the solar system."\n\nNASA has identified orbital refueling as essential for its Artemis program, which aims to return humans to the lunar surface using a Starship-derived Human Landing System.',
    category: 'science', source: 'Space.com', time: '5 小时前',
    thumbnail: '🚀', readTime: '3 分钟阅读', bookmarked: false,
  },
  {
    id: '5', title: 'React 20 Introduces Built-in Server Components and Zero-Config SSR',
    summary: 'The latest React release eliminates the need for separate server frameworks, bringing server-side rendering directly into the React ecosystem.',
    content: 'React 20 has been officially released, introducing built-in Server Components and a new zero-configuration server-side rendering system that fundamentally changes how React applications are built.\n\nKey features include native Server Components that run exclusively on the server, automatic code splitting, and a new streaming architecture that delivers sub-100ms Time to First Byte.\n\n"We\'ve been working toward this vision for four years," said React core team member Dan Abramov. "Server Components in React 20 make the server-client boundary intuitive rather than a source of bugs."\n\nThe release also includes a new compiler that automatically optimizes component re-renders, eliminating the need for useMemo and useCallback hooks in most cases.',
    category: 'technology', source: 'React Blog', time: '6 小时前',
    thumbnail: '⚛️', readTime: '6 分钟阅读', bookmarked: true,
  },
  {
    id: '6', title: 'Premier League Title Race Goes Down to Final Matchday',
    summary: 'Arsenal and Manchester City are separated by just one point heading into the final day of the season, setting up a dramatic conclusion.',
    content: 'The 2025-26 Premier League season will be decided on the final matchday after Arsenal\'s dramatic 3-2 win over Liverpool kept them one point behind leaders Manchester City.\n\nArsenal sit on 86 points, with Manchester City on 87. City host Aston Villa on the final day, while Arsenal travel to Newcastle.\n\nArsenal need to win and hope City fail to win, or match City\'s result while overturning a goal difference deficit of four. "We\'ll fight until the very last second," said Arsenal manager Mikel Arteta.\n\nCity\'s Pep Guardiola remained cautious: "We know how difficult Aston Villa can be. Every game in this league is a battle."\n\nThe final day kicks off at 4pm BST on Sunday.',
    category: 'sports', source: 'BBC Sport', time: '1 小时前',
    thumbnail: '⚽', readTime: '3 分钟阅读', bookmarked: false,
  },
  {
    id: '7', title: 'Quantum Computer Breaks 10,000-Qubit Barrier',
    summary: 'IBM unveils its Condor II processor with 12,000 qubits, marking a significant step toward practical quantum computing applications.',
    content: 'IBM has unveiled Condor II, a quantum processor containing 12,000 superconducting qubits, breaking the 10,000-qubit barrier and setting a new record for quantum computing hardware.\n\nThe processor demonstrates a quantum volume of 2^40, far exceeding any previous system. IBM claims it can solve certain optimization problems that would take classical supercomputers millions of years.\n\n"10,000 qubits was always a psychological and technical milestone," said IBM\'s VP of Quantum Computing. "We\'re now in the territory where quantum advantage becomes undeniable for real-world applications."\n\nThe company plans to make Condor II available through its IBM Quantum Network by Q3 2026.',
    category: 'technology', source: 'Wired', time: '7 小时前',
    thumbnail: '🔮', readTime: '4 分钟阅读', bookmarked: false,
  },
  {
    id: '8', title: 'EU Passes Landmark Digital Identity Framework',
    summary: 'All EU citizens will have access to a standardized digital identity wallet by 2028 under new legislation passed by the European Parliament.',
    content: 'The European Parliament has passed the European Digital Identity Framework, requiring all 27 member states to offer citizens a standardized digital identity wallet by 2028.\n\nThe wallet will store government-issued IDs, driving licenses, educational credentials, and medical records. Citizens will be able to use it for online authentication across all EU services.\n\n"This is about giving Europeans control over their digital lives," said Commissioner Thierry Breton. "No more passwords, no more data harvesting by private companies."\n\nPrivacy advocates have expressed cautious optimism, noting strong provisions for data minimization and user consent built into the framework.',
    category: 'business', source: 'Reuters', time: '8 小时前',
    thumbnail: '🇪🇺', readTime: '4 分钟阅读', bookmarked: false,
  },
  {
    id: '9', title: 'New Study Links Gut Microbiome to Mental Health Outcomes',
    summary: 'Researchers identify specific bacterial strains associated with reduced anxiety and depression, opening doors for targeted probiotic therapies.',
    content: 'A large-scale study published in Nature Medicine has identified specific gut bacterial strains strongly correlated with improved mental health outcomes, providing the most compelling evidence yet for the gut-brain connection.\n\nThe study, which followed 50,000 participants over five years, found that individuals with higher levels of Lactobacillus rhamnosus and Bifidobacterium longum reported 35% fewer symptoms of anxiety and depression.\n\n"We can now say with confidence that the microbiome plays a causal role in mental health," said Dr. Elena Rossi, the study\'s principal investigator. "This opens the door to precision probiotics as a complement to traditional mental health treatments."\n\nClinical trials for targeted probiotic therapies are expected to begin within the next year.',
    category: 'science', source: 'Nature', time: '9 小时前',
    thumbnail: '🧬', readTime: '5 分钟阅读', bookmarked: false,
  },
  {
    id: '10', title: 'Tesla Unveils Next-Gen Robotaxi with No Steering Wheel',
    summary: 'Tesla\'s Cybercab enters limited production with fully autonomous capabilities and a $30,000 price point, aiming for ride-hailing deployment in 2027.',
    content: 'Tesla has unveiled the production version of its Cybercab, a fully autonomous vehicle with no steering wheel or pedals, priced at $30,000.\n\nThe vehicle features Tesla\'s latest Full Self-Driving hardware with 12 cameras, 5 radar units, and a new custom AI chip delivering 10x the processing power of its predecessor.\n\n"Cybercab represents the end of human driving," said Tesla CEO Elon Musk. "It\'s safer, cheaper per mile than any transportation option in history."\n\nThe company plans to deploy the first Cybercabs in its own ride-hailing network in Austin, Texas, and San Francisco by mid-2027, with broader availability following regulatory approval.',
    category: 'technology', source: 'The Verge', time: '10 小时前',
    thumbnail: '🚗', readTime: '4 分钟阅读', bookmarked: false,
  },
  {
    id: '11', title: 'Warner Bros Announces New Matrix Film with Keanu Reeves',
    summary: 'A fourth Matrix sequel is in development with Lana Wachowski returning to direct and Keanu Reeves reprising his role as Neo.',
    content: 'Warner Bros. Pictures has officially announced a new installment in The Matrix franchise, with Lana Wachowski returning to direct and Keanu Reeves confirmed to reprise his iconic role as Neo.\n\nThe film, currently titled "The Matrix: Resurrections II," is described as a direct continuation that will "explore the boundaries between human consciousness and artificial intelligence in ways we haven\'t yet imagined."\n\nProduction is set to begin in early 2027, with a targeted release date of late 2028. Carrie-Anne Moss will also return as Trinity.\n\n"The Matrix universe has so many more stories to tell," said Wachowski. "This one will surprise people."',
    category: 'entertainment', source: 'Variety', time: '3 小时前',
    thumbnail: '🎬', readTime: '3 分钟阅读', bookmarked: false,
  },
  {
    id: '12', title: 'Global Carbon Emissions Decline for Second Consecutive Year',
    summary: 'Accelerating renewable energy adoption and improved efficiency drive a 3.2% reduction in worldwide CO2 emissions, according to new IEA data.',
    content: 'Global carbon dioxide emissions declined by 3.2% in 2025, marking the second consecutive year of reduction, according to the International Energy Agency\'s annual emissions report.\n\nThe decline was driven primarily by record solar and wind installations, which added 600 GW of new capacity globally. Electric vehicle sales reached 25 million units, displacing significant oil demand.\n\n"We are witnessing the beginning of the end of the fossil fuel era," said IEA Executive Director Fatih Birol. "The economics of clean energy are now irresistible."\n\nHowever, the report cautioned that current trajectories still fall short of Paris Agreement targets, requiring a 7% annual reduction to limit warming to 1.5 degrees Celsius.',
    category: 'science', source: 'IEA', time: '11 小时前',
    thumbnail: '🌍', readTime: '5 分钟阅读', bookmarked: false,
  },
  {
    id: '13', title: 'Apple Vision Pro 2 Cuts Weight by 40%, Adds Spatial Gaming',
    summary: 'The second-generation headset addresses the biggest complaints about the original while introducing a dedicated spatial gaming platform.',
    content: 'Apple has unveiled Vision Pro 2, its second-generation spatial computing headset that weighs 40% less than the original at just 350 grams.\n\nThe new device features Apple\'s M5 chip, micro-OLED displays with 50% higher resolution, and a redesigned headband system that distributes weight more evenly.\n\nThe headline feature is "Spatial Play," a dedicated gaming platform with 100 launch titles designed specifically for mixed reality. Major publishers including EA, Ubisoft, and Nintendo have partnered for the launch.\n\nVision Pro 2 starts at $2,499, a $1,000 reduction from the original, and ships in October 2026.',
    category: 'technology', source: 'MacRumors', time: '12 小时前',
    thumbnail: '🥽', readTime: '4 分钟阅读', bookmarked: false,
  },
  {
    id: '14', title: 'Tokyo Olympics Bid for 2040 Gains Momentum',
    summary: 'Japan\'s Olympic Committee formally submits candidacy to host the 2040 Summer Games, proposing a fully sustainable, AI-managed event.',
    content: 'The Japanese Olympic Committee has formally submitted its candidacy to host the 2040 Summer Olympic Games in Tokyo, proposing what it calls the most technologically advanced and sustainable Games in history.\n\nThe bid features venues powered entirely by renewable energy, AI-driven crowd management, autonomous transportation systems, and carbon-negative construction standards.\n\n"Tokyo 2040 will set a new standard for what the Olympic Games can be," said JOC President Yasuhiro Yamashita. "We want to showcase how technology and sustainability can work together."\n\nTokyo faces competition from Istanbul, Mumbai, and a joint Nordic bid from Stockholm, Oslo, and Copenhagen.',
    category: 'sports', source: 'NHK', time: '14 小时前',
    thumbnail: '🏅', readTime: '3 分钟阅读', bookmarked: false,
  },
  {
    id: '15', title: 'Streaming Wars: Netflix and Disney+ Merge Content Libraries',
    summary: 'In an unprecedented deal, Netflix and Disney+ announce a bundled service combining both platforms\' content under a single subscription.',
    content: 'In a move that would have been unthinkable just years ago, Netflix and Disney have announced "StreamBundle," a combined service offering both platforms\' content libraries under a single $19.99/month subscription.\n\nThe deal comes as both companies face increasing competition from TikTok, YouTube, and gaming platforms for consumer attention.\n\n"This is about giving subscribers the best possible experience," said Netflix CEO Ted Sarandos. "Together, we offer an unmatched library of entertainment."\n\nThe bundled service launches in January 2027, with both platforms continuing to operate independently as well.',
    category: 'entertainment', source: 'Deadline', time: '15 小时前',
    thumbnail: '📺', readTime: '3 分钟阅读', bookmarked: false,
  },
  {
    id: '16', title: 'Record Arctic Ice Recovery Surprises Climate Scientists',
    summary: 'An unexpected increase in Arctic sea ice extent has researchers investigating new factors that may influence polar ice dynamics.',
    content: 'Arctic sea ice extent has shown an unexpected 12% increase compared to the same period last year, the largest year-over-year recovery since satellite monitoring began in 1979.\n\nScientists attribute the recovery to a combination of natural climate variability, including a shift in the North Atlantic Oscillation, and reduced particulate emissions from shipping regulations implemented in 2024.\n\n"This doesn\'t mean climate change has reversed," cautioned Dr. Jennifer Francis of the Woodwell Climate Research Center. "But it does show that policy interventions can have measurable effects."\n\nThe Arctic remains on a long-term declining trend, with ice extent still 30% below the 1981-2010 average.',
    category: 'science', source: 'Scientific American', time: '16 小时前',
    thumbnail: '🧊', readTime: '4 分钟阅读', bookmarked: false,
  },
  {
    id: '17', title: 'Fed Holds Rates Steady as Inflation Reaches 2% Target',
    summary: 'The Federal Reserve maintains interest rates at 3.5% as inflation finally reaches the central bank\'s long-standing target for the first time in four years.',
    content: 'The Federal Reserve held its benchmark interest rate steady at 3.5% following its latest policy meeting, as the Personal Consumption Expenditures index reached the central bank\'s 2% inflation target for the first time since 2022.\n\nFed Chair Jerome Powell indicated that while progress has been made, the central bank remains cautious about declaring victory on inflation.\n\n"We need to see sustained evidence that inflation is durably at 2% before considering further rate cuts," Powell said during the post-meeting press conference.\n\nMarkets are now pricing in two additional 25-basis-point rate cuts by year-end, contingent on continued inflation moderation.',
    category: 'business', source: 'CNBC', time: '18 小时前',
    thumbnail: '🏦', readTime: '4 分钟阅读', bookmarked: false,
  },
  {
    id: '18', title: 'World Cup 2026 Stadiums Complete Final Safety Inspections',
    summary: 'All 16 venues across the US, Mexico, and Canada have passed FIFA\'s final safety and accessibility inspections ahead of the tournament.',
    content: 'FIFA has confirmed that all 16 stadiums designated for the 2026 World Cup have successfully completed final safety and accessibility inspections.\n\nThe tournament, the first to feature 48 teams, will be hosted across 16 cities in the United States, Mexico, and Canada. The final will be held at MetLife Stadium in New Jersey.\n\n"Every stadium meets or exceeds our safety requirements," said FIFA President Gianni Infantino. "We are confident this will be the most spectacular World Cup in history."\n\nTickets for the tournament\'s 104 matches go on sale in phases starting next month.',
    category: 'sports', source: 'ESPN', time: '20 小时前',
    thumbnail: '🏟', readTime: '3 分钟阅读', bookmarked: false,
  },
  {
    id: '19', title: 'Keanu Reeves\' BRZRKR Comic Gets Live-Action Netflix Series',
    summary: 'The popular comic co-created by Keanu Reeves is being adapted into a 10-episode live-action series for Netflix, with Reeves starring.',
    content: 'Netflix has greenlit a 10-episode live-action adaptation of BRZRKR, the popular comic book series co-created by Keanu Reeves. Reeves will star as the immortal warrior B.\n\nThe series will be produced by the Russo Brothers\' AGBO studio, with filming set to begin in New Zealand later this year.\n\n"BRZRKR is a deeply personal project," said Reeves. "Bringing it to life in live-action, in this format, allows us to explore the character\'s 80,000-year journey in a way the comics only hinted at."\n\nThe series is expected to premiere in late 2027.',
    category: 'entertainment', source: 'The Hollywood Reporter', time: '22 小时前',
    thumbnail: '📚', readTime: '3 分钟阅读', bookmarked: false,
  },
  {
    id: '20', title: 'India Surpasses China as World\'s Largest Economy by PPP',
    summary: 'New World Bank data confirms India has overtaken China in purchasing power parity terms, driven by rapid digitalization and a young workforce.',
    content: 'India has officially surpassed China as the world\'s largest economy measured by purchasing power parity, according to new World Bank data.\n\nIndia\'s GDP in PPP terms reached $36.8 trillion, compared to China\'s $35.2 trillion. The milestone was driven by India\'s rapid digital transformation, growing manufacturing sector, and favorable demographics.\n\n"This is a historic moment for India," said Finance Minister Nirmala Sitharaman. "But our focus remains on ensuring this growth translates into improved living standards for every Indian."\n\nIn nominal GDP terms, the United States remains the world\'s largest economy at $28.5 trillion, followed by China at $19.8 trillion and India at $4.7 trillion.',
    category: 'business', source: 'Financial Times', time: '1 天前',
    thumbnail: '📈', readTime: '5 分钟阅读', bookmarked: false,
  },
];

export default function NewsReader({ windowId: _windowId }: { windowId: string }) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (activeCategory !== 'all') {
      result = result.filter(a => a.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q)
      );
    }
    return result;
  }, [articles, activeCategory, searchQuery]);

  const selectedArticle = articles.find(a => a.id === selectedArticleId);

  const toggleBookmark = (id: string) => {
    setArticles(prev => prev.map(a =>
      a.id === id ? { ...a, bookmarked: !a.bookmarked } : a
    ));
  };

  const selectArticle = (id: string) => {
    setSelectedArticleId(id);
    setShowMobileList(false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const bookmarkCount = articles.filter(a => a.bookmarked).length;

  const getCategoryThumbnail = (article: Article) => {
    return article.thumbnail;
  };

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 shrink-0" style={{ background: 'var(--bg-window)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2">
          {selectedArticleId && !showMobileList && (
            <button onClick={() => { setSelectedArticleId(null); setShowMobileList(true); }}
              className="md:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <ChevronLeft size={16} />
            </button>
          )}
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">新闻阅读器</h1>
          {bookmarkCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <BookmarkCheck size={10} /> {bookmarkCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center h-7 rounded-lg px-2.5 gap-2" style={{ background: 'var(--bg-input)' }}>
            <Search size={12} className="text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索文章..."
              className="bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-32"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[var(--text-muted)]">
                <X size={10} />
              </button>
            )}
          </div>
          <button
            onClick={handleRefresh}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-0.5 px-3 h-9 shrink-0 overflow-x-auto" style={{ background: 'var(--bg-window)', borderBottom: '1px solid var(--border-default)' }}>
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSelectedArticleId(null); setShowMobileList(true); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] transition-colors shrink-0 ${
                isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
              style={isActive ? { background: 'var(--bg-hover)' } : {}}
            >
              <Icon size={12} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Article list */}
        <div className={`${showMobileList ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-80 shrink-0 overflow-y-auto`} style={{ borderRight: '1px solid var(--border-default)' }}>
          {isRefreshing && (
            <div className="h-0.5 bg-[var(--accent-silver)] animate-pulse" />
          )}
          {filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[var(--text-muted)]">
              <Search size={24} className="mb-2 opacity-40" />
              <span className="text-xs">未找到文章</span>
            </div>
          ) : (
            filteredArticles.map(article => (
              <button
                key={article.id}
                onClick={() => selectArticle(article.id)}
                className={`w-full text-left p-3 transition-colors ${
                  selectedArticleId === article.id ? '' : 'hover:bg-[var(--bg-hover)]'
                }`}
                style={selectedArticleId === article.id ? { background: 'var(--bg-hover)' } : {}}
              >
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0" style={{ background: 'var(--bg-input)' }}>
                    {getCategoryThumbnail(article)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 mb-1">{article.title}</h3>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mb-1.5">{article.summary}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                      <span>{article.source}</span>
                      <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                      <span>{article.time}</span>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleBookmark(article.id); }}
                    className={`shrink-0 mt-0.5 transition-colors ${article.bookmarked ? 'text-[var(--accent-silver)]' : 'text-[var(--text-muted)] hover:text-[var(--accent-silver)]'}`}
                  >
                    {article.bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                  </button>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Article detail */}
        <div className={`${!showMobileList ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 overflow-y-auto`}>
          {selectedArticle ? (
            <div className="p-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium text-[var(--text-primary)]" style={{ background: 'var(--bg-input)' }}>
                  {categories.find(c => c.id === selectedArticle.category)?.name || selectedArticle.category}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">{selectedArticle.readTime}</span>
              </div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] mb-4 leading-tight">{selectedArticle.title}</h1>
              <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <div className="w-8 h-8 rounded-full bg-[var(--accent-silver)] flex items-center justify-center text-white text-xs font-semibold">
                  {selectedArticle.source[0]}
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-primary)]">{selectedArticle.source}</div>
                  <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <Clock size={10} /> {selectedArticle.time}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => toggleBookmark(selectedArticle.id)}
                    className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                      selectedArticle.bookmarked ? 'text-[var(--accent-silver)]' : 'text-[var(--text-muted)] hover:text-[var(--accent-silver)]'
                    }`}
                    style={{ background: 'var(--bg-input)' }}
                  >
                    {selectedArticle.bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                  </button>
                  <button className="w-7 h-7 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--accent-silver)] transition-colors"
                    style={{ background: 'var(--bg-input)' }}>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
              <div className="text-5xl mb-6 text-center">{selectedArticle.thumbnail}</div>
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {selectedArticle.content}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <Layers size={32} className="mb-3 opacity-30" />
              <span className="text-xs">选择一篇文章阅读</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
