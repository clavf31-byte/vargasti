import { useState, useCallback } from "react";

export type ColType = "text" | "number" | "date";

export type FilterRule = {
  id: string;
  col: number;
  type: "text" | "number" | "date";
  operator: string;
  value: string;
  value2?: string;
};

export type HistoryItem = {
  id: string;
  fileName: string;
  rows: number;
  cols: number;
  importedAt: string;
};

export type SheetData = {
  headers: string[];
  rows: string[][];
  types: ColType[];
};

export type ProcvConfig = {
  mainKey: number;
  lookupKey: number;
  columns: number[];
};

export type ProcvResults = {
  found: number;
  notFound: number;
  notFoundRows: number[];
};

export type CompareConfig = {
  mode: "same_file" | "second_file";
  sheet1: string;
  key1: number;
  sheet2: string;
  key2: number;
  returnCols: number[];
};

export type CompareResult = {
  sheet1Name: string;
  sheet2Name: string;
  mergedHeaders: string[];
  total1: number;
  total2: number;
  found: number;
  notFound: number;
  percent: number;
  foundRows: string[][];
  notFoundRows: string[][];
  mergedRows: string[][];
};

export function detectColType(values: string[]): ColType {
  const nonEmpty = values.filter((v) => v.trim() !== "").slice(0, 50);
  if (nonEmpty.length === 0) return "text";
  const dateRe = /^(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}-\d{2}-\d{2})$/;
  const numRe = /^-?\d+([.,]\d+)?$/;
  const datesCount = nonEmpty.filter((v) => dateRe.test(v.trim())).length;
  const numsCount = nonEmpty.filter((v) => numRe.test(v.trim().replace(/\s/g, ""))).length;
  if (datesCount / nonEmpty.length > 0.7) return "date";
  if (numsCount / nonEmpty.length > 0.7) return "number";
  return "text";
}

export function normalizeDate(val: string): Date | null {
  const s = val.trim();
  const ddmmyyyy = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const d = new Date(+ddmmyyyy[3], +ddmmyyyy[2] - 1, +ddmmyyyy[1]);
    return isNaN(d.getTime()) ? null : d;
  }
  const yyyymmdd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) {
    const d = new Date(+yyyymmdd[1], +yyyymmdd[2] - 1, +yyyymmdd[3]);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function applyFilter(cellVal: string, rule: FilterRule): boolean {
  const v = cellVal.trim();
  const rv = rule.value.trim();

  if (rule.type === "text") {
    const vl = v.toLowerCase();
    const rvl = rv.toLowerCase();
    switch (rule.operator) {
      case "contains": return vl.includes(rvl);
      case "not_contains": return !vl.includes(rvl);
      case "equals": return vl === rvl;
      case "not_equals": return vl !== rvl;
      case "starts_with": return vl.startsWith(rvl);
      case "ends_with": return vl.endsWith(rvl);
      case "empty": return v === "";
      case "not_empty": return v !== "";
      default: return true;
    }
  }

  if (rule.type === "number") {
    const num = parseFloat(v.replace(",", "."));
    const rnum = parseFloat(rv.replace(",", "."));
    const rnum2 = parseFloat((rule.value2 ?? "").replace(",", "."));
    switch (rule.operator) {
      case "equals": return num === rnum;
      case "not_equals": return num !== rnum;
      case "gt": return num > rnum;
      case "lt": return num < rnum;
      case "between": return num >= rnum && num <= rnum2;
      case "empty": return v === "";
      case "not_empty": return v !== "";
      default: return true;
    }
  }

  if (rule.type === "date") {
    const d = normalizeDate(v);
    const rd = normalizeDate(rv);
    const rd2 = normalizeDate(rule.value2 ?? "");
    switch (rule.operator) {
      case "date_exact": return d !== null && rd !== null && d.getTime() === rd.getTime();
      case "before": return d !== null && rd !== null && d < rd;
      case "after": return d !== null && rd !== null && d > rd;
      case "between_dates": return d !== null && rd !== null && rd2 !== null && d >= rd && d <= rd2;
      case "month": return d !== null && (d.getMonth() + 1) === parseInt(rv);
      case "year": return d !== null && d.getFullYear() === parseInt(rv);
      case "empty": return v === "";
      case "not_empty": return v !== "";
      default: return true;
    }
  }

  return true;
}

export function useExcelStore() {
  const [fileName, setFileName] = useState("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [sheetData, setSheetData] = useState<Record<string, SheetData>>({});
  const [editedCells, setEditedCells] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<Record<number, boolean>>({});
  const [colRenames, setColRenames] = useState<Record<number, string>>({});
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("AND");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [globalSearch, setGlobalSearch] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("excel-history") || "[]"); } catch { return []; }
  });
  const [procvSheet, setProcvSheet] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [procvSheetName, setProcvSheetName] = useState("");
  const [procvConfig, setProcvConfig] = useState<ProcvConfig | null>(null);
  const [procvResults, setProcvResults] = useState<ProcvResults>({ found: 0, notFound: 0, notFoundRows: [] });

  // Second file
  const [fileName2, setFileName2] = useState("");
  const [sheetNames2, setSheetNames2] = useState<string[]>([]);
  const [activeSheet2, setActiveSheet2] = useState("");
  const [sheetData2, setSheetData2] = useState<Record<string, SheetData>>({});
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

  function saveHistory(item: HistoryItem) {
    const updated = [item, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem("excel-history", JSON.stringify(updated));
  }

  function loadSheetData(data: Record<string, SheetData>, names: string[], name: string) {
    setSheetData(data);
    setSheetNames(names);
    setActiveSheet(name);
    setEditedCells(new Set());
    setVisibleCols({});
    setColRenames({});
    setFilters([]);
    setSortCol(null);
    setGlobalSearch("");
    setProcvSheet(null);
    setProcvConfig(null);
    setProcvResults({ found: 0, notFound: 0, notFoundRows: [] });
  }

  function loadSheetData2(data: Record<string, SheetData>, names: string[], name: string) {
    setSheetData2(data);
    setSheetNames2(names);
    setActiveSheet2(name);
    setCompareResult(null);
  }

  function resetFile2() {
    setFileName2("");
    setSheetData2({});
    setSheetNames2([]);
    setActiveSheet2("");
    setCompareResult(null);
  }

  function runCompare(cfg: CompareConfig) {
    const s1 = sheetData[cfg.sheet1];
    const s2 = cfg.mode === "same_file" ? sheetData[cfg.sheet2] : sheetData2[cfg.sheet2];
    if (!s1 || !s2) return;

    const normalize = (v: string) =>
      v.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");

    const lookupMap = new Map<string, string[]>();
    s2.rows.forEach((r) => {
      const key = normalize(r[cfg.key2] ?? "");
      if (key) lookupMap.set(key, r);
    });

    const returnHeaders = cfg.returnCols.map((c) => s2.headers[c] ?? `Col ${c + 1}`);
    const mergedHeaders = [...s1.headers, ...returnHeaders];
    const foundRows: string[][] = [];
    const notFoundRows: string[][] = [];
    const mergedRows: string[][] = [];

    s1.rows.forEach((row) => {
      const key = normalize(row[cfg.key1] ?? "");
      const match = lookupMap.get(key);
      const extra = cfg.returnCols.map((c) => match?.[c] ?? "");
      const merged = [...row, ...extra];
      mergedRows.push(merged);
      if (match) foundRows.push(merged);
      else notFoundRows.push(merged);
    });

    setCompareResult({
      sheet1Name: cfg.sheet1,
      sheet2Name: cfg.sheet2,
      mergedHeaders,
      total1: s1.rows.length,
      total2: s2.rows.length,
      found: foundRows.length,
      notFound: notFoundRows.length,
      percent: s1.rows.length > 0 ? Math.round((foundRows.length / s1.rows.length) * 100) : 0,
      foundRows,
      notFoundRows,
      mergedRows,
    });
  }

  function reset() {
    setFileName("");
    setSheetData({});
    setSheetNames([]);
    setActiveSheet("");
    setEditedCells(new Set());
    setVisibleCols({});
    setColRenames({});
    setFilters([]);
    setSortCol(null);
    setGlobalSearch("");
    setProcvSheet(null);
    setProcvConfig(null);
    setProcvResults({ found: 0, notFound: 0, notFoundRows: [] });
    setFileName2("");
    setSheetData2({});
    setSheetNames2([]);
    setActiveSheet2("");
    setCompareResult(null);
  }

  function isColVisible(idx: number) {
    return visibleCols[idx] ?? true;
  }

  function toggleCol(idx: number) {
    setVisibleCols((prev) => ({ ...prev, [idx]: !(prev[idx] ?? true) }));
  }

  function getDisplayHeader(idx: number) {
    const current = sheetData[activeSheet];
    const original = current?.headers[idx] ?? `Col ${idx + 1}`;
    return colRenames[idx] ?? original;
  }

  function updateCell(row: number, col: number, value: string) {
    setSheetData((prev) => {
      const sheet = prev[activeSheet];
      if (!sheet) return prev;
      const rows = sheet.rows.map((r, ri) =>
        ri === row ? r.map((v, ci) => (ci === col ? value : v)) : r
      );
      return { ...prev, [activeSheet]: { ...sheet, rows } };
    });
    setEditedCells((prev) => new Set(prev).add(`${row}-${col}`));
  }

  function getFilteredRows(): { rows: string[][]; indices: number[] } {
    const current = sheetData[activeSheet];
    if (!current) return { rows: [], indices: [] };

    let rows = current.rows.map((r, i) => ({ r, i }));

    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      rows = rows.filter(({ r }) => r.some((c) => c.toLowerCase().includes(q)));
    }

    if (filters.length > 0) {
      rows = rows.filter(({ r }) => {
        const results = filters.map((f) => applyFilter(r[f.col] ?? "", f));
        return filterLogic === "AND" ? results.every(Boolean) : results.some(Boolean);
      });
    }

    if (sortCol !== null) {
      const colType = current.types[sortCol] ?? "text";
      rows = [...rows].sort((a, b) => {
        const av = a.r[sortCol] ?? "";
        const bv = b.r[sortCol] ?? "";
        let cmp = 0;
        if (colType === "number") {
          cmp = parseFloat(av.replace(",", ".") || "0") - parseFloat(bv.replace(",", ".") || "0");
        } else if (colType === "date") {
          const da = normalizeDate(av);
          const db = normalizeDate(bv);
          cmp = (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
        } else {
          cmp = av.localeCompare(bv, "pt-BR");
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return { rows: rows.map((x) => x.r), indices: rows.map((x) => x.i) };
  }

  function applyProcv() {
    if (!procvConfig || !procvSheet) return;
    const current = sheetData[activeSheet];
    if (!current) return;

    const { mainKey, lookupKey, columns } = procvConfig;
    const lookupMap = new Map<string, string[]>();
    procvSheet.rows.forEach((r) => {
      const key = (r[lookupKey] ?? "").trim().toLowerCase();
      lookupMap.set(key, r);
    });

    const newHeaders = [...current.headers, ...columns.map((c) => procvSheet.headers[c] ?? `Col ${c + 1}`)];
    const notFoundRows: number[] = [];
    let found = 0;

    const newRows = current.rows.map((row, ri) => {
      const key = (row[mainKey] ?? "").trim().toLowerCase();
      const match = lookupMap.get(key);
      if (match) {
        found++;
        return [...row, ...columns.map((c) => match[c] ?? "")];
      } else {
        notFoundRows.push(ri);
        return [...row, ...columns.map(() => "")];
      }
    });

    const newTypes = [
      ...current.types,
      ...columns.map((c) => {
        const vals = procvSheet.rows.map((r) => r[c] ?? "");
        return detectColType(vals);
      }),
    ];

    setSheetData((prev) => ({
      ...prev,
      [activeSheet]: { headers: newHeaders, rows: newRows, types: newTypes },
    }));
    setProcvResults({ found, notFound: notFoundRows.length, notFoundRows });
  }

  const updateSheetData = useCallback((updater: (sheet: SheetData) => SheetData) => {
    setSheetData((prev) => {
      const sheet = prev[activeSheet];
      if (!sheet) return prev;
      return { ...prev, [activeSheet]: updater(sheet) };
    });
  }, [activeSheet]);

  return {
    fileName, setFileName,
    sheetNames,
    activeSheet, setActiveSheet,
    sheetData,
    editedCells,
    visibleCols, toggleCol, isColVisible,
    colRenames, setColRenames,
    filters, setFilters,
    filterLogic, setFilterLogic,
    sortCol, setSortCol,
    sortDir, setSortDir,
    globalSearch, setGlobalSearch,
    history, saveHistory,
    procvSheet, setProcvSheet,
    procvSheetName, setProcvSheetName,
    procvConfig, setProcvConfig,
    procvResults, setProcvResults,
    applyProcv,
    loadSheetData,
    reset,
    getDisplayHeader,
    getFilteredRows,
    updateCell,
    updateSheetData,
    // second file
    fileName2, setFileName2,
    sheetNames2,
    activeSheet2, setActiveSheet2,
    sheetData2,
    loadSheetData2,
    resetFile2,
    // compare
    compareResult,
    setCompareResult,
    runCompare,
  };
}
