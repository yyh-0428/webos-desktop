import type { ComponentType } from 'react';
import type { ReactNode } from 'react';

// Direct imports for core system apps
import Terminal from '@/apps/Terminal';
import FileManager from '@/apps/FileManager';
import Settings from '@/apps/Settings';
import TaskManager from '@/apps/TaskManager';
import Calculator from '@/apps/Calculator';
import TextEditor from '@/apps/TextEditor';
import Calendar from '@/apps/Calendar';
import ClockApp from '@/apps/Clock';

// Game apps
import Chess from '@/apps/Chess';
import Minesweeper from '@/apps/Minesweeper';
import Tetris from '@/apps/Tetris';
import Snake from '@/apps/Snake';
import Solitaire from '@/apps/Solitaire';
import Game2048 from '@/apps/Game2048';
import TicTacToe from '@/apps/TicTacToe';
import MemoryMatch from '@/apps/MemoryMatch';
import Sudoku from '@/apps/Sudoku';
import Pong from '@/apps/Pong';
import GameLauncher from '@/apps/GameLauncher';

// Accessory apps
import PasswordGenerator from '@/apps/PasswordGenerator';
import QRCodeGenerator from '@/apps/QRCodeGenerator';
import UnitConverter from '@/apps/UnitConverter';
import StickyNotes from '@/apps/StickyNotes';
import FontViewer from '@/apps/FontViewer';
import ArchiveManager from '@/apps/ArchiveManager';

// Office apps
import Writer from '@/apps/Writer';
import Spreadsheet from '@/apps/Spreadsheet';
import Presentation from '@/apps/Presentation';
import PdfViewer from '@/apps/PdfViewer';
import Notepad from '@/apps/Notepad';

// Development apps
import CodeEditor from '@/apps/CodeEditor';
import RegexBuddy from '@/apps/RegexBuddy';
import JsonViewer from '@/apps/JsonViewer';
import MarkdownViewer from '@/apps/MarkdownViewer';
import ColorPicker from '@/apps/ColorPicker';
import DiffViewer from '@/apps/DiffViewer';
import Database from '@/apps/Database';

// Multimedia apps
import MusicPlayer from '@/apps/MusicPlayer';
import VideoPlayer from '@/apps/VideoPlayer';
import ImageViewer from '@/apps/ImageViewer';
import Camera from '@/apps/Camera';
import VoiceRecorder from '@/apps/VoiceRecorder';

// Communication & utility apps
import Browser from '@/apps/Browser';
import Email from '@/apps/Email';
import Chat from '@/apps/Chat';
import Weather from '@/apps/Weather';
import Maps from '@/apps/Maps';
import NewsReader from '@/apps/NewsReader';

// Graphics apps
import Paint from '@/apps/Paint';
import ImageEditor from '@/apps/ImageEditor';
import SvgViewer from '@/apps/SvgViewer';
import IconMaker from '@/apps/IconMaker';

// System utility apps
import Screenshot from '@/apps/Screenshot';
import SystemInfo from '@/apps/SystemInfo';
import DiskUsage from '@/apps/DiskUsage';
import Backup from '@/apps/Backup';
import FileSearch from '@/apps/FileSearch';
import NetworkTools from '@/apps/NetworkTools';
import Encrypter from '@/apps/Encrypter';
import Archive from '@/apps/Archive';
import Help from '@/apps/Help';
import Trash from '@/apps/Trash';
import Dictionary from '@/apps/Dictionary';
import Translator from '@/apps/Translator';
import Stopwatch from '@/apps/Stopwatch';

// Map app IDs to their component implementations
const appComponents: Record<string, ComponentType<{ windowId: string }>> = {
  terminal: Terminal,
  filemanager: FileManager,
  settings: Settings,
  taskmanager: TaskManager,
  calculator: Calculator,
  texteditor: TextEditor,
  calendar: Calendar,
  clock: ClockApp,
  chess: Chess,
  minesweeper: Minesweeper,
  tetris: Tetris,
  snake: Snake,
  solitaire: Solitaire,
  game2048: Game2048,
  tictactoe: TicTacToe,
  memorymatch: MemoryMatch,
  sudoku: Sudoku,
  pong: Pong,
  gamelauncher: GameLauncher,
  password: PasswordGenerator,
  qrcode: QRCodeGenerator,
  converter: UnitConverter,
  stickynotes: StickyNotes,
  fonts: FontViewer,
  archiver: ArchiveManager,
  codeeditor: CodeEditor,
  regexbuddy: RegexBuddy,
  jsonviewer: JsonViewer,
  markdownviewer: MarkdownViewer,
  colorpicker: ColorPicker,
  diffviewer: DiffViewer,
  database: Database,
  musicplayer: MusicPlayer,
  videoplayer: VideoPlayer,
  imageviewer: ImageViewer,
  camera: Camera,
  voice: VoiceRecorder,
  writer: Writer,
  spreadsheet: Spreadsheet,
  presentation: Presentation,
  pdfviewer: PdfViewer,
  notepad: Notepad,
  browser: Browser,
  email: Email,
  chat: Chat,
  weather: Weather,
  maps: Maps,
  newsreader: NewsReader,
  paint: Paint,
  imageeditor: ImageEditor,
  svgviewer: SvgViewer,
  iconmaker: IconMaker,
  screenshot: Screenshot,
  systeminfo: SystemInfo,
  diskusage: DiskUsage,
  backup: Backup,
  filesearch: FileSearch,
  network: NetworkTools,
  encrypter: Encrypter,
  archive: Archive,
  help: Help,
  trash: Trash,
  dictionary: Dictionary,
  translator: Translator,
  stopwatch: Stopwatch,
};

// Placeholder for apps not yet implemented
function AppPlaceholder({ appId, windowId: _windowId }: { appId: string; windowId: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-sm" style={{ background: 'var(--bg-workspace)' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--bg-input)' }}>
        <span className="text-2xl text-[var(--accent-silver)]">?</span>
      </div>
      <h3 className="text-base font-medium text-[var(--text-primary)] mb-1">即将推出</h3>
      <p className="text-xs text-[var(--text-muted)]">此应用将在未来更新中提供。</p>
      <p className="text-[10px] text-[var(--text-muted)] mt-2">App ID: {appId}</p>
    </div>
  );
}

export function getAppComponent(appId: string): ComponentType<{ windowId: string }> {
  return appComponents[appId] || ((props: { windowId: string }) => <AppPlaceholder appId={appId} windowId={props.windowId} />);
}

export function renderApp(appId: string, windowId: string): ReactNode {
  const Component = getAppComponent(appId);
  return <Component key={windowId} windowId={windowId} />;
}
