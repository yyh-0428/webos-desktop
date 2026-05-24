import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Bold, AlignLeft, AlignCenter, AlignRight,
  Plus, Copy, ClipboardPaste, Trash2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

interface SpreadsheetProps {
  windowId: string;
}

const COLS = 26; // A-Z
const ROWS = 100;

function colLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

function colIndex(label: string): number {
  return label.charCodeAt(0) - 65;
}

interface CellData {
  value: string;
  formula: string;
  bold: boolean;
  align: 'left' | 'center' | 'right';
}

interface SheetData {
  name: string;
  cells: Record<string, CellData>;
}

function defaultCell(): CellData {
  return { value: '', formula: '', bold: false, align: 'left' };
}

function cellKey(row: number, col: number): string {
  return `${colLabel(col)}${row + 1}`;
}

function parseCellRef(ref: string): { col: number; row: number } | null {
  const match = ref.match(/^([A-Z])(\d+)$/);
  if (!match) return null;
  return { col: colIndex(match[1]), row: parseInt(match[2], 10) - 1 };
}

function evaluateFormula(formula: string, cells: Record<string, CellData>, visited: Set<string> = new Set()): string {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.substring(1).trim();

  // Function calls: SUM, AVERAGE, MIN, MAX, COUNT
  const fnMatch = expr.match(/^(SUM|AVERAGE|MIN|MAX|COUNT)\(([A-Z]\d+):([A-Z]\d+)\)$/i);
  if (fnMatch) {
    const fn = fnMatch[1].toUpperCase();
    const start = parseCellRef(fnMatch[2].toUpperCase());
    const end = parseCellRef(fnMatch[3].toUpperCase());
    if (!start || !end) return '#REF!';

    const values: number[] = [];
    for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
      for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
        const key = cellKey(r, c);
        if (visited.has(key)) return '#CIRC!';
        const cell = cells[key];
        if (!cell) continue;
        let val: string;
        if (cell.formula.startsWith('=')) {
          visited.add(key);
          val = evaluateFormula(cell.formula, cells, visited);
          visited.delete(key);
        } else {
          val = cell.value;
        }
        const num = parseFloat(val);
        if (!isNaN(num)) values.push(num);
      }
    }

    if (values.length === 0) return '0';
    switch (fn) {
      case 'SUM': return values.reduce((a, b) => a + b, 0).toString();
      case 'AVERAGE': return (values.reduce((a, b) => a + b, 0) / values.length).toString();
      case 'MIN': return Math.min(...values).toString();
      case 'MAX': return Math.max(...values).toString();
      case 'COUNT': return values.length.toString();
      default: return '#ERR!';
    }
  }

  // Cell references and arithmetic: =A1+B1, =A1*2, etc.
  try {
    let evalExpr = expr;
    // Replace cell references with values
    evalExpr = evalExpr.replace(/([A-Z])(\d+)/g, (match) => {
      const ref = parseCellRef(match);
      if (!ref) return '0';
      const key = cellKey(ref.row, ref.col);
      if (visited.has(key)) return '0';
      const cell = cells[key];
      if (!cell) return '0';
      let val: string;
      if (cell.formula.startsWith('=')) {
        visited.add(key);
        val = evaluateFormula(cell.formula, cells, visited);
        visited.delete(key);
      } else {
        val = cell.value;
      }
      const num = parseFloat(val);
      return isNaN(num) ? '0' : num.toString();
    });
    // Sanitize: only allow numbers, operators, parentheses, spaces, dots
    if (!/^[\d\s+\-*/().]+$/.test(evalExpr)) return '#ERR!';
    const result = Function(`"use strict"; return (${evalExpr})`)();
    if (typeof result === 'number' && isFinite(result)) {
      return Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, '');
    }
    return '#ERR!';
  } catch {
    return '#ERR!';
  }
}

export default function Spreadsheet({ windowId: _windowId }: SpreadsheetProps) {
  const [sheets, setSheets] = useState<SheetData[]>([
    { name: '工作表 1', cells: {} },
  ]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [colWidths, setColWidths] = useState<number[]>(Array(COLS).fill(100));
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [copiedCell, setCopiedCell] = useState<{ key: string; data: CellData } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSheet = sheets[activeSheet];
  const cells = currentSheet.cells;

  const getCellDisplay = useCallback((row: number, col: number): string => {
    const key = cellKey(row, col);
    const cell = cells[key];
    if (!cell) return '';
    if (cell.formula.startsWith('=')) {
      return evaluateFormula(cell.formula, cells);
    }
    return cell.value;
  }, [cells]);

  const getCellData = useCallback((row: number, col: number): CellData => {
    const key = cellKey(row, col);
    return cells[key] || defaultCell();
  }, [cells]);

  const updateCell = useCallback((row: number, col: number, updates: Partial<CellData>) => {
    const key = cellKey(row, col);
    setSheets((prev) => {
      const next = [...prev];
      const sheet = { ...next[activeSheet] };
      const cellData = sheet.cells[key] || defaultCell();
      sheet.cells = { ...sheet.cells, [key]: { ...cellData, ...updates } };
      next[activeSheet] = sheet;
      return next;
    });
  }, [activeSheet]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (editingCell) {
      // Commit current edit
      const key = cellKey(editingCell.row, editingCell.col);
      const isFormula = editValue.startsWith('=');
      updateCell(editingCell.row, editingCell.col, {
        value: isFormula ? evaluateFormula(editValue, cells) : editValue,
        formula: editValue,
      });
      setEditingCell(null);
    }
    setSelectedCell({ row, col });
    const key = cellKey(row, col);
    const cell = cells[key];
    setFormulaBarValue(cell?.formula || cell?.value || '');
  }, [editingCell, editValue, cells, updateCell]);

  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    setEditingCell({ row, col });
    const key = cellKey(row, col);
    const cell = cells[key];
    const val = cell?.formula || cell?.value || '';
    setEditValue(val);
    setFormulaBarValue(val);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [cells]);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const isFormula = editValue.startsWith('=');
    updateCell(editingCell.row, editingCell.col, {
      value: isFormula ? evaluateFormula(editValue, cells) : editValue,
      formula: editValue,
    });
    setEditingCell(null);
  }, [editingCell, editValue, cells, updateCell]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        commitEdit();
        setSelectedCell((prev) => ({ row: Math.min(prev.row + 1, ROWS - 1), col: prev.col }));
        const key = cellKey(Math.min(editingCell.row + 1, ROWS - 1), editingCell.col);
        const cell = cells[key];
        setFormulaBarValue(cell?.formula || cell?.value || '');
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        setSelectedCell((prev) => ({ row: prev.row, col: Math.min(prev.col + 1, COLS - 1) }));
      }
      return;
    }

    const { row, col } = selectedCell;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedCell({ row: Math.min(row + 1, ROWS - 1), col }); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedCell({ row: Math.max(row - 1, 0), col }); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setSelectedCell({ row, col: Math.min(col + 1, COLS - 1) }); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setSelectedCell({ row, col: Math.max(col - 1, 0) }); }
    else if (e.key === 'Enter') { handleCellDoubleClick(row, col); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      setSelectedCell({ row, col: Math.min(col + 1, COLS - 1) });
    }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      setEditingCell({ row, col });
      setEditValue(e.key);
      setFormulaBarValue(e.key);
    }

    // Ctrl+C / Ctrl+V
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      const key = cellKey(row, col);
      const cell = cells[key];
      if (cell) setCopiedCell({ key, data: { ...cell } });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedCell) {
      const key = cellKey(row, col);
      updateCell(row, col, { ...copiedCell.data, value: copiedCell.data.formula || copiedCell.data.value });
    }
  }, [selectedCell, editingCell, editValue, cells, commitEdit, handleCellDoubleClick, copiedCell, updateCell]);

  const addSheet = () => {
    const name = `工作表 ${sheets.length + 1}`;
    setSheets((prev) => [...prev, { name, cells: {} }]);
    setActiveSheet(sheets.length);
  };

  const deleteSheet = (index: number) => {
    if (sheets.length <= 1) return;
    setSheets((prev) => prev.filter((_, i) => i !== index));
    if (activeSheet >= sheets.length - 1) setActiveSheet(sheets.length - 2);
  };

  // Column resize
  const handleResizeStart = useCallback((colIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingCol(colIdx);
    setResizeStartX(e.clientX);
    setResizeStartWidth(colWidths[colIdx]);
  }, [colWidths]);

  useEffect(() => {
    if (resizingCol === null) return;
    const handleMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      setColWidths((prev) => {
        const next = [...prev];
        next[resizingCol!] = Math.max(50, resizeStartWidth + diff);
        return next;
      });
    };
    const handleUp = () => setResizingCol(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [resizingCol, resizeStartX, resizeStartWidth]);

  // Sync formula bar with selected cell
  useEffect(() => {
    if (editingCell) return;
    const key = cellKey(selectedCell.row, selectedCell.col);
    const cell = cells[key];
    setFormulaBarValue(cell?.formula || cell?.value || '');
  }, [selectedCell, cells, editingCell]);

  const toggleBold = () => {
    const data = getCellData(selectedCell.row, selectedCell.col);
    updateCell(selectedCell.row, selectedCell.col, { bold: !data.bold });
  };

  const setAlignment = (align: 'left' | 'center' | 'right') => {
    updateCell(selectedCell.row, selectedCell.col, { align });
  };

  const selectedKey = cellKey(selectedCell.row, selectedCell.col);
  const selectedCellData = getCellData(selectedCell.row, selectedCell.col);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--bg-workspace)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <button
          onClick={toggleBold}
          className={`p-1.5 rounded ${selectedCellData.bold ? 'bg-[var(--accent-silver)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
          title="粗体"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => setAlignment('left')}
          className={`p-1.5 rounded ${selectedCellData.align === 'left' ? 'bg-[var(--accent-silver)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
          title="左对齐"
        >
          <AlignLeft size={14} />
        </button>
        <button
          onClick={() => setAlignment('center')}
          className={`p-1.5 rounded ${selectedCellData.align === 'center' ? 'bg-[var(--accent-silver)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
          title="居中对齐"
        >
          <AlignCenter size={14} />
        </button>
        <button
          onClick={() => setAlignment('right')}
          className={`p-1.5 rounded ${selectedCellData.align === 'right' ? 'bg-[var(--accent-silver)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
          title="右对齐"
        >
          <AlignRight size={14} />
        </button>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

        <button
          onClick={() => {
            const key = cellKey(selectedCell.row, selectedCell.col);
            const cell = cells[key];
            if (cell) setCopiedCell({ key, data: { ...cell } });
          }}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="复制"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={() => {
            if (copiedCell) {
              updateCell(selectedCell.row, selectedCell.col, { ...copiedCell.data });
            }
          }}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="粘贴"
        >
          <ClipboardPaste size={14} />
        </button>
        <button
          onClick={() => {
            updateCell(selectedCell.row, selectedCell.col, defaultCell());
          }}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="清除单元格"
        >
          <Trash2 size={14} />
        </button>

        <div className="flex-1" />

        <span className="text-xs text-[var(--text-muted)]">
          单元格: {selectedKey}
        </span>
      </div>

      {/* Formula bar */}
      <div className="flex items-center gap-2 px-2 py-1 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <span className="text-xs font-mono font-medium text-[var(--text-secondary)] w-10 text-center" style={{ background: 'var(--bg-input)', borderRadius: 4, padding: '2px 4px' }}>
          {selectedKey}
        </span>
        <span className="text-xs text-[var(--text-muted)]">fx</span>
        <input
          value={formulaBarValue}
          onChange={(e) => {
            setFormulaBarValue(e.target.value);
            if (editingCell) {
              setEditValue(e.target.value);
            } else {
              // Edit selected cell formula directly
              const val = e.target.value;
              const isFormula = val.startsWith('=');
              updateCell(selectedCell.row, selectedCell.col, {
                value: isFormula ? evaluateFormula(val, cells) : val,
                formula: val,
              });
            }
          }}
          onFocus={() => {
            if (!editingCell) {
              setEditingCell(selectedCell);
              setEditValue(formulaBarValue);
            }
          }}
          className="flex-1 h-7 px-2 rounded text-xs outline-none font-mono"
          style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
        />
      </div>

      {/* Grid */}
      <div ref={gridRef} className="flex-1 overflow-auto relative" tabIndex={0} onKeyDown={handleKeyDown}>
        <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 w-12 h-7 text-xs text-[var(--text-muted)] border" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }} />
              {Array.from({ length: COLS }, (_, c) => (
                <th
                  key={c}
                  className="sticky top-0 z-20 h-7 text-xs text-[var(--text-muted)] border relative select-none"
                  style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', width: colWidths[c] }}
                >
                  {colLabel(c)}
                  <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[var(--accent-silver)]"
                    onMouseDown={(e) => handleResizeStart(c, e)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 30 }, (_, r) => (
              <tr key={r}>
                <td
                  className="sticky left-0 z-10 h-7 text-xs text-center text-[var(--text-muted)] border select-none"
                  style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', width: 48 }}
                >
                  {r + 1}
                </td>
                {Array.from({ length: COLS }, (_, c) => {
                  const isSelected = selectedCell.row === r && selectedCell.col === c;
                  const isEditing = editingCell?.row === r && editingCell?.col === c;
                  const data = getCellData(r, c);
                  const display = getCellDisplay(r, c);
                  const hasError = display.startsWith('#');

                  return (
                    <td
                      key={c}
                      className="h-7 border cursor-cell relative"
                      style={{
                        borderColor: 'var(--border-default)',
                        background: isSelected ? 'rgba(74, 134, 232, 0.12)' : 'var(--bg-workspace)',
                        outline: isSelected ? '2px solid var(--accent-silver)' : 'none',
                        outlineOffset: -1,
                        width: colWidths[c],
                      }}
                      onClick={() => handleCellClick(r, c)}
                      onDoubleClick={() => handleCellDoubleClick(r, c)}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => {
                            setEditValue(e.target.value);
                            setFormulaBarValue(e.target.value);
                          }}
                          onBlur={commitEdit}
                          className="w-full h-full px-1 text-xs outline-none"
                          style={{
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            fontWeight: data.bold ? 'bold' : 'normal',
                            textAlign: data.align,
                          }}
                        />
                      ) : (
                        <div
                          className="w-full h-full px-1 text-xs truncate leading-7"
                          style={{
                            color: hasError ? '#ef4444' : 'var(--text-primary)',
                            fontWeight: data.bold ? 'bold' : 'normal',
                            textAlign: data.align,
                          }}
                        >
                          {display}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet tabs */}
      <div className="flex items-center gap-0 px-1 py-1 border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <button
          onClick={() => setActiveSheet(Math.max(0, activeSheet - 1))}
          className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
        >
          <ChevronLeft size={14} />
        </button>
        {sheets.map((sheet, i) => (
          <button
            key={i}
            onClick={() => setActiveSheet(i)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              i === activeSheet
                ? 'bg-[var(--accent-silver)] text-white font-medium'
                : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
            }`}
            onDoubleClick={() => {
              const name = prompt('重命名工作表:', sheet.name);
              if (name) {
                setSheets((prev) => {
                  const next = [...prev];
                  next[i] = { ...next[i], name };
                  return next;
                });
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (sheets.length > 1 && confirm(`确定删除"${sheet.name}"？`)) {
                deleteSheet(i);
              }
            }}
          >
            {sheet.name}
          </button>
        ))}
        <button
          onClick={addSheet}
          className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] ml-1"
          title="添加工作表"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
