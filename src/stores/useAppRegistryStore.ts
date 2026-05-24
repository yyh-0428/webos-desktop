import { create } from 'zustand';

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  component: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  singleton: boolean;
}

export interface AppRegistryStore {
  apps: Record<string, AppDefinition>;
  registerApp: (app: AppDefinition) => void;
  getApp: (id: string) => AppDefinition | undefined;
  getAppsByCategory: (category: string) => AppDefinition[];
  getAllCategories: () => string[];
}

const defaultApps: Record<string, AppDefinition> = {
  // Core System Apps
  terminal: {
    id: 'terminal', name: '终端', description: '命令行终端模拟器',
    category: 'System', icon: 'Terminal', component: 'Terminal',
    defaultWidth: 800, defaultHeight: 500, minWidth: 400, minHeight: 200, singleton: false,
  },
  filemanager: {
    id: 'filemanager', name: '文件管理器', description: '浏览和管理文件',
    category: 'System', icon: 'FolderOpen', component: 'FileManager',
    defaultWidth: 900, defaultHeight: 600, minWidth: 500, minHeight: 300, singleton: false,
  },
  settings: {
    id: 'settings', name: '设置', description: '系统设置和偏好',
    category: 'System', icon: 'Settings', component: 'Settings',
    defaultWidth: 800, defaultHeight: 550, minWidth: 600, minHeight: 400, singleton: true,
  },
  taskmanager: {
    id: 'taskmanager', name: '任务管理器', description: '监控系统进程和性能',
    category: 'System', icon: 'Activity', component: 'TaskManager',
    defaultWidth: 700, defaultHeight: 500, minWidth: 500, minHeight: 300, singleton: true,
  },
  calculator: {
    id: 'calculator', name: '计算器', description: '标准和科学计算器',
    category: 'Accessories', icon: 'Calculator', component: 'Calculator',
    defaultWidth: 360, defaultHeight: 520, minWidth: 300, minHeight: 400, singleton: true,
  },
  texteditor: {
    id: 'texteditor', name: '文本编辑器', description: '编辑文本文件',
    category: 'Accessories', icon: 'FileText', component: 'TextEditor',
    defaultWidth: 800, defaultHeight: 600, minWidth: 400, minHeight: 300, singleton: false,
  },
  calendar: {
    id: 'calendar', name: '日历', description: '查看日历和管理事件',
    category: 'Accessories', icon: 'Calendar', component: 'Calendar',
    defaultWidth: 800, defaultHeight: 550, minWidth: 500, minHeight: 350, singleton: true,
  },
  clock: {
    id: 'clock', name: '时钟', description: '多时区世界时钟',
    category: 'Accessories', icon: 'Clock', component: 'Clock',
    defaultWidth: 500, defaultHeight: 400, minWidth: 400, minHeight: 300, singleton: true,
  },

  // Development
  codeeditor: {
    id: 'codeeditor', name: '代码编辑器', description: '带语法高亮的高级代码编辑器',
    category: 'Development', icon: 'Code2', component: 'CodeEditor',
    defaultWidth: 1000, defaultHeight: 700, minWidth: 500, minHeight: 400, singleton: false,
  },
  gitclient: {
    id: 'gitclient', name: 'Git 客户端', description: '版本控制管理',
    category: 'Development', icon: 'GitBranch', component: 'GitClient',
    defaultWidth: 900, defaultHeight: 600, minWidth: 500, minHeight: 400, singleton: true,
  },
  apiclient: {
    id: 'apiclient', name: 'API 客户端', description: '测试 HTTP API',
    category: 'Development', icon: 'Globe', component: 'ApiClient',
    defaultWidth: 800, defaultHeight: 600, minWidth: 500, minHeight: 400, singleton: false,
  },
  database: {
    id: 'database', name: '数据库管理器', description: '浏览 SQLite 数据库',
    category: 'Development', icon: 'Database', component: 'Database',
    defaultWidth: 800, defaultHeight: 600, minWidth: 500, minHeight: 400, singleton: false,
  },
  regexbuddy: {
    id: 'regexbuddy', name: '正则表达式', description: '测试和构建正则表达式',
    category: 'Development', icon: 'Search', component: 'RegexBuddy',
    defaultWidth: 700, defaultHeight: 450, minWidth: 500, minHeight: 300, singleton: true,
  },
  jsonviewer: {
    id: 'jsonviewer', name: 'JSON 查看器', description: '格式化和可视化 JSON 数据',
    category: 'Development', icon: 'Braces', component: 'JsonViewer',
    defaultWidth: 700, defaultHeight: 500, minWidth: 400, minHeight: 300, singleton: false,
  },
  markdownviewer: {
    id: 'markdownviewer', name: 'Markdown 查看器', description: '预览渲染后的 Markdown',
    category: 'Development', icon: 'BookOpen', component: 'MarkdownViewer',
    defaultWidth: 900, defaultHeight: 650, minWidth: 500, minHeight: 400, singleton: false,
  },
  colorpicker: {
    id: 'colorpicker', name: '取色器', description: '拾取和转换颜色',
    category: 'Development', icon: 'Palette', component: 'ColorPicker',
    defaultWidth: 450, defaultHeight: 400, minWidth: 350, minHeight: 300, singleton: true,
  },
  diffviewer: {
    id: 'diffviewer', name: '差异对比', description: '比较文本差异',
    category: 'Development', icon: 'SplitSquareHorizontal', component: 'DiffViewer',
    defaultWidth: 900, defaultHeight: 600, minWidth: 500, minHeight: 400, singleton: false,
  },

  // Internet
  browser: {
    id: 'browser', name: '浏览器', description: '浏览网页',
    category: 'Internet', icon: 'Globe', component: 'Browser',
    defaultWidth: 1100, defaultHeight: 700, minWidth: 600, minHeight: 400, singleton: false,
  },
  email: {
    id: 'email', name: '邮件', description: '发送和接收邮件',
    category: 'Internet', icon: 'Mail', component: 'Email',
    defaultWidth: 1000, defaultHeight: 650, minWidth: 600, minHeight: 400, singleton: false,
  },
  chat: {
    id: 'chat', name: '聊天', description: '即时通讯',
    category: 'Internet', icon: 'MessageSquare', component: 'Chat',
    defaultWidth: 500, defaultHeight: 600, minWidth: 350, minHeight: 400, singleton: false,
  },
  weather: {
    id: 'weather', name: '天气', description: '天气预报',
    category: 'Internet', icon: 'CloudSun', component: 'Weather',
    defaultWidth: 450, defaultHeight: 550, minWidth: 350, minHeight: 400, singleton: true,
  },
  maps: {
    id: 'maps', name: '地图', description: '互动地图和导航',
    category: 'Internet', icon: 'Map', component: 'Maps',
    defaultWidth: 900, defaultHeight: 650, minWidth: 500, minHeight: 400, singleton: true,
  },
  news: {
    id: 'news', name: '新闻阅读器', description: '阅读最新新闻',
    category: 'Internet', icon: 'Newspaper', component: 'NewsReader',
    defaultWidth: 800, defaultHeight: 650, minWidth: 500, minHeight: 400, singleton: false,
  },

  // Office
  writer: {
    id: 'writer', name: '文字处理', description: '文字处理',
    category: 'Office', icon: 'PenTool', component: 'Writer',
    defaultWidth: 900, defaultHeight: 700, minWidth: 500, minHeight: 400, singleton: false,
  },
  spreadsheet: {
    id: 'spreadsheet', name: '电子表格', description: '电子表格编辑器',
    category: 'Office', icon: 'Table', component: 'Spreadsheet',
    defaultWidth: 1000, defaultHeight: 650, minWidth: 500, minHeight: 400, singleton: false,
  },
  presentation: {
    id: 'presentation', name: '演示文稿', description: '创建幻灯片',
    category: 'Office', icon: 'Presentation', component: 'Presentation',
    defaultWidth: 1000, defaultHeight: 650, minWidth: 500, minHeight: 400, singleton: false,
  },
  pdfviewer: {
    id: 'pdfviewer', name: 'PDF 查看器', description: '查看 PDF 文档',
    category: 'Office', icon: 'File', component: 'PdfViewer',
    defaultWidth: 800, defaultHeight: 650, minWidth: 500, minHeight: 400, singleton: false,
  },
  notepad: {
    id: 'notepad', name: '记事本', description: '快速笔记',
    category: 'Office', icon: 'StickyNote', component: 'Notepad',
    defaultWidth: 500, defaultHeight: 500, minWidth: 300, minHeight: 300, singleton: false,
  },

  // Multimedia
  musicplayer: {
    id: 'musicplayer', name: '音乐播放器', description: '播放音乐文件',
    category: 'Multimedia', icon: 'Music', component: 'MusicPlayer',
    defaultWidth: 450, defaultHeight: 650, minWidth: 350, minHeight: 500, singleton: true,
  },
  videoplayer: {
    id: 'videoplayer', name: '视频播放器', description: '播放视频文件',
    category: 'Multimedia', icon: 'PlayCircle', component: 'VideoPlayer',
    defaultWidth: 800, defaultHeight: 550, minWidth: 500, minHeight: 350, singleton: false,
  },
  imageviewer: {
    id: 'imageviewer', name: '图片查看器', description: '查看和编辑图片',
    category: 'Multimedia', icon: 'Image', component: 'ImageViewer',
    defaultWidth: 800, defaultHeight: 600, minWidth: 400, minHeight: 300, singleton: false,
  },
  camera: {
    id: 'camera', name: '相机', description: '使用摄像头拍照',
    category: 'Multimedia', icon: 'Camera', component: 'Camera',
    defaultWidth: 640, defaultHeight: 500, minWidth: 400, minHeight: 350, singleton: true,
  },
  voice: {
    id: 'voice', name: '录音机', description: '录制音频',
    category: 'Multimedia', icon: 'Mic', component: 'VoiceRecorder',
    defaultWidth: 400, defaultHeight: 300, minWidth: 300, minHeight: 200, singleton: true,
  },

  // Graphics
  paint: {
    id: 'paint', name: '画图', description: '绘画和涂鸦',
    category: 'Graphics', icon: 'Paintbrush', component: 'Paint',
    defaultWidth: 900, defaultHeight: 700, minWidth: 500, minHeight: 400, singleton: false,
  },
  imageeditor: {
    id: 'imageeditor', name: '图片编辑器', description: '编辑照片',
    category: 'Graphics', icon: 'ImagePlus', component: 'ImageEditor',
    defaultWidth: 1000, defaultHeight: 700, minWidth: 500, minHeight: 400, singleton: false,
  },
  svgviewer: {
    id: 'svgviewer', name: 'SVG 查看器', description: '查看和编辑 SVG',
    category: 'Graphics', icon: 'PenTool', component: 'SvgViewer',
    defaultWidth: 800, defaultHeight: 650, minWidth: 500, minHeight: 400, singleton: false,
  },
  iconmaker: {
    id: 'iconmaker', name: '图标制作器', description: '创建应用图标',
    category: 'Graphics', icon: 'Shapes', component: 'IconMaker',
    defaultWidth: 600, defaultHeight: 550, minWidth: 400, minHeight: 350, singleton: false,
  },

  // System Utilities
  screenshot: {
    id: 'screenshot', name: '截图', description: '截取屏幕截图',
    category: 'System', icon: 'Camera', component: 'Screenshot',
    defaultWidth: 500, defaultHeight: 400, minWidth: 350, minHeight: 300, singleton: true,
  },
  systeminfo: {
    id: 'systeminfo', name: '系统信息', description: '查看系统信息',
    category: 'System', icon: 'Monitor', component: 'SystemInfo',
    defaultWidth: 600, defaultHeight: 500, minWidth: 400, minHeight: 350, singleton: true,
  },
  diskusage: {
    id: 'diskusage', name: '磁盘分析', description: '分析磁盘空间',
    category: 'System', icon: 'HardDrive', component: 'DiskUsage',
    defaultWidth: 700, defaultHeight: 500, minWidth: 400, minHeight: 300, singleton: true,
  },
  backup: {
    id: 'backup', name: '备份', description: '备份和恢复文件',
    category: 'System', icon: 'Archive', component: 'Backup',
    defaultWidth: 600, defaultHeight: 450, minWidth: 400, minHeight: 300, singleton: true,
  },

  filesearch: {
    id: 'filesearch', name: '文件搜索', description: '搜索系统中的文件',
    category: 'System', icon: 'Search', component: 'FileSearch',
    defaultWidth: 600, defaultHeight: 500, minWidth: 400, minHeight: 300, singleton: false,
  },
  network: {
    id: 'network', name: '网络工具', description: '网络诊断',
    category: 'System', icon: 'Wifi', component: 'NetworkTools',
    defaultWidth: 700, defaultHeight: 500, minWidth: 450, minHeight: 350, singleton: true,
  },
  encrypter: {
    id: 'encrypter', name: '加密工具', description: '加密和解密文本',
    category: 'System', icon: 'Lock', component: 'Encrypter',
    defaultWidth: 550, defaultHeight: 450, minWidth: 400, minHeight: 350, singleton: true,
  },
  archive: {
    id: 'archive', name: '压缩包管理器', description: '创建和解压压缩包',
    category: 'System', icon: 'Package', component: 'Archive',
    defaultWidth: 600, defaultHeight: 450, minWidth: 400, minHeight: 300, singleton: false,
  },

  // Accessories
  help: {
    id: 'help', name: '帮助', description: 'WebOS 帮助文档',
    category: 'Accessories', icon: 'HelpCircle', component: 'Help',
    defaultWidth: 700, defaultHeight: 550, minWidth: 400, minHeight: 350, singleton: true,
  },
  trash: {
    id: 'trash', name: '回收站', description: '已删除的文件',
    category: 'Accessories', icon: 'Trash2', component: 'Trash',
    defaultWidth: 700, defaultHeight: 500, minWidth: 400, minHeight: 300, singleton: false,
  },
  dictionary: {
    id: 'dictionary', name: '词典', description: '查询单词释义',
    category: 'Accessories', icon: 'BookOpen', component: 'Dictionary',
    defaultWidth: 500, defaultHeight: 450, minWidth: 350, minHeight: 300, singleton: false,
  },
  translator: {
    id: 'translator', name: '翻译器', description: '多语言翻译',
    category: 'Accessories', icon: 'Languages', component: 'Translator',
    defaultWidth: 550, defaultHeight: 450, minWidth: 400, minHeight: 350, singleton: false,
  },

  stopwatch: {
    id: 'stopwatch', name: '秒表', description: '计时器',
    category: 'Accessories', icon: 'Timer', component: 'Stopwatch',
    defaultWidth: 400, defaultHeight: 350, minWidth: 300, minHeight: 250, singleton: true,
  },
  // Game Launcher
  gamelauncher: {
    id: 'gamelauncher', name: '游戏', description: '浏览和启动所有游戏',
    category: 'System', icon: 'Gamepad2', component: 'GameLauncher',
    defaultWidth: 700, defaultHeight: 500, minWidth: 500, minHeight: 400, singleton: true,
  },
  chess: {
    id: 'chess', name: '国际象棋', description: '与 AI 对弈国际象棋',
    category: 'Games', icon: 'Crown', component: 'Chess',
    defaultWidth: 700, defaultHeight: 560, minWidth: 500, minHeight: 400, singleton: false,
  },
  minesweeper: {
    id: 'minesweeper', name: '扫雷', description: '经典扫雷游戏',
    category: 'Games', icon: 'Bomb', component: 'Minesweeper',
    defaultWidth: 400, defaultHeight: 500, minWidth: 300, minHeight: 350, singleton: false,
  },
  tetris: {
    id: 'tetris', name: '俄罗斯方块', description: '方块堆叠益智游戏',
    category: 'Games', icon: 'LayoutGrid', component: 'Tetris',
    defaultWidth: 450, defaultHeight: 600, minWidth: 350, minHeight: 450, singleton: false,
  },
  snake: {
    id: 'snake', name: '贪吃蛇', description: '控制蛇增长并避开墙壁',
    category: 'Games', icon: 'Snail', component: 'Snake',
    defaultWidth: 480, defaultHeight: 540, minWidth: 350, minHeight: 400, singleton: false,
  },
  solitaire: {
    id: 'solitaire', name: '纸牌', description: '克朗代克纸牌游戏',
    category: 'Games', icon: 'Clubs', component: 'Solitaire',
    defaultWidth: 700, defaultHeight: 560, minWidth: 500, minHeight: 400, singleton: false,
  },
  game2048: {
    id: 'game2048', name: '2048', description: '滑动方块达到 2048',
    category: 'Games', icon: 'Grid3X3', component: 'Game2048',
    defaultWidth: 420, defaultHeight: 540, minWidth: 340, minHeight: 420, singleton: false,
  },
  tictactoe: {
    id: 'tictactoe', name: '井字棋', description: '经典井字棋，支持 AI 对战',
    category: 'Games', icon: 'XCircle', component: 'TicTacToe',
    defaultWidth: 360, defaultHeight: 440, minWidth: 300, minHeight: 350, singleton: false,
  },
  memorymatch: {
    id: 'memorymatch', name: '记忆翻牌', description: '翻牌配对游戏',
    category: 'Games', icon: 'Brain', component: 'MemoryMatch',
    defaultWidth: 380, defaultHeight: 480, minWidth: 300, minHeight: 380, singleton: false,
  },
  sudoku: {
    id: 'sudoku', name: '数独', description: '带求解器的数字益智游戏',
    category: 'Games', icon: 'Grid2X2', component: 'Sudoku',
    defaultWidth: 480, defaultHeight: 540, minWidth: 380, minHeight: 420, singleton: false,
  },
  pong: {
    id: 'pong', name: '乒乓球', description: '经典挡板球游戏',
    category: 'Games', icon: 'CircleDot', component: 'Pong',
    defaultWidth: 640, defaultHeight: 480, minWidth: 480, minHeight: 360, singleton: false,
  },

  // Utility Accessories
  password: {
    id: 'password', name: '密码生成器', description: '生成安全密码',
    category: 'Accessories', icon: 'KeyRound', component: 'PasswordGenerator',
    defaultWidth: 400, defaultHeight: 560, minWidth: 320, minHeight: 420, singleton: true,
  },
  qrcode: {
    id: 'qrcode', name: '二维码生成器', description: '从文本生成二维码',
    category: 'Accessories', icon: 'QrCode', component: 'QRCodeGenerator',
    defaultWidth: 460, defaultHeight: 560, minWidth: 360, minHeight: 420, singleton: false,
  },
  converter: {
    id: 'converter', name: '单位换算', description: '单位之间换算',
    category: 'Accessories', icon: 'ArrowLeftRight', component: 'UnitConverter',
    defaultWidth: 440, defaultHeight: 520, minWidth: 340, minHeight: 400, singleton: true,
  },
  stickynotes: {
    id: 'stickynotes', name: '便签', description: '创建和管理便签',
    category: 'Accessories', icon: 'StickyNote', component: 'StickyNotes',
    defaultWidth: 500, defaultHeight: 440, minWidth: 380, minHeight: 320, singleton: false,
  },
  fonts: {
    id: 'fonts', name: '字体查看器', description: '预览和比较字体',
    category: 'Accessories', icon: 'Type', component: 'FontViewer',
    defaultWidth: 600, defaultHeight: 480, minWidth: 440, minHeight: 360, singleton: true,
  },
  archiver: {
    id: 'archiver', name: '归档管理器', description: '浏览和管理归档文件',
    category: 'Accessories', icon: 'Archive', component: 'ArchiveManager',
    defaultWidth: 580, defaultHeight: 460, minWidth: 400, minHeight: 340, singleton: false,
  },
};

export const useAppRegistryStore = create<AppRegistryStore>((set, get) => ({
  apps: defaultApps,

  registerApp: (app) =>
    set((state) => ({
      apps: { ...state.apps, [app.id]: app },
    })),

  getApp: (id) => get().apps[id],

  getAppsByCategory: (category) =>
    Object.values(get().apps).filter((app) => app.category === category),

  getAllCategories: () => {
    const cats = new Set(Object.values(get().apps).map((a) => a.category));
    return Array.from(cats).sort();
  },
}));
