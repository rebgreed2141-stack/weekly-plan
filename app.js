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
    btnClear: document.getElementById("btnClear")
  };

  const pad2 = (n) => String(n).padStart(2, "0");

  function parseISODate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0, 0);
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
          const iso = dateInput.value || "";
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

  function loadWeek(mondayIso) {
    buildJournalRows(mondayIso);
    refreshTopLabels();

    el.weekKeyView.textContent = mondayIso ? weekKey(mondayIso) : "未設定";
    el.lastSavedView.textContent = "—";

    if (!mondayIso) {
      return;
    }

    const key = weekKey(mondayIso);
    const raw = localStorage.getItem(key);

    if (!raw) {
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

    el.case1Date.value = data.individual?.[0]?.dateIso ?? "";
    el.case1Text.value = data.individual?.[0]?.text ?? "";
    el.case2Date.value = data.individual?.[1]?.dateIso ?? "";
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

    el.lastSavedView.textContent = "—";
    scheduleAutosave();
  }

  function csvEscape(v) {
    const s = String(v ?? "");
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function exportCSV() {
    const mondayIso = getMondayIsoFromCell();

    if (!mondayIso) {
      alert("月曜日（日付）を選んでからCSV出力してください。");
      return;
    }

    const data = collectData(mondayIso);

    const headers = [
      "週", "クラス", "月曜(ISO)", "月曜(表示)", "週のねらい", "行事",
      "月(表示)", "月_子どもの活動", "月_保育評価", "月_出欠",
      "火(表示)", "火_子どもの活動", "火_保育評価", "火_出欠",
      "水(表示)", "水_子どもの活動", "水_保育評価", "水_出欠",
      "木(表示)", "木_子どもの活動", "木_保育評価", "木_出欠",
      "金(表示)", "金_子どもの活動", "金_保育評価", "金_出欠",
      "土(表示)", "土_子どもの活動", "土_保育評価", "土_出欠",
      "1週間の評価",
      "個別1_日付(ISO)", "個別1_内容",
      "個別2_日付(ISO)", "個別2_内容",
      "更新日時"
    ];

    const row = [];
    row.push(
      data.weekLabel,
      data.classLabel,
      data.mondayIso,
      data.mondayPretty,
      data.weeklyAim,
      data.events
    );

    for (let i = 0; i < 6; i++) {
      const d = data.journal[i];
      row.push(d.datePretty, d.activity, d.evaluation, d.attendance);
    }

    row.push(data.weeklyEvaluation);
    row.push(data.individual[0].dateIso, data.individual[0].text);
    row.push(data.individual[1].dateIso, data.individual[1].text);
    row.push(data.updatedAt);

    const csv = [
      headers.map(csvEscape).join(","),
      row.map(csvEscape).join(",")
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const safe = (s) => String(s || "").replace(/[\\/:*?"<>|]/g, "_").trim();
    const fname = `${safe(data.weekLabel || "週案")}_${safe(data.classLabel || "クラス")}_${data.mondayIso || "date"}.csv`;

    const a = document.createElement("a");
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  el.btnExport.addEventListener("click", exportCSV);
  el.btnClear.addEventListener("click", clearThisWeek);

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

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js");
    });
  }
})();