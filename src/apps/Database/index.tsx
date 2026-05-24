import { useState, useMemo, useCallback } from 'react';
import {
  Plus, Trash2, Edit3, Save, X, Play, Table2, Database as DbIcon,
  ChevronRight, ChevronDown, Search, AlertCircle, CheckCircle,
} from 'lucide-react';

interface DatabaseProps {
  windowId: string;
}

interface Column {
  name: string;
  type: 'TEXT' | 'INTEGER' | 'REAL' | 'BOOLEAN';
}

interface Table {
  name: string;
  columns: Column[];
  rows: Record<string, any>[];
}

interface QueryResult {
  success: boolean;
  message: string;
  data?: Record<string, any>[];
  columns?: string[];
}

export default function Database({ windowId: _windowId }: DatabaseProps) {
  const [tables, setTables] = useState<Table[]>([
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'INTEGER' },
        { name: 'name', type: 'TEXT' },
        { name: 'email', type: 'TEXT' },
        { name: 'age', type: 'INTEGER' },
        { name: 'active', type: 'BOOLEAN' },
      ],
      rows: [
        { id: 1, name: 'Alice', email: 'alice@example.com', age: 30, active: true },
        { id: 2, name: 'Bob', email: 'bob@example.com', age: 25, active: true },
        { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35, active: false },
      ],
    },
    {
      name: 'products',
      columns: [
        { name: 'id', type: 'INTEGER' },
        { name: 'name', type: 'TEXT' },
        { name: 'price', type: 'REAL' },
        { name: 'stock', type: 'INTEGER' },
      ],
      rows: [
        { id: 1, name: 'Laptop', price: 999.99, stock: 50 },
        { id: 2, name: 'Mouse', price: 29.99, stock: 200 },
        { id: 3, name: 'Keyboard', price: 79.99, stock: 100 },
      ],
    },
  ]);

  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newColumns, setNewColumns] = useState<Column[]>([{ name: 'id', type: 'INTEGER' }]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRowValues, setNewRowValues] = useState<Record<string, any>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState<Record<string, boolean>>({});

  const currentTable = tables.find(t => t.name === selectedTable);

  const getNextId = (table: Table): number => {
    const idCol = table.columns.find(c => c.name === 'id');
    if (idCol && idCol.type === 'INTEGER') {
      return Math.max(0, ...table.rows.map(r => r.id || 0)) + 1;
    }
    return 0;
  };

  // Create table
  const handleCreateTable = () => {
    if (!newTableName.trim()) return;
    if (tables.some(t => t.name === newTableName.trim())) {
      setQueryResult({ success: false, message: `表 "${newTableName}" 已存在` });
      return;
    }
    setTables([...tables, { name: newTableName.trim(), columns: [...newColumns], rows: [] }]);
    setSelectedTable(newTableName.trim());
    setShowCreateTable(false);
    setNewTableName('');
    setNewColumns([{ name: 'id', type: 'INTEGER' }]);
    setQueryResult({ success: true, message: `表 "${newTableName}" 已创建` });
  };

  // Delete table
  const handleDeleteTable = (name: string) => {
    setTables(tables.filter(t => t.name !== name));
    if (selectedTable === name) setSelectedTable(tables[0]?.name || '');
    setQueryResult({ success: true, message: `表 "${name}" 已删除` });
  };

  // Add row
  const handleAddRow = () => {
    if (!currentTable) return;
    const values = { ...newRowValues };
    // Auto-generate id
    const idCol = currentTable.columns.find(c => c.name === 'id');
    if (idCol && idCol.type === 'INTEGER' && !values.id) {
      values.id = getNextId(currentTable);
    }
    setTables(tables.map(t => t.name === selectedTable ? { ...t, rows: [...t.rows, values] } : t));
    setShowAddRow(false);
    setNewRowValues({});
    setQueryResult({ success: true, message: '行已插入' });
  };

  // Delete row
  const handleDeleteRow = (idx: number) => {
    setTables(tables.map(t => t.name === selectedTable ? { ...t, rows: t.rows.filter((_, i) => i !== idx) } : t));
    setQueryResult({ success: true, message: '行已删除' });
  };

  // Edit row
  const startEditRow = (idx: number) => {
    setEditingRow(idx);
    setEditValues({ ...currentTable!.rows[idx] });
  };

  const saveEditRow = () => {
    if (editingRow === null) return;
    setTables(tables.map(t => {
      if (t.name !== selectedTable) return t;
      const rows = [...t.rows];
      rows[editingRow] = { ...editValues };
      return { ...t, rows };
    }));
    setEditingRow(null);
    setEditValues({});
    setQueryResult({ success: true, message: '行已更新' });
  };

  // Query parser - handles basic SELECT, INSERT, UPDATE, DELETE
  const executeQuery = useCallback(() => {
    const q = queryInput.trim();
    if (!q) return;

    try {
      // SELECT * FROM table [WHERE col = val]
      const selectMatch = q.match(/^SELECT\s+\*\s+FROM\s+(\w+)(?:\s+WHERE\s+(\w+)\s*=\s*(.+))?$/i);
      if (selectMatch) {
        const [, tableName, whereCol, whereVal] = selectMatch;
        const table = tables.find(t => t.name === tableName);
        if (!table) { setQueryResult({ success: false, message: `表 "${tableName}" 未找到` }); return; }
        let rows = [...table.rows];
        if (whereCol && whereVal) {
          const val = whereVal.replace(/^['"]|['"]$/g, '');
          rows = rows.filter(r => String(r[whereCol]) === val);
        }
        setQueryResult({ success: true, message: `返回 ${rows.length} 行`, data: rows, columns: table.columns.map(c => c.name) });
        if (tableName !== selectedTable) setSelectedTable(tableName);
        return;
      }

      // SELECT col1, col2 FROM table [WHERE col = val]
      const selectColsMatch = q.match(/^SELECT\s+(.+)\s+FROM\s+(\w+)(?:\s+WHERE\s+(\w+)\s*=\s*(.+))?$/i);
      if (selectColsMatch) {
        const [, colsStr, tableName, whereCol, whereVal] = selectColsMatch;
        const cols = colsStr.split(',').map(c => c.trim());
        const table = tables.find(t => t.name === tableName);
        if (!table) { setQueryResult({ success: false, message: `表 "${tableName}" 未找到` }); return; }
        let rows = [...table.rows];
        if (whereCol && whereVal) {
          const val = whereVal.replace(/^['"]|['"]$/g, '');
          rows = rows.filter(r => String(r[whereCol]) === val);
        }
        const projected = rows.map(r => {
          const obj: Record<string, any> = {};
          cols.forEach(c => { obj[c] = r[c]; });
          return obj;
        });
        setQueryResult({ success: true, message: `返回 ${projected.length} 行`, data: projected, columns: cols });
        return;
      }

      // INSERT INTO table (col1, col2) VALUES (val1, val2)
      const insertMatch = q.match(/^INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)$/i);
      if (insertMatch) {
        const [, tableName, colsStr, valsStr] = insertMatch;
        const table = tables.find(t => t.name === tableName);
        if (!table) { setQueryResult({ success: false, message: `表 "${tableName}" 未找到` }); return; }
        const cols = colsStr.split(',').map(c => c.trim());
        const vals = valsStr.split(',').map(v => {
          const trimmed = v.trim();
          if (trimmed.startsWith("'") || trimmed.startsWith('"')) return trimmed.replace(/^['"]|['"]$/g, '');
          if (trimmed === 'true') return true;
          if (trimmed === 'false') return false;
          if (trimmed === 'null') return null;
          const num = Number(trimmed);
          return isNaN(num) ? trimmed : num;
        });
        const row: Record<string, any> = {};
        cols.forEach((c, i) => { row[c] = vals[i]; });
        // Auto id
        if (!row.id && table.columns.some(c => c.name === 'id' && c.type === 'INTEGER')) {
          row.id = getNextId(table);
        }
        setTables(tables.map(t => t.name === tableName ? { ...t, rows: [...t.rows, row] } : t));
        setQueryResult({ success: true, message: '已插入 1 行' });
        if (tableName !== selectedTable) setSelectedTable(tableName);
        return;
      }

      // UPDATE table SET col = val [WHERE col = val]
      const updateMatch = q.match(/^UPDATE\s+(\w+)\s+SET\s+(\w+)\s*=\s*(.+?)(?:\s+WHERE\s+(\w+)\s*=\s*(.+))?$/i);
      if (updateMatch) {
        const [, tableName, setCol, setVal, whereCol, whereVal] = updateMatch;
        const table = tables.find(t => t.name === tableName);
        if (!table) { setQueryResult({ success: false, message: `表 "${tableName}" 未找到` }); return; }
        let val: any = setVal.replace(/^['"]|['"]$/g, '');
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(Number(val))) val = Number(val);

        setTables(tables.map(t => {
          if (t.name !== tableName) return t;
          let rows = [...t.rows];
          if (whereCol && whereVal) {
            const wVal = whereVal.replace(/^['"]|['"]$/g, '');
            rows = rows.map(r => String(r[whereCol]) === wVal ? { ...r, [setCol]: val } : r);
          } else {
            rows = rows.map(r => ({ ...r, [setCol]: val }));
          }
          return { ...t, rows };
        }));
        setQueryResult({ success: true, message: '行已更新' });
        return;
      }

      // DELETE FROM table [WHERE col = val]
      const deleteMatch = q.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(\w+)\s*=\s*(.+))?$/i);
      if (deleteMatch) {
        const [, tableName, whereCol, whereVal] = deleteMatch;
        const table = tables.find(t => t.name === tableName);
        if (!table) { setQueryResult({ success: false, message: `表 "${tableName}" 未找到` }); return; }
        let count = 0;
        setTables(tables.map(t => {
          if (t.name !== tableName) return t;
          let rows = [...t.rows];
          if (whereCol && whereVal) {
            const wVal = whereVal.replace(/^['"]|['"]$/g, '');
            const before = rows.length;
            rows = rows.filter(r => String(r[whereCol]) !== wVal);
            count = before - rows.length;
          } else {
            count = rows.length;
            rows = [];
          }
          return { ...t, rows };
        }));
        setQueryResult({ success: true, message: `已删除 ${count} 行` });
        return;
      }

      // SHOW TABLES
      if (/^SHOW\s+TABLES$/i.test(q)) {
        setQueryResult({
          success: true,
          message: `${tables.length} 个表`,
          data: tables.map(t => ({ name: t.name, columns: t.columns.length, rows: t.rows.length })),
          columns: ['name', 'columns', 'rows'],
        });
        return;
      }

      setQueryResult({ success: false, message: '不支持的查询。请使用 SELECT/INSERT/UPDATE/DELETE 或 SHOW TABLES。' });
    } catch (e: any) {
      setQueryResult({ success: false, message: e.message });
    }
  }, [queryInput, tables, selectedTable]);

  const renderCellValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-[var(--text-muted)] italic">NULL</span>;
    if (typeof val === 'boolean') return <span className={val ? 'text-green-400' : 'text-red-400'}>{String(val)}</span>;
    if (typeof val === 'number') return <span className="text-blue-300">{val}</span>;
    return <span>{String(val)}</span>;
  };

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <DbIcon size={14} className="text-[var(--accent-silver)]" />
        <span className="text-xs font-medium text-[var(--text-secondary)]">数据库管理器</span>
        <button onClick={() => setShowCreateTable(true)} className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--accent-silver)' }}>
          <Plus size={12} /> 新建表
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: table list */}
        <div className="w-48 border-r flex flex-col overflow-hidden" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
          <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] border-b" style={{ borderColor: 'var(--border-default)' }}>数据表</div>
          <div className="flex-1 overflow-y-auto p-1">
            {tables.map((t) => (
              <div key={t.name}>
                <div
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer ${t.name === selectedTable ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)]'}`}
                  onClick={() => setSelectedTable(t.name)}
                >
                  <Table2 size={12} className="text-[var(--accent-silver)]" />
                  <span className="text-xs text-[var(--text-primary)] flex-1 truncate">{t.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">{t.rows.length}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTable(t.name); }} className="p-0.5 rounded hover:bg-red-900/20">
                    <Trash2 size={10} className="text-red-400 opacity-60 hover:opacity-100" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Query input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') executeQuery(); }}
              placeholder="输入 SQL 查询 (SELECT/INSERT/UPDATE/DELETE)..."
              className="flex-1 h-8 px-2 rounded text-xs font-mono outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
              spellCheck={false}
            />
            <button onClick={executeQuery} className="px-3 py-1.5 rounded text-xs text-white hover:opacity-90 flex items-center gap-1" style={{ background: 'var(--accent-silver)' }}>
              <Play size={12} /> 运行
            </button>
          </div>

          {/* Query result message */}
          {queryResult && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs border-b" style={{ borderColor: 'var(--border-default)', background: queryResult.success ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)' }}>
              {queryResult.success ? <CheckCircle size={12} className="text-green-400" /> : <AlertCircle size={12} className="text-red-400" />}
              <span style={{ color: queryResult.success ? '#22c55e' : '#ef4444' }}>{queryResult.message}</span>
            </div>
          )}

          {/* Table content */}
          {currentTable && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Table header with actions */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: 'var(--border-default)' }}>
                <div className="flex items-center gap-2">
                  <Table2 size={14} className="text-[var(--accent-silver)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{currentTable.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">({currentTable.rows.length} 行, {currentTable.columns.length} 列)</span>
                </div>
                <button onClick={() => { setShowAddRow(true); setNewRowValues({}); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--accent-silver)' }}>
                  <Plus size={12} /> 添加行
                </button>
              </div>

              {/* Table data */}
              <div className="flex-1 overflow-auto">
                {queryResult?.data ? (
                  /* Query result table */
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--bg-window)' }}>
                        {queryResult.columns?.map(col => (
                          <th key={col} className="px-3 py-2 text-left font-medium text-[var(--text-secondary)] border-b" style={{ borderColor: 'var(--border-default)' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.data.map((row, i) => (
                        <tr key={i} className="hover:bg-[var(--bg-hover)]">
                          {queryResult.columns?.map(col => (
                            <td key={col} className="px-3 py-1.5 border-b" style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}>{renderCellValue(row[col])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  /* Current table view */
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--bg-window)' }}>
                        {currentTable.columns.map(col => (
                          <th key={col.name} className="px-3 py-2 text-left font-medium text-[var(--text-secondary)] border-b whitespace-nowrap" style={{ borderColor: 'var(--border-default)' }}>
                            {col.name} <span className="text-[var(--text-muted)] font-normal">({col.type})</span>
                          </th>
                        ))}
                        <th className="px-3 py-2 text-right border-b" style={{ borderColor: 'var(--border-default)' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTable.rows.map((row, ri) => (
                        <tr key={ri} className="hover:bg-[var(--bg-hover)]">
                          {currentTable.columns.map(col => (
                            <td key={col.name} className="px-3 py-1.5 border-b" style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}>
                              {editingRow === ri ? (
                                <input
                                  value={editValues[col.name] ?? ''}
                                  onChange={(e) => {
                                    let val: any = e.target.value;
                                    if (col.type === 'INTEGER') val = parseInt(val) || 0;
                                    else if (col.type === 'REAL') val = parseFloat(val) || 0;
                                    else if (col.type === 'BOOLEAN') val = val === 'true';
                                    setEditValues({ ...editValues, [col.name]: val });
                                  }}
                                  className="w-full h-6 px-1 rounded text-xs font-mono outline-none"
                                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--accent-silver)' }}
                                />
                              ) : (
                                renderCellValue(row[col.name])
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-1.5 border-b text-right whitespace-nowrap" style={{ borderColor: 'var(--border-default)' }}>
                            {editingRow === ri ? (
                              <>
                                <button onClick={saveEditRow} className="p-1 rounded hover:bg-[var(--bg-hover)]"><Save size={12} className="text-green-400" /></button>
                                <button onClick={() => setEditingRow(null)} className="p-1 rounded hover:bg-[var(--bg-hover)]"><X size={12} className="text-[var(--text-muted)]" /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditRow(ri)} className="p-1 rounded hover:bg-[var(--bg-hover)]"><Edit3 size={12} className="text-[var(--text-muted)]" /></button>
                                <button onClick={() => handleDeleteRow(ri)} className="p-1 rounded hover:bg-[var(--bg-hover)]"><Trash2 size={12} className="text-red-400" /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {currentTable.rows.length === 0 && (
                        <tr>
                          <td colSpan={currentTable.columns.length + 1} className="px-3 py-8 text-center text-[var(--text-muted)]">
                            表中无数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add row dialog */}
      {showAddRow && currentTable && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-96 rounded-xl p-4" style={{ background: 'var(--bg-window)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">向 {currentTable.name} 添加行</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {currentTable.columns.filter(c => !(c.name === 'id' && c.type === 'INTEGER')).map(col => (
                <div key={col.name} className="flex items-center gap-2">
                  <label className="w-24 text-xs text-[var(--text-muted)]">{col.name} ({col.type})</label>
                  <input
                    value={newRowValues[col.name] ?? ''}
                    onChange={(e) => {
                      let val: any = e.target.value;
                      if (col.type === 'INTEGER') val = parseInt(val) || 0;
                      else if (col.type === 'REAL') val = parseFloat(val) || 0;
                      else if (col.type === 'BOOLEAN') val = val === 'true';
                      setNewRowValues({ ...newRowValues, [col.name]: val });
                    }}
                    placeholder={col.type === 'BOOLEAN' ? 'true/false' : col.type}
                    className="flex-1 h-7 px-2 rounded text-xs font-mono outline-none"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowAddRow(false)} className="flex-1 py-2 rounded text-sm hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>取消</button>
              <button onClick={handleAddRow} className="flex-1 py-2 rounded text-sm text-white" style={{ background: 'var(--accent-silver)' }}>插入</button>
            </div>
          </div>
        </div>
      )}

      {/* Create table dialog */}
      {showCreateTable && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-96 rounded-xl p-4" style={{ background: 'var(--bg-window)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">创建表</h3>
            <input
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="表名"
              className="w-full h-8 px-2 rounded text-sm outline-none mb-3"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
              autoFocus
            />
            <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto">
              {newColumns.map((col, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={col.name}
                    onChange={(e) => {
                      const updated = [...newColumns];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setNewColumns(updated);
                    }}
                    placeholder="列名"
                    className="flex-1 h-7 px-2 rounded text-xs font-mono outline-none"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
                  />
                  <select
                    value={col.type}
                    onChange={(e) => {
                      const updated = [...newColumns];
                      updated[i] = { ...updated[i], type: e.target.value as Column['type'] };
                      setNewColumns(updated);
                    }}
                    className="h-7 px-1 rounded text-xs outline-none"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
                  >
                    <option value="TEXT">TEXT</option>
                    <option value="INTEGER">INTEGER</option>
                    <option value="REAL">REAL</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                  </select>
                  {newColumns.length > 1 && (
                    <button onClick={() => setNewColumns(newColumns.filter((_, j) => j !== i))} className="p-1"><X size={12} className="text-[var(--text-muted)]" /></button>
                  )}
                </div>
              ))}
              <button onClick={() => setNewColumns([...newColumns, { name: '', type: 'TEXT' }])} className="text-xs text-[var(--accent-silver)] hover:underline">
                + 添加列
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCreateTable(false)} className="flex-1 py-2 rounded text-sm hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>取消</button>
              <button onClick={handleCreateTable} className="flex-1 py-2 rounded text-sm text-white" style={{ background: 'var(--accent-silver)' }}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
        <span>{tables.length} 个表</span>
        <span>{currentTable ? `${currentTable.name}: ${currentTable.rows.length} 行` : '未选择表'}</span>
      </div>
    </div>
  );
}
