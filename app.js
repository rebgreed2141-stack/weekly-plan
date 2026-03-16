
(() => {
  "use strict";

  const jpDow = ["日", "月", "火", "水", "木", "金", "土"];
  const classToAge = {
    "もみじ": 0,
    "どんぐり": 1,
    "こぐま": 2,
    "りす": 3,
    "のうさぎ": 4,
    "かもしか": 5
  };
  const classMarks = {
    "もみじ": "も",
    "どんぐり": "ど",
    "こぐま": "こ",
    "りす": "り",
    "のうさぎ": "の",
    "かもしか": "か"
  };
  const classOrder = ["もみじ", "どんぐり", "こぐま", "りす", "のうさぎ", "かもしか"];
  const STORAGE_PREFIX = "weekly_";
  const BACKUP_HEADERS = [
    "classKey",
    "startDate",
    "weeklyAim",
    "events",
    "day0Date",
    "day0Activity",
    "day0Evaluation",
    "day0Attendance",
    "day1Date",
    "day1Activity",
    "day1Evaluation",
    "day1Attendance",
    "day2Date",
    "day2Activity",
    "day2Evaluation",
    "day2Attendance",
    "day3Date",
    "day3Activity",
    "day3Evaluation",
    "day3Attendance",
    "day4Date",
    "day4Activity",
    "day4Evaluation",
    "day4Attendance",
    "day5Date",
    "day5Activity",
    "day5Evaluation",
    "day5Attendance",
    "weeklyEvaluation",
    "case1Date",
    "case1Text",
    "case2Date",
    "case2Text"
  ];

  const el = {
    classSelect: document.getElementById("classSelect"),
    weekLabel: document.getElementById("weekLabel"),
    classLabel: document.getElementById("classLabel"),
    weeklyAim: document.getElementById("weeklyAim"),
    events: document.getElementById("events"),
    journalBody: document.getElementById("journalBody"),
    weeklyEvaluation: document.getElementById("weeklyEvaluation"),
    case1Date: document.getElementById("case1Date"),
    case1Text: document.getElementById("case1Text"),
    case2Date: document.getElementById("case2Date"),
    case2Text: document.getElementById("case2Text"),
    weekKeyView: document.getElementById("weekKeyView"),
    lastSavedView: document.getElementById("lastSavedView"),
    btnClear: document.getElementById("btnClear"),
    btnBackup: document.getElementById("btnBackup"),
    btnRestore: document.getElementById("btnRestore"),
    btnDeleteAll: document.getElementById("btnDeleteAll"),
    restoreFileInput: document.getElementById("restoreFileInput"),
    tabMainBtn: document.getElementById("tabMainBtn"),
    tabCalendarBtn: document.getElementById("tabCalendarBtn"),
    tabManageBtn: document.getElementById("tabManageBtn"),
    tabMain: document.getElementById("tabMain"),
    tabCalendar: document.getElementById("tabCalendar"),
    tabManage: document.getElementById("tabManage"),
    btnPrevMonth: document.getElementById("btnPrevMonth"),
    btnNextMonth: document.getElementById("btnNextMonth"),
    calendarTitle: document.getElementById("calendarTitle"),
    calendarGrid: document.getElementById("calendarGrid")
  };

  const calendarState = (() => {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1
    };
  })();

  let currentStartDateIso = "";
  let saveTimer = null;

  const pad2 = (n) => String(n).padStart(2, "0");

  function createLocalDate(year, month, day) {
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  function parseISODate(value) {
    if (!value) return null;
    const m = String(value).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) return null;
    return createLocalDate(Number(m[1]), Number(m[2]), Number(m[3]));
  }

  function toISO(dateObj) {
    return `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}`;
  }

  function addDays(dateObj, days) {
    const d = new Date(dateObj.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function formatMD(dateObj) {
    return `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
  }

  function formatMDJpDow(dateObj) {
    return `${formatMD(dateObj)}（${jpDow[dateObj.getDay()]}）`;
  }

  function nowIso() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  }

  function excelSerialToDate(serial) {
    const n = Number(serial);
    if (!Number.isFinite(n)) return null;
    const utcDays = Math.floor(n - 25569);
    const utcValue = utcDays * 86400 * 1000;
    const date = new Date(utcValue);
    if (Number.isNaN(date.getTime())) return null;
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0, 0);
  }

  function normalizeDateValue(value) {
    if (value == null) return null;
    const s = String(value).trim();
    if (!s) return null;

    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
      return parseISODate(s);
    }
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s)) {
      const [y, m, d] = s.split("/").map(Number);
      return createLocalDate(y, m, d);
    }
    if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(s)) {
      const [y, m, d] = s.split(".").map(Number);
      return createLocalDate(y, m, d);
    }
    if (/^\d{8}$/.test(s)) {
      return createLocalDate(Number(s.slice(0, 4)), Number(s.slice(4, 6)), Number(s.slice(6, 8)));
    }
    if (/^\d+(\.\d+)?$/.test(s)) {
      return excelSerialToDate(s);
    }
    return null;
  }

  function normalizeDateToISO(value) {
    const dateObj = normalizeDateValue(value);
    return dateObj ? toISO(dateObj) : "";
  }

  function toSlashDate(value) {
    const dateObj = normalizeDateValue(value);
    if (!dateObj) return "";
    return `${dateObj.getFullYear()}/${pad2(dateObj.getMonth() + 1)}/${pad2(dateObj.getDate())}`;
  }

  function getFiscalYearFromDate(dateObj) {
    if (!dateObj) return "";
    const year = dateObj.getFullYear();
    return dateObj.getMonth() + 1 >= 4 ? year : year - 1;
  }

  function getFiscalYearFromIso(iso) {
    const dateObj = parseISODate(iso);
    return getFiscalYearFromDate(dateObj);
  }

  function getClassLabel(classKey) {
    if (!classKey) return "";
    return `${classToAge[classKey]}歳児${classKey}組`;
  }

  function isFiscalStartException(dateObj) {
    if (!dateObj) return false;
    return dateObj.getMonth() + 1 === 4 && dateObj.getDate() === 1 && dateObj.getDay() >= 2 && dateObj.getDay() <= 6;
  }

  function isSelectableStartDate(dateObj) {
    if (!dateObj) return false;
    return dateObj.getDay() === 1 || isFiscalStartException(dateObj);
  }

  function getWeekInfoByStartDateIso(startDateIso) {
    const startDate = parseISODate(startDateIso);
    if (!startDate) {
      return { month: "", week: "", weekLabel: "" };
    }

    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    let week = 0;
    const monthLastDay = new Date(year, month, 0).getDate();

    for (let day = 1; day <= monthLastDay; day++) {
      const d = createLocalDate(year, month, day);
      if (isSelectableStartDate(d)) {
        week += 1;
      }
      if (toISO(d) === startDateIso) {
        return {
          month,
          week,
          weekLabel: `${month}月第${week}週`
        };
      }
    }

    return { month, week: "", weekLabel: "" };
  }

  function setCalendarMonthByIso(iso) {
    const dateObj = parseISODate(iso);
    if (!dateObj) return;
    calendarState.year = dateObj.getFullYear();
    calendarState.month = dateObj.getMonth() + 1;
  }

  function makeStorageKey(startDateIso, classKey) {
    if (!startDateIso || !classKey) return "";
    return `${STORAGE_PREFIX}${classKey}_${startDateIso}`;
  }

  function currentStorageKey() {
    return makeStorageKey(currentStartDateIso, el.classSelect.value || "");
  }

  function refreshTopLabels() {
    const weekInfo = getWeekInfoByStartDateIso(currentStartDateIso);
    el.weekLabel.textContent = weekInfo.weekLabel || "—";
    el.classLabel.textContent = getClassLabel(el.classSelect.value || "") || "—";
    el.weekKeyView.textContent = currentStorageKey() || "未設定";
  }

  function getJournalDateSlots(startDateIso) {
    const slots = Array(6).fill("");
    const startDate = parseISODate(startDateIso);
    if (!startDate) return slots;

    const fiscalYear = getFiscalYearFromDate(startDate);
    const startDow = startDate.getDay();
    let startIndex = 0;

    if (isFiscalStartException(startDate)) {
      startIndex = startDow - 1;
    }

    for (let i = startIndex; i < 6; i++) {
      const offset = i - startIndex;
      const dateObj = addDays(startDate, offset);
      if (getFiscalYearFromDate(dateObj) !== fiscalYear) break;
      slots[i] = toISO(dateObj);
    }

    return slots;
  }

  function buildJournalRows(startDateIso) {
    el.journalBody.innerHTML = "";
    const slotDates = getJournalDateSlots(startDateIso);

    for (let i = 0; i < 6; i++) {
      const tr = document.createElement("tr");

      const tdDate = document.createElement("td");
      tdDate.className = "dateCell";

      const top = document.createElement("div");
      top.className = "dateTop";

      const sub = document.createElement("div");
      sub.className = "dateSub";

      const slotIso = slotDates[i];
      const slotDateObj = parseISODate(slotIso);
      if (slotDateObj) {
        top.textContent = formatMD(slotDateObj);
        sub.textContent = `（${jpDow[slotDateObj.getDay()]}）`;
      } else {
        top.textContent = "";
        sub.textContent = "";
      }

      tdDate.appendChild(top);
      tdDate.appendChild(sub);

      const tdA = document.createElement("td");
      const tdB = document.createElement("td");
      const tdC = document.createElement("td");

      const taA = document.createElement("textarea");
      const taB = document.createElement("textarea");
      const taC = document.createElement("textarea");

      taA.className = "tarea";
      taB.className = "tarea";
      taC.className = "tarea";

      taA.placeholder = slotIso ? "子どもの活動" : "";
      taB.placeholder = slotIso ? "保育評価（日誌）" : "";
      taC.placeholder = slotIso ? "出欠状況（例：風邪で○○ちゃん休み）" : "";

      taA.dataset.field = `day${i}_activity`;
      taB.dataset.field = `day${i}_evaluation`;
      taC.dataset.field = `day${i}_attendance`;
      taA.disabled = !slotIso;
      taB.disabled = !slotIso;
      taC.disabled = !slotIso;

      tdA.appendChild(taA);
      tdB.appendChild(taB);
      tdC.appendChild(taC);

      tr.appendChild(tdDate);
      tr.appendChild(tdA);
      tr.appendChild(tdB);
      tr.appendChild(tdC);
      el.journalBody.appendChild(tr);
    }

    Array.from(el.journalBody.querySelectorAll("textarea")).forEach((t) => {
      t.addEventListener("input", scheduleAutosave);
      t.addEventListener("change", scheduleAutosave);
    });
  }

  function getJournalRowElements(index) {
    return {
      activity: el.journalBody.querySelector(`textarea[data-field="day${index}_activity"]`),
      evaluation: el.journalBody.querySelector(`textarea[data-field="day${index}_evaluation"]`),
      attendance: el.journalBody.querySelector(`textarea[data-field="day${index}_attendance"]`)
    };
  }

  function collectData(startDateIso) {
    const slotDates = getJournalDateSlots(startDateIso);

    const data = {
      classKey: el.classSelect.value || "",
      startDate: startDateIso || "",
      weeklyAim: el.weeklyAim.value || "",
      events: el.events.value || "",
      journal: [],
      weeklyEvaluation: el.weeklyEvaluation.value || "",
      individual: [
        { dateIso: el.case1Date.value || "", text: el.case1Text.value || "" },
        { dateIso: el.case2Date.value || "", text: el.case2Text.value || "" }
      ],
      updatedAt: nowIso()
    };

    for (let i = 0; i < 6; i++) {
      const rowDateIso = slotDates[i] || "";
      const rowDate = parseISODate(rowDateIso);
      const els = getJournalRowElements(i);
      data.journal.push({
        dateIso: rowDateIso,
        datePretty: rowDate ? formatMDJpDow(rowDate) : "",
        activity: rowDateIso && els.activity ? els.activity.value : "",
        evaluation: rowDateIso && els.evaluation ? els.evaluation.value : "",
        attendance: rowDateIso && els.attendance ? els.attendance.value : ""
      });
    }

    return data;
  }

  function clearCurrentInputs(keepClass = true) {
    const classValue = keepClass ? (el.classSelect.value || "") : "";
    el.weeklyAim.value = "";
    el.events.value = "";
    el.weeklyEvaluation.value = "";
    el.case1Date.value = "";
    el.case1Text.value = "";
    el.case2Date.value = "";
    el.case2Text.value = "";

    for (let i = 0; i < 6; i++) {
      const els = getJournalRowElements(i);
      if (els.activity) els.activity.value = "";
      if (els.evaluation) els.evaluation.value = "";
      if (els.attendance) els.attendance.value = "";
    }

    if (!keepClass) {
      el.classSelect.value = "";
    } else {
      el.classSelect.value = classValue;
    }

    el.lastSavedView.textContent = "—";
    refreshTopLabels();
  }

  function autosave() {
    if (!currentStartDateIso) return;
    const classKey = el.classSelect.value || "";
    if (!classKey) {
      refreshTopLabels();
      renderCalendar();
      return;
    }

    const key = makeStorageKey(currentStartDateIso, classKey);
    const data = collectData(currentStartDateIso);
    localStorage.setItem(key, JSON.stringify(data));
    el.lastSavedView.textContent = data.updatedAt;
    refreshTopLabels();
    renderCalendar();
  }

  function flushAutosave() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    try {
      autosave();
    } catch (_) {}
  }

  function scheduleAutosave() {
    refreshTopLabels();
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        autosave();
      } catch (_) {}
    }, 450);
  }

  function loadWeek(startDateIso) {
    flushAutosave();
    currentStartDateIso = startDateIso || "";
    buildJournalRows(currentStartDateIso);
    refreshTopLabels();
    el.lastSavedView.textContent = "—";

    if (currentStartDateIso) {
      setCalendarMonthByIso(currentStartDateIso);
    }

    if (!currentStartDateIso) {
      clearCurrentInputs(false);
      renderCalendar();
      return;
    }

    const classKey = el.classSelect.value || "";
    if (!classKey) {
      clearCurrentInputs(true);
      renderCalendar();
      return;
    }

    const raw = localStorage.getItem(makeStorageKey(currentStartDateIso, classKey));
    if (!raw) {
      clearCurrentInputs(true);
      renderCalendar();
      return;
    }

    try {
      const data = JSON.parse(raw);
      el.weeklyAim.value = data.weeklyAim ?? "";
      el.events.value = data.events ?? "";

      const journal = Array.isArray(data.journal) ? data.journal : [];
      const slotDates = getJournalDateSlots(currentStartDateIso);
      for (let i = 0; i < 6; i++) {
        const row = journal[i] || {};
        const els = getJournalRowElements(i);
        const isActiveSlot = Boolean(slotDates[i]);
        if (els.activity) els.activity.value = isActiveSlot ? (row.activity || "") : "";
        if (els.evaluation) els.evaluation.value = isActiveSlot ? (row.evaluation || "") : "";
        if (els.attendance) els.attendance.value = isActiveSlot ? (row.attendance || "") : "";
      }

      el.weeklyEvaluation.value = data.weeklyEvaluation ?? "";
      el.case1Date.value = normalizeDateToISO(data.individual?.[0]?.dateIso ?? "");
      el.case1Text.value = data.individual?.[0]?.text ?? "";
      el.case2Date.value = normalizeDateToISO(data.individual?.[1]?.dateIso ?? "");
      el.case2Text.value = data.individual?.[1]?.text ?? "";
      el.lastSavedView.textContent = data.updatedAt || "—";
    } catch (_) {
      alert("保存データの読み込みに失敗しました。");
    }

    refreshTopLabels();
    renderCalendar();
  }

  function clearThisWeek() {
    if (!currentStartDateIso) {
      alert("カレンダーで週の開始日を先に選んでください。");
      return;
    }
    const classKey = el.classSelect.value || "";
    if (!classKey) {
      alert("先にクラスを選択してください。");
      return;
    }

    const key = makeStorageKey(currentStartDateIso, classKey);
    if (!confirm("この週の保存データを消去します。よろしいですか？")) return;

    localStorage.removeItem(key);
    clearCurrentInputs(true);
    refreshTopLabels();
    renderCalendar();
  }

  function resetAppToInitialState() {
    flushAutosave();
    currentStartDateIso = "";
    buildJournalRows("");
    el.classSelect.value = "";
    clearCurrentInputs(false);
    el.restoreFileInput.value = "";
    el.weekKeyView.textContent = "未設定";
    el.lastSavedView.textContent = "—";
    activateTab("main");
    renderCalendar();
  }

  function deleteAllData() {
    const confirmed = window.prompt("初期化を実行するには「削除」と入力してください。", "");
    if (confirmed !== "削除") {
      alert("初期化を中止しました。");
      return;
    }

    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        keys.push(k);
      }
    }

    keys.forEach((k) => localStorage.removeItem(k));
    resetAppToInitialState();
    alert("初期化しました。必要ならバックアップCSVから復元してください。");
  }

  function csvEscape(v) {
    const s = String(v ?? "");
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function dataToBackupRow(data) {
    const row = {
      classKey: data.classKey ?? "",
      startDate: toSlashDate(data.startDate),
      weeklyAim: data.weeklyAim ?? "",
      events: data.events ?? "",
      weeklyEvaluation: data.weeklyEvaluation ?? "",
      case1Date: toSlashDate(data.individual?.[0]?.dateIso ?? ""),
      case1Text: data.individual?.[0]?.text ?? "",
      case2Date: toSlashDate(data.individual?.[1]?.dateIso ?? ""),
      case2Text: data.individual?.[1]?.text ?? ""
    };

    for (let i = 0; i < 6; i++) {
      row[`day${i}Date`] = toSlashDate(data.journal?.[i]?.dateIso ?? "");
      row[`day${i}Activity`] = data.journal?.[i]?.activity ?? "";
      row[`day${i}Evaluation`] = data.journal?.[i]?.evaluation ?? "";
      row[`day${i}Attendance`] = data.journal?.[i]?.attendance ?? "";
    }

    return row;
  }

  function rowsToCsv(rows) {
    const lines = [];
    lines.push(BACKUP_HEADERS.map(csvEscape).join(","));
    rows.forEach((rowObj) => {
      lines.push(BACKUP_HEADERS.map((h) => csvEscape(rowObj[h] ?? "")).join(","));
    });
    return lines.join("\r\n");
  }

  function getStoredDataList() {
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(STORAGE_PREFIX)) continue;
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (data && data.startDate && data.classKey) {
          list.push(data);
        }
      } catch (_) {}
    }
    return list;
  }

  function sortRowsByStartDate(rows) {
    rows.sort((a, b) => {
      const aIso = normalizeDateToISO(a.startDate);
      const bIso = normalizeDateToISO(b.startDate);
      if (aIso !== bIso) return aIso.localeCompare(bIso);
      return (a.classKey || "").localeCompare(b.classKey || "", "ja");
    });
    return rows;
  }

  async function backupAllData() {
    flushAutosave();

    const baseIso = currentStartDateIso || toISO(createLocalDate(calendarState.year, calendarState.month, 1));
    const fiscalYear = getFiscalYearFromIso(baseIso);
    const allData = getStoredDataList().filter((data) => getFiscalYearFromIso(data.startDate) === fiscalYear);

    const zip = new JSZip();

    classOrder.forEach((classKey) => {
      const rows = allData
        .filter((data) => data.classKey === classKey)
        .map((data) => dataToBackupRow(data));

      sortRowsByStartDate(rows);
      const csv = rowsToCsv(rows);
      zip.file(`weekly_${classKey}_${fiscalYear}.csv`, "\uFEFF" + csv);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-plan_backup_${fiscalYear}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            cell += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          cell += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          row.push(cell);
          cell = "";
        } else if (ch === "\n") {
          row.push(cell);
          rows.push(row);
          row = [];
          cell = "";
        } else if (ch === "\r") {
        } else {
          cell += ch;
        }
      }
    }

    if (cell.length > 0 || row.length > 0) {
      row.push(cell);
      rows.push(row);
    }

    return rows.filter((r) => !(r.length === 1 && r[0] === ""));
  }

  function rowToObject(headers, row) {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  }

  function objectToStoredData(obj) {
    const classKey = String(obj.classKey || "").trim();
    const startDate = normalizeDateToISO(obj.startDate);
    if (!classKey || !startDate) return null;

    const slotDates = getJournalDateSlots(startDate);
    const journal = [];
    for (let i = 0; i < 6; i++) {
      const slotDateIso = slotDates[i] || "";
      const providedDateIso = normalizeDateToISO(obj[`day${i}Date`]);
      const dateIso = slotDateIso || providedDateIso || "";
      const dateObj = parseISODate(dateIso);
      journal.push({
        dateIso,
        datePretty: dateObj ? formatMDJpDow(dateObj) : "",
        activity: slotDateIso ? (obj[`day${i}Activity`] ?? "") : "",
        evaluation: slotDateIso ? (obj[`day${i}Evaluation`] ?? "") : "",
        attendance: slotDateIso ? (obj[`day${i}Attendance`] ?? "") : ""
      });
    }

    return {
      classKey,
      startDate,
      weeklyAim: obj.weeklyAim || "",
      events: obj.events || "",
      journal,
      weeklyEvaluation: obj.weeklyEvaluation || "",
      individual: [
        { dateIso: normalizeDateToISO(obj.case1Date), text: obj.case1Text || "" },
        { dateIso: normalizeDateToISO(obj.case2Date), text: obj.case2Text || "" }
      ],
      updatedAt: nowIso()
    };
  }

  function restoreFromCSVText(text) {
    const rows = parseCSV(text);
    if (!rows.length) return 0;

    const headers = rows[0].map((h) => String(h || "").trim().replace(/^\uFEFF/, ""));
    const missing = BACKUP_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length) {
      throw new Error("復元用CSVの項目が不足しています。");
    }

    let count = 0;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every((v) => String(v || "").trim() === "")) continue;
      const obj = rowToObject(headers, row);
      const data = objectToStoredData(obj);
      if (!data) continue;
      localStorage.setItem(makeStorageKey(data.startDate, data.classKey), JSON.stringify(data));
      count += 1;
    }
    return count;
  }

  function decodeArrayBuffer(buffer, encoding) {
    try {
      return new TextDecoder(encoding).decode(buffer);
    } catch (_) {
      return "";
    }
  }

  function scoreJapaneseText(text) {
    if (!text) return -999999;
    let score = 0;
    if (text.includes("classKey")) score += 30;
    if (text.includes("startDate")) score += 30;
    if (text.includes("weeklyAim")) score += 30;
    if (text.includes("case1Text")) score += 30;

    const mojibakeMatches = text.match(/[�Ã¢ã¤æ¥œ]/g);
    if (mojibakeMatches) score -= mojibakeMatches.length * 2;

    const japaneseMatches = text.match(/[ぁ-んァ-ヶ一-龠]/g);
    if (japaneseMatches) score += japaneseMatches.length;

    return score;
  }

  function chooseDecodedCsvText(buffer) {
    const utf8Text = decodeArrayBuffer(buffer, "utf-8");
    const sjisText = decodeArrayBuffer(buffer, "shift_jis");
    return scoreJapaneseText(sjisText) > scoreJapaneseText(utf8Text) ? sjisText : utf8Text;
  }

  async function handleRestoreFile(file) {
    if (!file) return;
    const lowerName = String(file.name || "").toLowerCase();

    try {
      let count = 0;

      if (lowerName.endsWith(".zip")) {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const csvEntries = Object.values(zip.files).filter((f) => !f.dir && f.name.toLowerCase().endsWith(".csv"));
        if (!csvEntries.length) {
          alert("ZIP内にCSVがありません。");
          el.restoreFileInput.value = "";
          return;
        }

        for (const entry of csvEntries) {
          const uint8 = await entry.async("uint8array");
          const text = chooseDecodedCsvText(uint8.buffer);
          count += restoreFromCSVText(text);
        }
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const text = chooseDecodedCsvText(arrayBuffer);
        count += restoreFromCSVText(text);
      }

      if (currentStartDateIso) {
        loadWeek(currentStartDateIso);
      } else {
        renderCalendar();
      }
      alert(`復元完了：${count}件`);
    } catch (error) {
      alert(error && error.message ? error.message : "復元に失敗しました。");
    } finally {
      el.restoreFileInput.value = "";
    }
  }

  function getMarksByDate() {
    const map = new Map();
    const appendMark = (dateIso, classKey) => {
      if (!dateIso || !classKey || !classMarks[classKey]) return;
      if (!map.has(dateIso)) map.set(dateIso, new Set());
      map.get(dateIso).add(classMarks[classKey]);
    };

    getStoredDataList().forEach((week) => {
      (Array.isArray(week.journal) ? week.journal : []).forEach((row) => {
        if (row && row.dateIso && String(row.activity || "").trim()) {
          appendMark(row.dateIso, week.classKey);
        }
      });
    });

    if (currentStartDateIso && el.classSelect.value) {
      const currentData = collectData(currentStartDateIso);
      currentData.journal.forEach((row) => {
        if (row && row.dateIso && String(row.activity || "").trim()) {
          appendMark(row.dateIso, currentData.classKey);
        }
      });
    }

    return map;
  }

  function renderCalendar() {
    const year = calendarState.year;
    const month = calendarState.month;
    const firstDay = createLocalDate(year, month, 1);
    const firstDow = firstDay.getDay();
    const startDate = addDays(firstDay, -firstDow);
    const marksByDate = getMarksByDate();

    el.calendarTitle.textContent = `${year}年${month}月`;
    el.calendarGrid.innerHTML = "";

    for (let i = 0; i < 42; i++) {
      const cellDate = addDays(startDate, i);
      const cellIso = toISO(cellDate);
      const inCurrentMonth = cellDate.getMonth() + 1 === month;
      const selectable = isSelectableStartDate(cellDate);
      const isSelected = currentStartDateIso === cellIso;
      const marks = Array.from(marksByDate.get(cellIso) || []);
      marks.sort((a, b) => {
        const aIndex = classOrder.findIndex((key) => classMarks[key] === a);
        const bIndex = classOrder.findIndex((key) => classMarks[key] === b);
        return aIndex - bIndex;
      });

      const cell = document.createElement("div");
      cell.className = "calendarCell";
      if (!inCurrentMonth) cell.classList.add("otherMonth");
      if (isSelected) cell.classList.add("isSelected");

      let inner;
      if (selectable) {
        inner = document.createElement("button");
        inner.type = "button";
        inner.className = "calendarCellInner isMonday";
        inner.addEventListener("click", () => {
          loadWeek(cellIso);
          activateTab("main");
        });
      } else {
        inner = document.createElement("div");
        inner.className = "calendarCellInner";
      }

      const dayNum = document.createElement("div");
      dayNum.className = "calendarDayNum";
      dayNum.textContent = String(cellDate.getDate());
      inner.appendChild(dayNum);

      if (selectable) {
        const startMark = document.createElement("div");
        startMark.className = "calendarMondayMark";
        startMark.textContent = cellDate.getDay() === 1 ? "開始日" : "年度初日";
        inner.appendChild(startMark);
      }

      cell.appendChild(inner);

      const markRow = document.createElement("div");
      markRow.className = "calendarDotRow";
      marks.forEach((mark) => {
        const span = document.createElement("span");
        span.className = "calendarDot";
        span.textContent = mark;
        markRow.appendChild(span);
      });
      cell.appendChild(markRow);

      el.calendarGrid.appendChild(cell);
    }
  }

  function activateTab(tabName) {
    flushAutosave();

    const isMain = tabName === "main";
    const isCalendar = tabName === "calendar";
    const isManage = tabName === "manage";

    el.tabMain.classList.toggle("active", isMain);
    el.tabCalendar.classList.toggle("active", isCalendar);
    el.tabManage.classList.toggle("active", isManage);

    el.tabMainBtn.classList.toggle("active", isMain);
    el.tabCalendarBtn.classList.toggle("active", isCalendar);
    el.tabManageBtn.classList.toggle("active", isManage);

    if (isCalendar) renderCalendar();
  }

  function moveCalendarMonth(diff) {
    let y = calendarState.year;
    let m = calendarState.month + diff;
    if (m <= 0) {
      y -= 1;
      m = 12;
    } else if (m >= 13) {
      y += 1;
      m = 1;
    }
    calendarState.year = y;
    calendarState.month = m;
    renderCalendar();
  }

  el.tabMainBtn.addEventListener("click", () => activateTab("main"));
  el.tabCalendarBtn.addEventListener("click", () => activateTab("calendar"));
  el.tabManageBtn.addEventListener("click", () => activateTab("manage"));
  el.btnPrevMonth.addEventListener("click", () => moveCalendarMonth(-1));
  el.btnNextMonth.addEventListener("click", () => moveCalendarMonth(1));
  el.btnClear.addEventListener("click", clearThisWeek);
  el.btnBackup.addEventListener("click", backupAllData);
  el.btnRestore.addEventListener("click", () => el.restoreFileInput.click());
  el.btnDeleteAll.addEventListener("click", deleteAllData);

  el.restoreFileInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    await handleRestoreFile(file);
  });

  el.classSelect.addEventListener("change", () => {
    refreshTopLabels();
    if (currentStartDateIso) {
      loadWeek(currentStartDateIso);
    } else {
      scheduleAutosave();
    }
  });

  [
    el.weeklyAim,
    el.events,
    el.weeklyEvaluation,
    el.case1Date,
    el.case1Text,
    el.case2Date,
    el.case2Text
  ].forEach((inp) => {
    inp.addEventListener("input", scheduleAutosave);
    inp.addEventListener("change", scheduleAutosave);
  });

  buildJournalRows("");
  refreshTopLabels();
  loadWeek("");
  activateTab("main");
  renderCalendar();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js");
    });
  }
})();
