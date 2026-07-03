/* Bin Day — shared collection model + icon set (no emojis).
   Reused by both design previews. Logic verified against the official
   Colchester calendar (29 May – 20 Nov 2026). */
(function (global) {
  'use strict';

  // Collections are every Friday. Food waste goes out EVERY week. Weeks
  // alternate between a "recycling" week (mixed recycling + glass + garden)
  // and a "rubbish" week (non-recyclable). Anchor: Fri 5 Jun 2026 = rubbish week.
  var ANCHOR = Date.UTC(2026, 5, 5);
  var OFFICIAL_END = Date.UTC(2026, 10, 20); // 20 Nov 2026, last printed date
  var DAY = 86400000, WEEK = 7 * DAY;

  // Hand-drawn line icons (24×24, stroke = currentColor). No emojis.
  var ICONS = {
    food: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8.6C10.8 6.3 7.6 5.9 6 7.9c-1.7 2-1 5.7 1 8.1.9 1.1 2 1.7 3 1.7s2.1-.6 3-1.7c2-2.4 2.7-6.1 1-8.1-1.6-2-4.8-1.6-6 .7Z"/><path d="M12 8.6V4.8"/><path d="M12 4.8c0-1.6 1.4-2.5 3-2.3-.1 1.6-1.5 2.6-3 2.3Z"/></svg>',
    recycling: '<svg class="ic spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5A7 7 0 0 1 16.2 7l1.6 1.6"/><path d="M18.2 4.4v4.4h-4.4"/><path d="M18 14.6A7 7 0 0 1 7.8 17l-1.6-1.6"/><path d="M5.8 19.6v-4.4h4.4"/></svg>',
    glass: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M11 3h2v3.6l1.3 2.3c.2.4.3.8.3 1.2V20a1 1 0 0 1-1 1h-3.2a1 1 0 0 1-1-1V10.1c0-.4.1-.8.3-1.2L11 6.6V3Z"/><path d="M9.4 13h5.2"/></svg>',
    garden: '<svg class="ic sway" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20c0-7.5 5.5-12.5 14.5-13.5C18.5 15 13 20 5 20Z"/><path d="M5 20c2.2-4.3 5.2-6.6 9.5-7.5"/></svg>',
    rubbish: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9.5 7V5.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7"/><path d="M6.2 7l.9 12.8a1 1 0 0 0 1 1h7.8a1 1 0 0 0 1-1L17.8 7"/><path d="M10 11v6M14 11v6"/></svg>'
  };

  var BINS = {
    food:      {key:'food',      name:'Food waste',      sub:'Every week',              icon: ICONS.food},
    recycling: {key:'recycling', name:'Mixed recycling',  sub:'Cans · paper · card · plastic', icon: ICONS.recycling},
    glass:     {key:'glass',     name:'Glass',            sub:'Bottles & jars',          icon: ICONS.glass},
    garden:    {key:'garden',    name:'Garden waste',     sub:'Grass & clippings',       icon: ICONS.garden},
    rubbish:   {key:'rubbish',   name:'Non-recyclable',   sub:'General rubbish',         icon: ICONS.rubbish}
  };

  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function todayUTC(){ var n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()); }
  function nextFridayFrom(from){ var d = new Date(from); return from + ((5 - d.getUTCDay() + 7) % 7) * DAY; }

  function binsFor(ts){
    var weekIdx = Math.round((ts - ANCHOR) / WEEK);
    var recyclingWeek = (weekIdx % 2 !== 0); // anchor (idx 0) is a rubbish week
    return recyclingWeek ? ['food','recycling','glass','garden'] : ['food','rubbish'];
  }

  function fmtDate(ts){ var d = new Date(ts); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function fmtShort(ts){ var d = new Date(ts); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()].slice(0,3); }
  function dayName(ts){ return DAYS[new Date(ts).getUTCDay()]; }

  function countdown(ts, today){
    var days = Math.round((ts - today) / DAY);
    if (days <= 0) return {txt:'Today', cls:'today', days:0};
    if (days === 1) return {txt:'Tomorrow', cls:'soon', days:1};
    if (days <= 3) return {txt:'In ' + days + ' days', cls:'soon', days:days};
    return {txt:'In ' + days + ' days', cls:'', days:days};
  }

  // A collection descriptor for templating.
  function collection(ts, today){
    return {
      ts: ts, day: dayName(ts), date: fmtDate(ts), short: fmtShort(ts),
      month: MONTHS[new Date(ts).getUTCMonth()], year: new Date(ts).getUTCFullYear(),
      bins: binsFor(ts).map(function(k){ return BINS[k]; }),
      count: countdown(ts, today), estimated: ts > OFFICIAL_END
    };
  }

  // All upcoming collections from `fromTs` to the official end, then continuing
  // the fortnightly pattern for `extraWeeks` more (flagged estimated).
  function upcoming(fromTs, today, extraWeeks){
    var out = [], ts = nextFridayFrom(fromTs);
    var end = Math.max(OFFICIAL_END, fromTs + (extraWeeks || 26) * WEEK);
    while (ts <= end){ out.push(collection(ts, today)); ts += WEEK; }
    return out;
  }

  global.BinDay = {
    BINS: BINS, ICONS: ICONS, MONTHS: MONTHS, DAYS: DAYS, WEEK: WEEK,
    OFFICIAL_END: OFFICIAL_END, todayUTC: todayUTC, nextFridayFrom: nextFridayFrom,
    binsFor: binsFor, countdown: countdown, collection: collection, upcoming: upcoming,
    fmtDate: fmtDate, fmtShort: fmtShort, dayName: dayName
  };
})(window);
