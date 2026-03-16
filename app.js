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

  const STORAGE_PREFIX = "shuan_demo_week_";
  const BACKUP_HEADERS = [
    "recordType",
    "month",
    "week",
    "weekLabel",
    "classKey",
    "classLabel",
    "mondayIso",
    "mondayPretty",
    "weeklyAim",
    "events",
    "weeklyEvaluation",
    "case1Date",
    "case1Text",
    "case2Date",
    "case2Text",
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
    "updatedAt"
  ];

  const el = {
    monthNum: document.getElementById("monthNum"),
    weekNum: document.getElementById("weekNum"),
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

    btnExport: document.getElementById("btnExport"),
    btnClear: document.getElementById("btnClear"),

    btnBackup: document.getElementById("btnBackup"),
    btnRestore: document.getElementById("btnRestore"),
    btnDeleteAll: document.getElementById("btnDeleteAll"),
    restoreFileInput: document.getElementById("restoreFileInput"),

    tabMainBtn: document.getElementById("tabMainBtn"),
    tabManageBtn: document.getElementById("tabManageBtn"),
    tabMain: document.getElementById("tabMain"),
    tabManage: document.getElementById("tabManage")
  };

  const pad2 = (n) => String(n).padStart(2, "0");

  function parseISODate(iso) {
    if (!iso) return null;
    const m = String(iso).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return new Date(y, mo - 1, d, 12, 0, 0, 0);
  }

  function toISO(dateObj) {
    return `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}`;
  }

  function toSlashDate(value) {
    const dateObj = normalizeDateValue(value);
    if (!dateObj) return "";
    return `${dateObj.getFullYear()}/${pad2(dateObj.getMonth() + 1)}/${pad2(dateObj.getDate())}`;
  }

  function addDays(dateObj, days) {
    const d = new Date(dateObj.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function formatMD(dateObj) {
    const m = dateObj.getMonth() + 1;
    const d = dateObj.getDate();
    return `${m}/${d}`;
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
      return new Date(y, m - 1, d, 12, 0, 0, 0);
    }

    if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(s)) {
      const [y, m, d] = s.split(".").map(Number);
      return new Date(y, m - 1, d, 12, 0, 0, 0);
    }

    if (/^\d{8}$/.test(s)) {
      const y = Number(s.slice(0, 4));
      const m = Number(s.slice(4, 6));
      const d = Number(s.slice(6, 8));
      return new Date(y, m - 1, d, 12, 0, 0, 0);
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

  function getWeekLabel() {
    const m = Number(el.monthNum.value);
    const w = Number(el.weekNum.value);
    if (!m || !w) return "";
    return `${m}月第${w}週`;
  }

  function getClassLabel() {
    const c = el.classSelect.value;
    if (!c) return "";
    const age = classToAge[c];
    return `${age}歳児${c}組`;
  }

  function refreshTopLabels() {
    const wk = getWeekLabel();
    const cl = getClassLabel();
    el.weekLabel.textContent = wk || "—";
    el.classLabel.textContent = cl || "—";
  }

  function weekKey(mondayIso) {
    if (!mondayIso) return "";
    return STORAGE_PREFIX + mondayIso;
  }

  function getMondayIsoFromCell() {
    const inp = document.getElementById("mondayInCell");
    return inp ? (inp.value || "") : "";
  }

  function hookJournalAutosave() {
    Array.from(el.journalBody.querySelectorAll("textarea")).forEach((t) => {
      t.addEventListener("input", scheduleAutosave);
      t.addEventListener("change", scheduleAutosave);
    });
  }

  function buildJournalRows(mondayIso) {
    el.journalBody.innerHTML = "";

    const monday = parseISODate(mondayIso);
    const hasDate = !!monday;

    for (let i = 0; i < 6; i++) {
      const tr = document.createElement("tr");

      const tdDate = document.createElement("td");
      tdDate.className = "dateCell";

      const top = document.createElement("div");
      top.className = "dateTop";

      const sub = document.createElement("div");
      sub.className = "dateSub";

      if (hasDate) {
        const dateObj = addDays(monday, i);
        top.textContent = formatMD(dateObj);
        sub.textContent = `（${jpDow[dateObj.getDay()]}）`;
      } else {
        top.textContent = "—";
        sub.textContent = "";
      }

      tdDate.appendChild(top);
      tdDate.appendChild(sub);

      if (i === 0) {
        const dateInput = document.createElement("input");
        dateInput.type = "date";
        dateInput.className = "datePickerInCell";
        dateInput.id = "mondayInCell";
        dateInput.value = mondayIso || "";
        dateInput.addEventListener("change", () => {
          const iso = normalizeDateToISO(dateInput.value || "");
          dateInput.value = iso;
          onMondayChanged(iso);
        });
        tdDate.appendChild(dateInput);
      }

      const tdA = document.createElement("td");
      const tdB = document.createElement("td");
      const tdC = document.createElement("td");

      const taA = document.createElement("textarea");
      const taB = document.createElement("textarea");
      const taC = document.createElement("textarea");

      taA.className = "tarea";
      taB.className = "tarea";
      taC.className = "tarea";

      taA.placeholder = "子どもの活動";
      taB.placeholder = "保育評価（日誌）";
      taC.placeholder = "出欠状況（例：風邪で○○ちゃん休み）";

      taA.dataset.field = `day${i}_activity`;
      taB.dataset.field = `day${i}_evaluation`;
      taC.dataset.field = `day${i}_attendance`;

      tdA.appendChild(taA);
      tdB.appendChild(taB);
      tdC.appendChild(taC);

      tr.appendChild(tdDate);
      tr.appendChild(tdA);
      tr.appendChild(tdB);
      tr.appendChild(tdC);

      el.journalBody.appendChild(tr);
    }

    hookJournalAutosave();
  }

  function collectData(mondayIso) {
    const monday = parseISODate(mondayIso);

    const data = {
      month: el.monthNum.value ? Number(el.monthNum.value) : "",
      week: el.weekNum.value ? Number(el.weekNum.value) : "",
      weekLabel: getWeekLabel(),
      classKey: el.classSelect.value || "",
      classLabel: getClassLabel(),

      mondayIso: mondayIso || "",
      mondayPretty: monday ? formatMDJpDow(monday) : "",

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
      const baseDate = monday ? addDays(monday, i) : null;
      const row = {
        dateIso: baseDate ? toISO(baseDate) : "",
        datePretty: baseDate ? formatMDJpDow(baseDate) : "",
        activity: "",
        evaluation: "",
        attendance: ""
      };

      const taA = el.journalBody.querySelector(`textarea[data-field="day${i}_activity"]`);
      const taB = el.journalBody.querySelector(`textarea[data-field="day${i}_evaluation"]`);
      const taC = el.journalBody.querySelector(`textarea[data-field="day${i}_attendance"]`);

      row.activity = taA ? taA.value : "";
      row.evaluation = taB ? taB.value : "";
      row.attendance = taC ? taC.value : "";

      data.journal.push(row);
    }

    return data;
  }

  function autosave() {
    const mondayIso = getMondayIsoFromCell();
    if (!mondayIso) return;

    const key = weekKey(mondayIso);
    const data = collectData(mondayIso);

    localStorage.setItem(key, JSON.stringify(data));
    el.weekKeyView.textContent = key;
    el.lastSavedView.textContent = data.updatedAt;
  }

  let saveTimer = null;

  function scheduleAutosave() {
    refreshTopLabels();
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        autosave();
      } catch (_) {}
    }, 450);
  }

  function clearCurrentInputs(keepTop = true) {
    if (!keepTop) {
      el.monthNum.value = "";
      el.weekNum.value = "";
      el.classSelect.value = "";
      const mondayInput = document.getElementById("mondayInCell");
      if (mondayInput) mondayInput.value = "";
    }

    el.weeklyAim.value = "";
    el.events.value = "";
    el.weeklyEvaluation.value = "";
    el.case1Date.value = "";
    el.case1Text.value = "";
    el.case2Date.value = "";
    el.case2Text.value = "";

    Array.from(el.journalBody.querySelectorAll("textarea")).forEach((t) => {
      t.value = "";
    });

    refreshTopLabels();
    el.lastSavedView.textContent = "—";
  }

  function loadWeek(mondayIso) {
    buildJournalRows(mondayIso);
    refreshTopLabels();

    el.weekKeyView.textContent = mondayIso ? weekKey(mondayIso) : "未設定";
    el.lastSavedView.textContent = "—";

    if (!mondayIso) {
      clearCurrentInputs(true);
      return;
    }

    const key = weekKey(mondayIso);
    const raw = localStorage.getItem(key);

    if (!raw) {
      clearCurrentInputs(true);
      el.weekKeyView.textContent = key;
      return;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      alert("保存データの読み込みに失敗しました。");
      return;
    }

    el.monthNum.value = data.month ?? "";
    el.weekNum.value = data.week ?? "";
    el.classSelect.value = data.classKey ?? "";

    el.weeklyAim.value = data.weeklyAim ?? "";
    el.events.value = data.events ?? "";

    const journal = Array.isArray(data.journal) ? data.journal : [];
    for (let i = 0; i < 6; i++) {
      const row = journal[i] || {};
      const taA = el.journalBody.querySelector(`textarea[data-field="day${i}_activity"]`);
      const taB = el.journalBody.querySelector(`textarea[data-field="day${i}_evaluation"]`);
      const taC = el.journalBody.querySelector(`textarea[data-field="day${i}_attendance"]`);

      if (taA) taA.value = row.activity || "";
      if (taB) taB.value = row.evaluation || "";
      if (taC) taC.value = row.attendance || "";
    }

    el.weeklyEvaluation.value = data.weeklyEvaluation ?? "";

    el.case1Date.value = normalizeDateToISO(data.individual?.[0]?.dateIso ?? "");
    el.case1Text.value = data.individual?.[0]?.text ?? "";
    el.case2Date.value = normalizeDateToISO(data.individual?.[1]?.dateIso ?? "");
    el.case2Text.value = data.individual?.[1]?.text ?? "";

    refreshTopLabels();
    el.weekKeyView.textContent = key;
    el.lastSavedView.textContent = data.updatedAt || "—";
  }

  function onMondayChanged(newMondayIso) {
    loadWeek(newMondayIso);
    scheduleAutosave();
  }

  function clearThisWeek() {
    const mondayIso = getMondayIsoFromCell();

    if (!mondayIso) {
      alert("月曜日（日付）を先に選んでください。");
      return;
    }

    const key = weekKey(mondayIso);

    if (!confirm("この週の保存データを消去します。よろしいですか？")) return;

    localStorage.removeItem(key);
    clearCurrentInputs(true);
    el.weekKeyView.textContent = key;
  }

  function deleteAllData() {
    if (!confirm("アプリ内の全保存データを削除します。よろしいですか？")) return;

    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        keys.push(k);
      }
    }

    keys.forEach((k) => localStorage.removeItem(k));

    const currentMonday = getMondayIsoFromCell();
    loadWeek(currentMonday || "");
    alert("全データを削除しました。");
  }

  function csvEscape(v) {
    const s = String(v ?? "");
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function dataToBackupRow(data) {
    return {
      recordType: "week",
      month: data.month ?? "",
      week: data.week ?? "",
      weekLabel: data.weekLabel ?? "",
      classKey: data.classKey ?? "",
      classLabel: data.classLabel ?? "",
      mondayIso: toSlashDate(data.mondayIso),
      mondayPretty: data.mondayPretty ?? "",
      weeklyAim: data.weeklyAim ?? "",
      events: data.events ?? "",
      weeklyEvaluation: data.weeklyEvaluation ?? "",
      case1Date: toSlashDate(data.individual?.[0]?.dateIso ?? ""),
      case1Text: data.individual?.[0]?.text ?? "",
      case2Date: toSlashDate(data.individual?.[1]?.dateIso ?? ""),
      case2Text: data.individual?.[1]?.text ?? "",
      day0Date: toSlashDate(data.journal?.[0]?.dateIso ?? ""),
      day0Activity: data.journal?.[0]?.activity ?? "",
      day0Evaluation: data.journal?.[0]?.evaluation ?? "",
      day0Attendance: data.journal?.[0]?.attendance ?? "",
      day1Date: toSlashDate(data.journal?.[1]?.dateIso ?? ""),
      day1Activity: data.journal?.[1]?.activity ?? "",
      day1Evaluation: data.journal?.[1]?.evaluation ?? "",
      day1Attendance: data.journal?.[1]?.attendance ?? "",
      day2Date: toSlashDate(data.journal?.[2]?.dateIso ?? ""),
      day2Activity: data.journal?.[2]?.activity ?? "",
      day2Evaluation: data.journal?.[2]?.evaluation ?? "",
      day2Attendance: data.journal?.[2]?.attendance ?? "",
      day3Date: toSlashDate(data.journal?.[3]?.dateIso ?? ""),
      day3Activity: data.journal?.[3]?.activity ?? "",
      day3Evaluation: data.journal?.[3]?.evaluation ?? "",
      day3Attendance: data.journal?.[3]?.attendance ?? "",
      day4Date: toSlashDate(data.journal?.[4]?.dateIso ?? ""),
      day4Activity: data.journal?.[4]?.activity ?? "",
      day4Evaluation: data.journal?.[4]?.evaluation ?? "",
      day4Attendance: data.journal?.[4]?.attendance ?? "",
      day5Date: toSlashDate(data.journal?.[5]?.dateIso ?? ""),
      day5Activity: data.journal?.[5]?.activity ?? "",
      day5Evaluation: data.journal?.[5]?.evaluation ?? "",
      day5Attendance: data.journal?.[5]?.attendance ?? "",
      updatedAt: data.updatedAt ?? ""
    };
  }

  function downloadCsv(csvText, fileName) {
    const csvWithBom = "\uFEFF" + csvText;
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  function backupAllData() {
    const rows = [];

    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        keys.push(k);
      }
    }

    keys.sort();

    keys.forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const data = JSON.parse(raw);
        rows.push(dataToBackupRow(data));
      } catch (_) {}
    });

    const csvLines = [];
    csvLines.push(BACKUP_HEADERS.map(csvEscape).join(","));
    rows.forEach((rowObj) => {
      const row = BACKUP_HEADERS.map((h) => csvEscape(rowObj[h] ?? ""));
      csvLines.push(row.join(","));
    });

    const csv = csvLines.join("\r\n");
    const fileName = `週案日誌バックアップ_${nowIso().replace(/[: ]/g, "-")}.csv`;
    downloadCsv(csv, fileName);
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
            i++;
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
    const mondayIso = normalizeDateToISO(obj.mondayIso);
    if (!mondayIso) return null;

    const monday = parseISODate(mondayIso);
    const journal = [];

    for (let i = 0; i < 6; i++) {
      const computedDate = monday ? addDays(monday, i) : null;
      const dateIso = normalizeDateToISO(obj[`day${i}Date`]) || (computedDate ? toISO(computedDate) : "");
      const dateObj = parseISODate(dateIso);

      journal.push({
        dateIso,
        datePretty: dateObj ? formatMDJpDow(dateObj) : "",
        activity: obj[`day${i}Activity`] ?? "",
        evaluation: obj[`day${i}Evaluation`] ?? "",
        attendance: obj[`day${i}Attendance`] ?? ""
      });
    }

    const data = {
      month: obj.month ? Number(obj.month) : "",
      week: obj.week ? Number(obj.week) : "",
      weekLabel: obj.weekLabel || "",
      classKey: obj.classKey || "",
      classLabel: obj.classLabel || "",
      mondayIso,
      mondayPretty: monday ? formatMDJpDow(monday) : "",
      weeklyAim: obj.weeklyAim || "",
      events: obj.events || "",
      journal,
      weeklyEvaluation: obj.weeklyEvaluation || "",
      individual: [
        {
          dateIso: normalizeDateToISO(obj.case1Date),
          text: obj.case1Text || ""
        },
        {
          dateIso: normalizeDateToISO(obj.case2Date),
          text: obj.case2Text || ""
        }
      ],
      updatedAt: obj.updatedAt || nowIso()
    };

    return data;
  }

  function restoreFromCSVText(text) {
    const rows = parseCSV(text);
    if (!rows.length) {
      alert("CSVにデータがありません。");
      return;
    }

    const headers = rows[0].map((h) => String(h || "").trim().replace(/^\uFEFF/, ""));
    const missing = BACKUP_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length) {
      alert("復元用CSVの項目が不足しています。");
      return;
    }

    let count = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every((v) => String(v || "").trim() === "")) continue;

      const obj = rowToObject(headers, row);
      if ((obj.recordType || "").trim() !== "week") continue;

      const data = objectToStoredData(obj);
      if (!data || !data.mondayIso) continue;

      localStorage.setItem(weekKey(data.mondayIso), JSON.stringify(data));
      count++;
    }

    const currentMonday = getMondayIsoFromCell();
    if (currentMonday) {
      loadWeek(currentMonday);
    }

    alert(`復元完了：${count}件`);
  }

  function decodeArrayBuffer(buffer, encoding) {
    try {
      return new TextDecoder(encoding).decode(buffer);
    } catch (_) {
      return "";
    }
  }

  function chooseDecodedCsvText(buffer) {
    const utf8Text = decodeArrayBuffer(buffer, "utf-8");
    const sjisText = decodeArrayBuffer(buffer, "shift_jis");

    const utf8Score = scoreJapaneseText(utf8Text);
    const sjisScore = scoreJapaneseText(sjisText);

    return sjisScore > utf8Score ? sjisText : utf8Text;
  }

  function scoreJapaneseText(text) {
    if (!text) return -999999;

    let score = 0;

    if (text.includes("recordType")) score += 30;
    if (text.includes("weeklyAim")) score += 30;
    if (text.includes("case1Text")) score += 30;
    if (text.includes("週案")) score += 10;
    if (text.includes("育")) score += 5;
    if (text.includes("日誌")) score += 5;

    const mojibakeMatches = text.match(/[�Ã¢ã¤æ¥œ]/g);
    if (mojibakeMatches) score -= mojibakeMatches.length * 2;

    const japaneseMatches = text.match(/[ぁ-んァ-ヶ一-龠]/g);
    if (japaneseMatches) score += japaneseMatches.length;

    return score;
  }

  function handleRestoreFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result;
      const text = chooseDecodedCsvText(buffer);
      restoreFromCSVText(text);
      el.restoreFileInput.value = "";
    };
    reader.readAsArrayBuffer(file);
  }

  function exportCurrentWeekCSV() {
    const mondayIso = getMondayIsoFromCell();

    if (!mondayIso) {
      alert("月曜日（日付）を選んでからCSV出力してください。");
      return;
    }

    const data = collectData(mondayIso);

    const headers = [
      "週", "クラス", "月曜", "週のねらい", "行事",
      "月", "月_子どもの活動", "月_保育評価", "月_出欠",
      "火", "火_子どもの活動", "火_保育評価", "火_出欠",
      "水", "水_子どもの活動", "水_保育評価", "水_出欠",
      "木", "木_子どもの活動", "木_保育評価", "木_出欠",
      "金", "金_子どもの活動", "金_保育評価", "金_出欠",
      "土", "土_子どもの活動", "土_保育評価", "土_出欠",
      "1週間の評価",
      "個別1_日付", "個別1_内容",
      "個別2_日付", "個別2_内容",
      "更新日時"
    ];

    const row = [];
    row.push(
      data.weekLabel,
      data.classLabel,
      toSlashDate(data.mondayIso),
      data.weeklyAim,
      data.events
    );

    for (let i = 0; i < 6; i++) {
      const d = data.journal[i];
      row.push(
        toSlashDate(d.dateIso),
        d.activity,
        d.evaluation,
        d.attendance
      );
    }

    row.push(data.weeklyEvaluation);
    row.push(toSlashDate(data.individual[0].dateIso), data.individual[0].text);
    row.push(toSlashDate(data.individual[1].dateIso), data.individual[1].text);
    row.push(data.updatedAt);

    const csv = [
      headers.map(csvEscape).join(","),
      row.map(csvEscape).join(",")
    ].join("\r\n");

    const safe = (s) => String(s || "").replace(/[\\/:*?"<>|]/g, "_").trim();
    const fname = `${safe(data.weekLabel || "週案")}_${safe(data.classLabel || "クラス")}_${toSlashDate(data.mondayIso).replace(/\//g, "-") || "date"}.csv`;

    downloadCsv(csv, fname);
  }

  function activateTab(tabName) {
    const isMain = tabName === "main";
    el.tabMain.classList.toggle("active", isMain);
    el.tabManage.classList.toggle("active", !isMain);
    el.tabMainBtn.classList.toggle("active", isMain);
    el.tabManageBtn.classList.toggle("active", !isMain);
  }

  el.tabMainBtn.addEventListener("click", () => activateTab("main"));
  el.tabManageBtn.addEventListener("click", () => activateTab("manage"));

  el.btnExport.addEventListener("click", exportCurrentWeekCSV);
  el.btnClear.addEventListener("click", clearThisWeek);
  el.btnBackup.addEventListener("click", backupAllData);
  el.btnRestore.addEventListener("click", () => el.restoreFileInput.click());
  el.btnDeleteAll.addEventListener("click", deleteAllData);

  el.restoreFileInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    handleRestoreFile(file);
  });

  [
    el.monthNum,
    el.weekNum,
    el.classSelect,
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

  refreshTopLabels();
  loadWeek("");
  el.weekKeyView.textContent = "未設定";
  el.lastSavedView.textContent = "—";
  activateTab("main");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js");
    });
  }
})();