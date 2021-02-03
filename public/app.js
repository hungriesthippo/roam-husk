if (!window.roamhusk) {
  window.roamhusk = {};
}

roamhusk.cardMode = {
  DEFAULT: 0,
  FI: 1
}

roamhusk.convertLegacyDates = (nodes) => {
  Object.keys(nodes).forEach(id => {
    if (nodes[id].due instanceof Date)
      nodes[id].due = nodes[id].due.getTime();
  });
  return nodes;
}

class StyleManager {
  styleSheet;
  rules = {
    HIDE_TAGS: 0,
    HIDE_DATE: 1,
    TOPBAR: 2,
    ATTRIBUTE: 3, 
    HIDE_PATH: 4,
    HIDE_ANSWER: 5, 
    HIDE_ATTRIBUTE: 6
  }
  activeRules = [];

  constructor() {
    const style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);
    this.styleSheet = style.sheet;
  }

  clear() {
    this.activeRules.forEach(rule => this.deleteRule(rule));
  };

  start() {
    this.clear();
    this.addRule(this.rules.HIDE_TAGS,
      `.roam-body-main [data-link-title^="[[interval]]:"], [data-tag="sr"], [data-link-title^="[[factor]]:"] {
      display: none;}`);
    this.addRule(this.rules.TOPBAR, this.getTopbarRule('lightblue'));
    this.addRule(this.rules.HIDE_DATE,
      `.roam-body-main [data-link-title^="January"], [data-link-title^="February"], [data-link-title^="March"], [data-link-title^="April"], [data-link-title^="May"], [data-link-title^="June"], [data-link-title^="July"], [data-link-title^="August"], [data-link-title^="September"], [data-link-title^="October"], [data-link-title^="November"], [data-link-title^="December"] {
      display: none;}`);
    this.addRule(this.rules.ATTRIBUTE, ".rm-attr-ref { font-size: 14px !important }");

    // document.querySelector(".bp3-button + div").innerText =
    //   "Roam Husk review session started. x to exit";
  }

  showCard(mode) {
    const bgColor = mode === roamhusk.cardMode.FI ? '#acdeac' : 'lightblue';
    this.updateRule(this.rules.TOPBAR, this.getTopbarRule(bgColor));
  }

  showAnswer() {
    this.deleteRule(this.rules.HIDE_PATH);
    this.deleteRule(this.rules.HIDE_ANSWER);
    this.deleteRule(this.rules.HIDE_ATTRIBUTE);
  }

  hidePath() {
    this.addRule(this.rules.HIDE_PATH, ".roam-body-main .zoom-path-view { display: none; }");
  }

  hideAnswer() {
    this.addRule(this.rules.HIDE_ANSWER, ".roam-body-main .roam-block-container>.rm-block-children { visibility: hidden }");
  }

  hideAttribute() {
    this.addRule(this.rules.HIDE_ATTRIBUTE, ".roam-body-main .roam-block-container span { visibility: hidden }");
  }

  getTopbarRule(bgColor) {
    return `.roam-main .rm-topbar { background-color: ${bgColor} !important }`;
  }

  updateRule(rule, value) {
    this.deleteRule(rule);
    this.addRule(rule, value);
  }

  addRule(rule, value) {
    const newIndex = this.styleSheet.rules.length;
    this.styleSheet.insertRule(value, newIndex);
    this.activeRules.push(rule);
  }

  deleteRule(rule) {
    const index = this.activeRules.indexOf(rule);
    if (index >= 0) {
      this.styleSheet.deleteRule(index);
      this.activeRules.splice(index, 1);
    }
  }
}

class LocalStore {
  constructor() {
    // 20210119093326
    // https://raw.githubusercontent.com/jakearchibald/idb-keyval/master/dist/iife/index-min.js
    this.idbKeyval = (function (t) {
      "use strict";
      function e(t) {
        return new Promise((e, n) => {
          (t.oncomplete = t.onsuccess = () => e(t.result)),
            (t.onabort = t.onerror = () => n(t.error));
        });
      }
      function n(t, n) {
        const r = indexedDB.open(t);
        r.onupgradeneeded = () => r.result.createObjectStore(n);
        const o = e(r);
        return (t, e) => o.then(r => e(r.transaction(n, t).objectStore(n)));
      }
      let r;
      function o() {
        return r || (r = n("keyval-store", "keyval")), r;
      }
      function u(t, n) {
        return t(
          "readonly",
          t => (
            (t.openCursor().onsuccess = function () {
              this.result && (n(this.result), this.result.continue());
            }),
            e(t.transaction)
          )
        );
      }
      return (
        (t.clear = function (t = o()) {
          return t("readwrite", t => (t.clear(), e(t.transaction)));
        }),
        (t.createStore = n),
        (t.del = function (t, n = o()) {
          return n("readwrite", n => (n.delete(t), e(n.transaction)));
        }),
        (t.entries = function (t = o()) {
          const e = [];
          return u(t, t => e.push([t.key, t.value])).then(() => e);
        }),
        (t.get = function (t, n = o()) {
          return n("readonly", n => e(n.get(t)));
        }),
        (t.getMany = function (t, n = o()) {
          return n("readonly", n => Promise.all(t.map(t => e(n.get(t)))));
        }),
        (t.keys = function (t = o()) {
          const e = [];
          return u(t, t => e.push(t.key)).then(() => e);
        }),
        (t.promisifyRequest = e),
        (t.set = function (t, n, r = o()) {
          return r("readwrite", r => (r.put(n, t), e(r.transaction)));
        }),
        (t.setMany = function (t, n = o()) {
          return n(
            "readwrite",
            n => (t.forEach(t => n.put(t[1], t[0])), e(n.transaction))
          );
        }),
        (t.update = function (t, n, r = o()) {
          return r(
            "readwrite",
            r =>
              new Promise((o, u) => {
                r.get(t).onsuccess = function () {
                  try {
                    r.put(n(this.result), t), o(e(r.transaction));
                  } catch (t) {
                    u(t);
                  }
                };
              })
          );
        }),
        (t.values = function (t = o()) {
          const e = [];
          return u(t, t => e.push(t.value)).then(() => e);
        }),
        t
      );
    })({});
    this.load();
  }

  save(uid) {
    this.saveAll();
  }

  saveAll() {
    this.idbKeyval.set("roamhusk.srdata", roamhusk.nodes)
      .then(e => console.log("Successfully saved"))
      .catch(e => console.error("Problem saving nodes", e));
  }

  async load() {
    return roamhusk.convertLegacyDates(await this.idbKeyval.get("roamhusk.srdata")) || {};
  }
}

class FirebaseStore {
  // TODO: Update nodes from realtime updates.
  constructor() {
    const body = document.getElementsByTagName('body')[0];
    const scriptApp = document.createElement("script");
    scriptApp.src = "https://www.gstatic.com/firebasejs/8.2.5/firebase-app.js";
    body.appendChild(scriptApp);
    const scriptAuth = document.createElement("script");
    scriptAuth.src = "https://www.gstatic.com/firebasejs/8.2.5/firebase-auth.js";
    body.appendChild(scriptAuth);
    const scriptDb = document.createElement("script");
    scriptDb.src = "https://www.gstatic.com/firebasejs/8.2.5/firebase-database.js";
    body.appendChild(scriptDb);
    const appLoad = new Promise(resolve => { scriptApp.onload = () => resolve()});
    const authLoad = new Promise(resolve => { scriptAuth.onload = () => resolve()});
    const dbLoad = new Promise(resolve => { scriptDb.onload = () => resolve()});
    const signIn = async () => {
      firebase.initializeApp({
        apiKey: "AIzaSyDQTr17jlMuHqINMTBlmR6ANk680I_hoFg",
        authDomain: "roamhusk.firebaseapp.com",
        databaseURL: "https://roamhusk-default-rtdb.firebaseio.com/"
      });
      if (!firebase.auth().currentUser) {
        await firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider);
      }
      this.databaseRef = firebase.database().ref(`users/${firebase.auth().currentUser.uid}`);
    };
    this.init = Promise.all([appLoad, authLoad, dbLoad]).then(() => signIn());
    this.loading = this.load();
  }

  async load() {
    await this.init;
    const firebaseNodes = await this.databaseRef.once("value").then(snapshot => snapshot.val()?.nodes || {});
    const backupNodes = await roamhusk.backupStore.load();
    return Object.keys(firebaseNodes).length === 0 ? backupNodes : firebaseNodes;
  }

  async save(uid) {
    // TODO: save just the node.
    await this.saveAll(uid);
  }

  async saveAll() {
    await this.loading;
    this.databaseRef.set({
      nodes: roamhusk.nodes
    });
  }
}

class RoamStore {
  constructor() {
    this.dataPageUid = null;
  }

  async load() {
    const nodes = {};
    const storedNodes = await this.getRoamData();
    const backupNodes = await roamhusk.backupStore.load();
    if (storedNodes.length === 0) return backupNodes;
    storedNodes.forEach(node => nodes[node.uid] = node);
    return nodes;
  }

  // TODO: avoid calling this in favor of save()
  async saveAll() {
    for (const uid of Object.keys(roamhusk.nodes)) {
      await this.save(uid);
    }
  }

  async save(uid) {
    const storedNodes = await this.getRoamData();
    const storeUid = roamhusk.nodes[uid].storeUid;
    const nodeString = this.nodeToString(roamhusk.nodes[uid]);
    if (storeUid && storedNodes.find(node => node.storeUid === storeUid)) {
      roamAlphaAPI.updateBlock({ block: { uid: storeUid, string: nodeString } });
    } else {
      const pageUid = await this.getOrCreateDataPage();
      roamAlphaAPI.createBlock({
        location: {
          "parent-uid": pageUid,
          order: 0
        },
        block: { string: nodeString }
      });
      await new Promise(r => setTimeout(r, 100));
      const newStoredNodes = await this.getRoamData();
      roamhusk.nodes[uid].storeUid = newStoredNodes.find(node => node.uid === uid)?.storeUid;
    }
  }

  async getRoamData() {
    const pageUid = await this.getOrCreateDataPage();
    const pageResult = roamAlphaAPI.q(`[:find (pull ?e [:block/uid {:block/children [:block/uid :block/string]}]) :where [?e :block/uid "${pageUid}"]]`)[0][0];
    return (pageResult?.children || []).map(this.dataBlockToNode);
  }

  async getOrCreateDataPage() {
    // cache the page uid since it should never change
    if (this.dataPageUid) return this.dataPageUid;
    const title = "roam/husk/data"
    let pageResults = roamAlphaAPI.q(`[:find (pull ?e [:block/uid]) :where [?e :node/title "${title}"]]`);
    if (pageResults.length === 0) {
      roamAlphaAPI.createPage({ page: { title } });
      await new Promise(r => setTimeout(r, 100));
      pageResults = roamAlphaAPI.q(`[:find (pull ?e [:block/uid]) :where [?e :node/title "${title}"]]`);
    }
    this.dataPageUid = pageResults[0][0].uid;
    return this.dataPageUid;
  }

  dataBlockToNode(block) {
    const row = block.string.split(",");
    // TODO: needs string?
    return {
      uid: row[0],
      factor: row[1],
      interval: row[2],
      due: row[3],
      disabled: row[4],
      storeUid: block.uid
    }
  }

  nodeToString(node) {
    return `${node.uid},${node.factor},${node.interval},${node.due},${node.disabled}`;
  }
}

roamhusk.style = new StyleManager();
roamhusk.backupStore = new LocalStore(); // used to upgrade to hosted store
roamhusk.store = new RoamStore();

// Remove element by id
roamhusk.removeId = id => {
  let element = document.getElementById(id);
  if (element) element.remove();
};

// Add element to target
roamhusk.addElement = (element, target) => {
  if (element.id) roamhusk.removeId(element.id);
  target.appendChild(element);
};

// reads a setting attribute from graph, also converts booleans
roamhusk.getSetting = settingTitle => {
  let setting = roamAlphaAPI.q(
    `[:find (pull ?question [:block/uid :block/string]) :where [?question :block/refs ?srPage] [?srPage :node/title "roam/husk/${settingTitle}"] ]`
  );
  let settingValue =
    setting &&
    setting[0] &&
    setting[0][0] &&
    setting[0][0].string.split("::") &&
    setting[0][0].string.split("::")[1].trim();
  if (
    settingValue === "true" ||
    settingValue === "True" ||
    settingValue === "1"
  ) {
    return true;
  }
  if (
    settingValue === "false" ||
    settingValue === "False" ||
    settingValue === "0"
  ) {
    return false;
  }
  return settingValue;
};

roamhusk.addDays = (date, days) => date + days*24*60*60*1000;

roamhusk.randomFromInterval = (min, max) => Math.random() * (max - min) + min;

roamhusk.getNewParameters = (node, signal) => {
  // skipping card with 0
  if (signal === 0) {
    return node;
  }

  const factor = node.factor || roamhusk.defaultFactor;
  const interval = node.interval || roamhusk.defaultInterval;

  let newFactor = factor;
  let newInterval = interval;

  const factorModifier = 0.15;
  switch (signal) {
    case 1:
      newFactor = factor - 0.2;
      newInterval = 0;
      break;
    case 2:
      newFactor = factor - factorModifier;

      newInterval = interval * roamhusk.hardFactor;
      break;
    case 3:
      newInterval = interval * factor;
      break;
    case 4:
      newInterval = interval * factor;
      newFactor = factor + factorModifier;
      break;
  }
  const newDue = roamhusk.addDays(Date.now(), newInterval);
  return { ...node, interval: newInterval, factor: newFactor, due: newDue };
};


// --- Default settings ---
roamhusk.defaultFactor = 2.5;
roamhusk.defaultInterval = 2;
roamhusk.maxInterval = 50 * 365;
roamhusk.minFactor = 1.3;
roamhusk.hardFactor = 1.2;
roamhusk.jitterPercentage = 0.05;
roamhusk.active = false;

roamhusk.getParamsFromGraph = () => {
  roamhusk.defaultHidePath = roamhusk.getSetting("defaultHidePath");
  roamhusk.hidePathTag = roamhusk.getSetting("hidePathTag") || "sr";
  roamhusk.showPathTag = roamhusk.getSetting("showPathTag") || "srt";
  roamhusk.answerPathTag = roamhusk.getSetting("answerPathTag") || "sra";
  roamhusk.fractalInquiryTag = roamhusk.getSetting("fractalInquiryTag") || "fi";
  roamhusk.defaultAnswer = roamhusk.getSetting("defaultAnswer") || "3";
  roamhusk.includeRoamToolkit = roamhusk.getSetting("includeRoamToolkit");
  roamhusk.shouldRemoveInterval = roamhusk.getSetting("removeInterval");

  console.log("Settings", {
    defaultHidePath: roamhusk.defaultHidePath,
    hidePathTag: roamhusk.hidePathTag,
    showPathTag: roamhusk.showPathTag,
    answerPathTag: roamhusk.answerPathTag,
    includeRoamToolkit: roamhusk.includeRoamToolkit,
    defaultAnswer: roamhusk.defaultAnswer,
    fractalInquiryTag: roamhusk.fractalInquiryTag,
    removeInterval: roamhusk.shouldRemoveInterval
  });
};

roamhusk.dateRegex = new RegExp(
  /\[\[(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(st|nd|th|rd), \d{4}]]/gm
);

roamhusk.parseDateFromReference = name => {
  return roamhusk.parseDate(name.slice(2).slice(0, -2));
};

roamhusk.toUSDate = d => {
  const ye = new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
  const mo = new Intl.DateTimeFormat("en", { month: "short" }).format(d);
  const da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d);
  return `${da}-${mo}-${ye}`;
};

roamhusk.parseDate = name => new Date(name.replace(/(th,|nd,|rd,|st,)/, ",")).getTime();

roamhusk.parseNodes = nodes => {
  if (!roamhusk.nodes) {
    roamhusk.nodes = {};
  }
  const newNodes = { ...roamhusk.nodes };
  Object.keys(newNodes).forEach(x => {
    newNodes[x].disabled = true;
  });
  nodes.forEach(node => {
    let str = node[1];
    const rawInterval = str.match(/\[\[\[\[interval\]\]\:(.+?)\]\]/);
    const rawFactor = str.match(/\[\[\[\[factor\]\]\:(.+?)\]\]/);
    const rawDate = str.match(roamhusk.dateRegex);
    str = str
      .trim();
    // preserve existing metadata
    if (roamhusk.nodes[node[0]]) {
      newNodes[node[0]].disabled = false;
      newNodes[node[0]].string = str;
    } else if (rawInterval && rawFactor && rawDate) {
      newNodes[node[0]] = {
        interval: parseFloat(rawInterval[1]),
        factor: parseFloat(rawFactor[1]),
        due: roamhusk.parseDateFromReference(rawDate[0]),
        uid: node[0],
        string: str
      };
    } else {
      newNodes[node[0]] = {
        interval: 1,
        factor: 2.3,
        due: Date.now(),
        uid: node[0],
        string: str
      };
    }
  });
  roamhusk.nodes = { ...newNodes };
};

// --- Testing routine ---
var scriptUrl = document.currentScript.src;
var scriptId = document.currentScript.id;
roamhusk.testingReload = () => {
  roamhusk.wrapUp();
  document.removeEventListener("keyup", roamhusk.processKey);
  try {
    roamhusk.removeId(scriptId);
    roamhusk.removeId("roamhusk-review-button");
    roamhusk.removeId("roamhusk-refresh-button");
    roamhusk.removeId("roamhusk-counter-widget");
  } catch (e) { }

  document.getElementsByTagName("head")[0].appendChild(
    Object.assign(document.createElement("script"), {
      id: scriptId,
      src: scriptUrl,
      type: "text/javascript"
    })
  );
};

// Create refresh button
var refreshButton = Object.assign(document.createElement("div"), {
  id: "roamhusk-refresh-button",
  className: "bp3-button bp3-minimal bp3-small bp3-icon-refresh",
  onclick: roamhusk.testingReload
});

// Comment/uncomment here for debugging
roamhusk.addElement(
  refreshButton,
  document.querySelector(".rm-topbar")
);

// --- Main helper functions ---

// Go to uid
roamhusk.goToUid = uid => {
  let baseUrl =
    "/" +
    new URL(window.location.href).hash
      .split("/")
      .slice(0, 3)
      .join("/");
  let url = uid ? baseUrl + "/page/" + uid : baseUrl;
  console.log("Going to uid", uid, url);
  location.assign(url);

  // sometimes changing URL doesn't "stick" so retry
  window.setTimeout(() => {
    if (!window.location.href === url) {
      console.log("Trying to set URL second time");
      window.location.assign(url);
    } else { console.log('Arrived') }
  }, 100);
};

// Adding buttons to the topbar
var toggleModeButton = Object.assign(document.createElement("div"), {
  id: "roamhusk-review-button",
  className: "bp3-button bp3-minimal bp3-small",
  innerHTML: `<svg width="16" height="16" version="1.1" viewBox="0 0 4.2333 4.2333" style="color:5c7080;">
			<g id="chat_1_" transform="matrix(.26458 0 0 .26458 115.06 79.526)">
				<g transform="matrix(-.79341 0 0 -.88644 -420.51 -284.7)" fill="currentColor">
					<path d="m6 13.665c-1.1 0-2-1.2299-2-2.7331v-6.8327h-3c-0.55 0-1 0.61495-1 1.3665v10.932c0 0.7516 0.45 1.3665 1 1.3665h9c0.55 0 1-0.61495 1-1.3665l-5.04e-4 -1.5989v-1.1342h-0.8295zm9-13.665h-9c-0.55 0-1 0.61495-1 1.3665v9.5658c0 0.7516 0.45 1.3665 1 1.3665h9c0.55 0 1-0.61495 1-1.3665v-9.5658c0-0.7516-0.45-1.3665-1-1.3665z"
					 clip-rule="evenodd" fill="currentColor" fill-rule="evenodd" />
				</g>
			</g>
		</svg>`,
  onclick: async () => {
    roamhusk.letsGo();
  }
});
toggleModeButton.style.cssText =
  "height: 24px; width: 24px; cursor: pointer; display: grid; place-content: center; gap: 1ch;";

roamhusk.addElement(
  toggleModeButton,
  document.querySelector(".rm-topbar")
);

// Make Alt+D leave review mode

roamhusk.getNodes = () => {
  let searchTags = [];
  if (roamhusk.includeRoamToolkit) {
    searchTags.push("interval");
  }
  if (roamhusk.hidePathTag) {
    searchTags.push(roamhusk.hidePathTag);
  }
  if (roamhusk.showPathTag) {
    searchTags.push(roamhusk.showPathTag);
  }
  if (roamhusk.answerPathTag) {
    searchTags.push(roamhusk.answerPathTag);
  }
  if (roamhusk.fractalInquiryTag) {
    searchTags.push(roamhusk.fractalInquiryTag);
  }
  let searchQuery = searchTags.map(x => ` [?srPage :node/title "${x}"]`);

  return window.roamAlphaAPI
    .q(
      `[:find (pull ?question [:block/uid :block/string]) :where [?question :block/refs ?srPage] (or ${searchQuery})
      (not-join [?question] [?question :block/refs ?query] [?query :node/title "query"])]`
    )
    .filter(x => x[0].string)
    .map(x => [x[0].uid, x[0].string]);
};

roamhusk.loadNodes = () => {
  roamhusk.getParamsFromGraph();
  roamhusk.parseNodes(roamhusk.getNodes());
};

roamhusk.store.load()
  .then(e => {
    console.log("Successfully loaded");
    roamhusk.nodes = e;
  })
  .catch(e => console.error("Problem loading nodes", e));

roamhusk.letsGo = () => {
  if (roamhusk.active) {
    roamhusk.active = false;
    roamhusk.wrapUp();
    return;
  }
  document.addEventListener("keyup", roamhusk.processKey);
  roamhusk.active = true;
  roamhusk.style.start();
  roamhusk.originalURL = document.location.href;
  console.log(
    "Starting, storing original URL to go back ",
    roamhusk.originalURL
  );
  roamhusk.loadNodes();
  roamhusk.store.saveAll(); // TODO: can this be avoided?
  roamhusk.getSortedDueCards(roamhusk.nodes);
  roamhusk.showCard();
};

roamhusk.sameDay = (t1, t2) => {
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

roamhusk.shuffle = array => {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

roamhusk.fixedLength = (str, length) =>
  (str + "" + " ".repeat(80)).slice(0, length);

roamhusk.formatNode = node =>
  `F: ${roamhusk.fixedLength(node.factor, 4)}  I: ${roamhusk.fixedLength(
    node.interval,
    4
  )}  D: ${roamhusk.fixedLength(roamhusk.toUSDate(node.due), 12)} ${node.uid
  }: ${roamhusk.fixedLength(node.string, 80)}`;

roamhusk.getSortedDueCards = () => {
  const today = Date.now();
  const yesterday = roamhusk.addDays(today, -1);
  let todaysCards = [];
  let yesterdaysCards = [];
  const overdueCards = Object.values(roamhusk.nodes)
    .filter(x => {
      if (x.blocked || x.disabled) {
        return false;
      }
      if (roamhusk.sameDay(x.due, today)) {
        todaysCards.push(x);
        return false;
      } else if (roamhusk.sameDay(x.due, yesterday)) {
        yesterdaysCards.push(x);
        return false;
      } else {
        return true;
      }
    })
    .filter(x => x.due < today);
  console.groupCollapsed("Yesterday's cards");
  yesterdaysCards.forEach(x => console.log(roamhusk.formatNode(x)));
  console.groupEnd();
  console.groupCollapsed("Today's cards");
  todaysCards.forEach(x => console.log(roamhusk.formatNode(x)));
  console.groupEnd();
  console.groupCollapsed("Other cards, sorted");
  roamhusk.shuffle(overdueCards);
  overdueCards.forEach(x => console.log(roamhusk.formatNode(x)));
  console.groupEnd();
  roamhusk.cardsToReview = yesterdaysCards.concat(
    todaysCards.concat(overdueCards)
  );
  if (roamhusk.cardsToReview.length === 0) {
    window.alert("No due or overdue cards, come back tomorrow");
    roamhusk.wrapUp();
  }
  roamhusk.currentCard = 0;
  roamhusk.showAnswer = false;
};

roamhusk.showPathForCard = (card, showAnswer) => {
  let string = card.string + " ";
  let showPath =
    string.includes("#" + roamhusk.fractalInquiryTag + " ") ||
    !roamhusk.defaultHidePath ||
    string.includes("#" + roamhusk.showPathTag + " ") ||
    (showAnswer && string.includes("#" + roamhusk.answerPathTag + " "));
  if (string.includes("#" + roamhusk.hidePathTag + " ")) {
    showPath = false;
  }
  return showPath;
};

roamhusk.removeInterval = (str, uid) => {
  const newStr =
    str
      .replace(/\[\[\[\[interval\]\]\:(.+?)\]\]/g, "")
      .replace(/\[\[\[\[factor\]\]\:(.+?)\]\]/g, "")
      .replace(roamhusk.dateRegex, "")
      .trim() +
    " #" +
    roamhusk.hidePathTag;

  console.log("Replacing ", str, " -> ", newStr);
  roamAlphaAPI.updateBlock({ block: { uid, string: newStr } });
};

roamhusk.showCard = () => {
  if (!roamhusk.active) {
    return;
  }
  const currentCard = roamhusk.cardsToReview[roamhusk.currentCard];
  const string = currentCard.string + " ";
  if (string.includes("[[interval]]") && roamhusk.shouldRemoveInterval) {
    roamhusk.removeInterval(string, currentCard.uid);
  }

  // go straight to answer if fractal inquiry, otherwise question
  if (string.includes("#" + roamhusk.fractalInquiryTag + " ")) {
    console.log("fractal", string);
    roamhusk.showAnswer = true;
    roamhusk.style.showCard(roamhusk.cardMode.FI);
  } else {
    roamhusk.style.showCard(roamhusk.cardMode.DEFAULT);
  }

  // no more cards
  if (!currentCard) {
    roamhusk.wrapUp();
    return;
  }
  const showPath = roamhusk.showPathForCard(currentCard, roamhusk.showAnswer);
  // if always show, or the tag that asks us to show, or answer if the tag that asks to show in answer

  roamhusk.style.showAnswer();

  roamhusk.goToUid(roamhusk.cardsToReview[roamhusk.currentCard].uid);
  if (!showPath) {
    roamhusk.style.hidePath();
  }
  if (!roamhusk.showAnswer) {
    roamhusk.style.hideAnswer();

    if (roamhusk.cardsToReview[roamhusk.currentCard].string.includes("::")) {
      roamhusk.style.hideAttribute();
      // document.querySelector(".bp3-button + div").innerText =
      //   "Roam Husk Review Session -- <x> to exit, <1-4> to answer";
    }
  } else {
    // document.querySelector(".bp3-button + div").innerText =
    //   "Roam Husk Review Session -- <x> to exit, <SPC> to flip, <1-4> to answer";

    // click all cloze hidden selectors
    document
      .querySelectorAll(".bp3-popover-target .rm-block__part--equals")
      .forEach(x => x.click());
  }
};

roamhusk.download = (filename, text) => {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

roamhusk.downloadNodes = () => {
  console.log("preparing for download");
  roamhusk.download(
    `roamhusk-backup-${roamhusk.toUSDate(new Date())}.json`,
    JSON.stringify(roamhusk.nodes)
  );
};

roamhusk.uploadNodes = () => {
  console.log(roamhusk.input);
  if (roamhusk.input) {
    console.log("already exists, cancel");
    return;
  }
  roamhusk.input = document.createElement("input");
  roamhusk.input.setAttribute("type", "file");
  roamhusk.input.setAttribute("id", "roamhusk.upload");
  roamhusk.input.addEventListener("change", roamhusk.onFile);
  roamhusk.input.click();
};

roamhusk.onFile = e => {
  const file = roamhusk.input.files[0];
  roamhusk.input = null;
  const reader = new FileReader();
  reader.onload = event => {
    try {
      newNodes = JSON.parse(reader.result);
      if (Object.values(newNodes)[0].interval) {
        roamhusk.nodes = roamhusk.convertLegacyDates(newNodes);
        roamhusk.store.saveAll();
        console.log(`Successfully loaded ${newNodes.length} nodes`);
        roamhusk.currentCard = 0;
        roamhusk.cardsToReview = roamhusk.getSortedDueCards();
      } else {
        console.error(`Failed parsing`, newNodes);
      }
    } catch (e) {
      console.error(`Failed uploading or parsing`, e);
    }
  };
  reader.readAsText(file);
};

roamhusk.wrapUp = () => {
  roamhusk.active = false;
  console.log("End of play, returning to ", roamhusk.originalURL);

  document.removeEventListener("keyup", roamhusk.processKey);
  // document.querySelector(".bp3-button + div").innerText = "";
  location.assign(roamhusk.originalURL);
  roamhusk.style.clear();
};

// b to block, 1-4 to answer (1=forgot, 4=easy)
roamhusk.processAnswer = key => {
  // if no more cards
  if (!roamhusk.cardsToReview[roamhusk.currentCard]) {
    roamhusk.wrapUp();
    return;
  }
  const uid = roamhusk.cardsToReview[roamhusk.currentCard].uid;
  console.log("Before updating: ", roamhusk.nodes[uid]);

  // disable card (block)
  if (key === "b") {
    roamhusk.nodes[uid] = { ...roamhusk.nodes[uid], blocked: true };
  } else {
    // process difficulty rating
    roamhusk.nodes[uid] = roamhusk.enforceLimits(
      roamhusk.addJitter(
        roamhusk.getNewParameters(roamhusk.nodes[uid], parseInt(key, 10))
      )
    );
  }

  console.log(`After responding ${parseInt(key, 10)}: `, roamhusk.nodes[uid]);
  roamhusk.store.save(uid);
  roamhusk.currentCard += 1;
  if (roamhusk.currentCard === roamhusk.cardsToReview.length) {
    console.log("All cards due reviewed");
    roamhusk.wrapUp();
  }
  roamhusk.showAnswer = false;
  roamhusk.showCard();
};

roamhusk.processKey = e => {
  if (document.querySelector("textarea")) {
    console.log(
      "Actively editing a block, so don't process keystrokes as shortcuts"
    );
    return;
  }
  if (e.keyCode === 32) {
    if (roamhusk.showAnswer) {
      roamhusk.processAnswer(roamhusk.defaultAnswer);
    } else {
      roamhusk.showAnswer = true;
      roamhusk.showCard();
    }
  } else if (
    e.key === "1" ||
    e.key === "2" ||
    e.key === "3" ||
    e.key === "4" ||
    e.key === "0" ||
    e.key === "b"
  ) {
    roamhusk.processAnswer(e.key);
  } else if (e.key === "x") {
    roamhusk.wrapUp();
  } else if (e.key === "d") {
    roamhusk.downloadNodes();
  } else if (e.key === "u") {
    roamhusk.uploadNodes();
  }
};
roamhusk.randomFromInterval = (min, max) => Math.random() * (max - min) + min;

roamhusk.addJitter = node => {
  // I wonder if i can make this "regressive" i.e. start with larger number &
  // reduce percentage, as the number grows higher
  const jitter = node.interval * roamhusk.jitterPercentage;
  return {
    ...node,
    interval: node.interval + roamhusk.randomFromInterval(-jitter, jitter)
  };
};

roamhusk.enforceLimits = node => {
  return {
    ...node,
    interval: Math.min(node.interval, roamhusk.maxInterval),
    factor: Math.max(node.factor, roamhusk.minFactor)
  };
};

window.onbeforeunload = () => {
  roamhusk.hasEventListener = null;
};
