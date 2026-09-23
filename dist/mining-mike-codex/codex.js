/* Field Codex mockup. Reads window.CODEX (data.js, written by gen_bestiary.py)
   and draws it: the list, the dossier, and a three.js viewer that plays each
   model's own animation clips at its measured size beside the Combat mech.

   Everything the page decides for itself is the PROPOSAL (how knowledge is
   earned and what it pays) and the three example save states below. Every
   stat, name, size and clip comes from the game. */
(function () {
  'use strict';

  var C = window.CODEX;
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(v) {
    if (typeof v !== 'number') return esc(v);
    if (Math.abs(v - Math.round(v)) < 1e-9) return Math.round(v).toLocaleString('en-US');
    var d = Math.abs(v) < 1 ? 2 : 1;
    return (+v.toFixed(d)).toLocaleString('en-US', { maximumFractionDigits: d });
  }
  function human(k) { return String(k).replace(/_/g, ' ').toUpperCase(); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ------------------------------------------------------------------ index
  var WEAPON = {}, SECTOR = {}, HOST = {}, ALLY = {};
  C.weapons.forEach(function (w) { WEAPON[w.key] = w; });
  C.sectors.forEach(function (s, i) { s.index = i; SECTOR[s.key] = s; });
  C.hostiles.forEach(function (h) { h.side = 'hostile'; HOST[h.key] = h; });
  C.mechs.forEach(function (m) { m.kind = 'mech'; m.side = 'ally'; m.weaponKey = 'mech'; ALLY[m.key] = m; });
  C.units.concat(C.buildings).forEach(function (a) { a.side = 'ally'; a.weaponKey = a.weapon || null; ALLY[a.key] = a; });
  // The crew are on the page and nowhere else: no numbers, no knowledge
  // track, no part of any total. ALLIES (below) leaves them out on purpose.
  (C.crew || []).forEach(function (a) { a.side = 'ally'; a.kind = 'crew'; a.weaponKey = null; ALLY[a.key] = a; });
  function isCrew(e) { return e.kind === 'crew'; }
  var ALLIES = C.mechs.concat(C.units, C.buildings);
  var YARD = ALLY[C.yardstick];
  var YARD_MODEL = YARD.models[C.yardstick];
  var MECH_H = YARD_MODEL.size[1];
  var T_HOST = C.tiers.hostile, T_BOSS = C.tiers.boss, T_ALLY = C.tiers.ally;

  function isFinale(h) { return h.boss === 'finale'; }

  // ------------------------------------------------------------------ hit rules
  // The game's real reach rules (CLAUDE.md: nothing that fires along the
  // ground can hit a flyer; the Locust is air mid-hop; the Manta is a ladder).
  // `wk` is a codex weapon (the matchup columns) or a weapon TYPE from
  // C.elements (what COUNTERED counts: each tower, the mech gun, and every
  // salvaged mech weapon). A type borrows the per-weapon rules of the codex
  // weapon it belongs to (`resist`), so the Egg Clutch's "towers leave it
  // alone" covers the turret type and not the mech's Scattergun.
  var ELEM = {};
  C.elements.forEach(function (el) { ELEM[el.key] = el; });
  function reach(h, wk) {
    var w = WEAPON[wk] || ELEM[wk];
    var rk = ELEM[wk] ? ELEM[wk].resist : wk;
    if (h.hit === 'air') return w.air ? { can: true, q: '' } : { can: false, q: 'It flies. Nothing on the ground reaches it.' };
    if (h.hit === 'landed') {
      if (w.air && w.ground) return { can: true, q: 'In the air or landed' };
      if (w.air) return { can: true, q: 'Only mid-hop' };
      return { can: true, q: 'Only while landed' };
    }
    if (h.hit === 'ladder') {
      if (wk === 'missile_turret') return { can: true, q: 'At every height' };
      if (wk === 'mech:missiles') return { can: true, q: 'While she flies, at any height' };
      if (w.air) return { can: true, q: 'Once she trawls at 46' };
      return { can: true, q: 'Only once grounded, below 35%' };
    }
    if (h.hit && h.hit[rk] === 'no') return { can: false, q: 'Left alone by design' };
    return w.ground ? { can: true, q: '' } : { can: false, q: 'Air targets only' };
  }
  function reachableTypes(h) { return C.elements.filter(function (el) { return reach(h, el.key).can; }).map(function (el) { return el.key; }); }
  function track(h) { return C.kills[h.track || 'standard']; }

  // ------------------------------------------------------------------ balance
  // codex_balance.json, the file the game reads (scripts/codex_balance.gd).
  // BAL is what the page shows and edits. LOADED is the file as it was
  // loaded, so an edit is anything that differs from it. CFG0 is the .tres
  // value of every GameConfig key a stat names; a "config" entry in the file
  // is laid over it, exactly as the game lays it over GameConfig at boot.
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var BAL = clone(C.balance), LOADED = clone(C.balance), CFG0 = C.config_base;
  BAL.config = BAL.config || {};
  var BAL_FROM = 'the copy built into this page';
  function cfg(k) { return BAL.config[k] != null ? +BAL.config[k] : CFG0[k]; }
  function loadedCfg(k) { return LOADED.config && LOADED.config[k] != null ? +LOADED.config[k] : CFG0[k]; }
  function resRow(key) { return (BAL.resist && BAL.resist[key]) || {}; }
  function mult(h, wk) { var r = resRow(h.key); return r[wk] != null ? +r[wk] : 1.0; }
  function armourOf(h) { var r = resRow(h.key); return r.armour != null ? +r.armour : 0.0; }
  function loadedRes(key, f) {
    var r = LOADED.resist && LOADED.resist[key];
    return r && r[f] != null ? +r[f] : (f === 'armour' ? 0 : 1);
  }
  function resChanged(key, f) { return loadedRes(key, f) !== (resRow(key)[f] != null ? +resRow(key)[f] : (f === 'armour' ? 0 : 1)); }

  function edits() {
    var out = [];
    Object.keys(CFG0).forEach(function (k) {
      var a = loadedCfg(k), b = cfg(k);
      if (a !== b) out.push({ what: k, from: a, to: b });
    });
    Object.keys(BAL.resist || {}).forEach(function (hk) {
      Object.keys(BAL.resist[hk]).forEach(function (f) {
        var a = loadedRes(hk, f), b = +BAL.resist[hk][f];
        if (a !== b) out.push({ what: 'resist.' + hk + '.' + f, from: a, to: b });
      });
    });
    return out;
  }
  var undo = [];
  function setCfg(k, v) {
    undo.push(clone(BAL));
    if (Number.isInteger(CFG0[k])) v = Math.round(v);
    if (v === CFG0[k]) delete BAL.config[k]; else BAL.config[k] = v;
    saveDraft();
  }
  function setRes(hk, f, v) {
    undo.push(clone(BAL));
    if (f === 'armour') v = clamp(v, 0, 0.95); else v = Math.max(0, v);
    BAL.resist[hk] = BAL.resist[hk] || {};
    BAL.resist[hk][f] = v;
    saveDraft();
  }
  // The file EXPORT writes: the same shape the game reads. Only the config
  // keys that differ from the .tres are written, so an Inspector edit to any
  // other key still reaches the game.
  function exportText() {
    var doc = { version: BAL.version || 1, about: BAL.about || '', config: {}, resist: BAL.resist };
    Object.keys(BAL.config).sort().forEach(function (k) {
      if (CFG0[k] === undefined || +BAL.config[k] !== CFG0[k]) doc.config[k] = BAL.config[k];
    });
    return JSON.stringify(doc, null, 2) + '\n';
  }
  // An unsent draft survives a reload in this browser only, and only against
  // the same file it was made from.
  var DRAFT = 'mm-codex-draft';
  function saveDraft() {
    try { localStorage.setItem(DRAFT, JSON.stringify({ base: JSON.stringify(LOADED), bal: BAL })); } catch (e) {}
  }
  function restoreDraft() {
    try {
      var d = JSON.parse(localStorage.getItem(DRAFT) || 'null');
      if (d && d.base === JSON.stringify(LOADED) && d.bal && d.bal.resist) { BAL = d.bal; BAL.config = BAL.config || {}; }
    } catch (e) {}
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT); } catch (e) {} }

  // ------------------------------------------------------------------ save states
  // Example progress, so the page opens on something that looks played.
  // Plainly examples: none of it is anyone's save.
  // `k` is kills; `hit` is every weapon TYPE that has hit it at least once
  // (the C.elements keys: tower types, "mech_gun", "mech:<salvage key>").
  var PRESETS = {
    fresh: {
      sectors: ['dust_hive'], research: [], shop: [],
      hostiles: {
        grunt: { k: 180, hit: ['mech_gun', 'turret'] },
        runner: { k: 60, hit: ['mech_gun'] },
        snake: { k: 12, hit: ['mech_gun'] }
      },
      allies: {
        mech_combat: { b: 1, j: 18 }, hq: { b: 1, j: 1 }, power_plant: { b: 2, j: 3 },
        pylon: { b: 3, j: 3 }, turret: { b: 2, j: 4 }, wall: { b: 5, j: 40 }, refinery: { b: 1, j: 2 }
      }
    },
    mid: {
      sectors: ['dust_hive', 'long_haul'],
      research: ['unlock_lightning', 'turret_ice', 'unlock_battery', 'unlock_repair_drone'],
      shop: ['miner_drone'],
      hostiles: {
        grunt: { k: 3800, hit: ['turret', 'mech_gun', 'lightning', 'slow', 'mech:shotgun'] },
        runner: { k: 1400, hit: ['turret', 'mech_gun', 'lightning'] },
        snake: { k: 610, hit: ['turret', 'mech_gun'] },
        egg_clutch: { k: 40, hit: ['mech_gun'] },
        hydralisk: { k: 7, hit: ['turret', 'mech_gun'] },
        shield_generator: { k: 48, hit: ['mech_gun', 'turret'] },
        orb_weaver: { k: 3, hit: ['mech_gun', 'turret', 'lightning'] },
        drillhead: { k: 520, hit: ['turret', 'lightning', 'mech_gun'] },
        tank: { k: 30, hit: ['turret'] },
        tyrant: { k: 0, seen: true, hit: [] }
      },
      allies: {
        mech_combat: { b: 14, j: 820 }, mech_mining: { b: 5, j: 130 }, mech_repair: { b: 2, j: 20 },
        mech_construction: { b: 1, j: 4 }, hq: { b: 18, j: 52 }, power_plant: { b: 60, j: 140 },
        pylon: { b: 85, j: 160 }, refinery: { b: 30, j: 210 }, battery: { b: 6, j: 12 },
        scanner: { b: 4, j: 9 }, turret: { b: 120, j: 640 }, lightning: { b: 14, j: 92 },
        slow: { b: 9, j: 300 }, repair_drone: { b: 3, j: 40 }, wall: { b: 210, j: 2400 },
        miner_drone: { b: 4, j: 60 }, dozer: { b: 1, j: 12 }, paver: { b: 1, j: 12 }
      }
    },
    // The demo is Dust Hive alone. Everything in it countered and the Orb
    // Weaver mastered: the two SP the codex can pay inside a demo.
    demo: {
      sectors: ['dust_hive'], research: ['unlock_lightning', 'turret_ice'], shop: ['miner_drone'],
      hostiles: {
        grunt: { k: 2400, hit: ['turret', 'mech_gun', 'lightning', 'mech:shotgun'] },
        runner: { k: 900, hit: ['turret', 'mech_gun', 'mech:shotgun'] },
        snake: { k: 520, hit: ['turret', 'mech_gun', 'lightning'] },
        egg_clutch: { k: 120, hit: ['mech_gun', 'mech:shotgun', 'mech:burning'] },
        hydralisk: { k: 6, hit: ['turret', 'mech_gun', 'lightning'] },
        shield_generator: { k: 104, hit: ['mech_gun', 'turret', 'lightning'] },
        orb_weaver: { k: 10, hit: ['mech_gun', 'turret', 'mech:shotgun'] }
      },
      allies: {
        mech_combat: { b: 9, j: 510 }, mech_mining: { b: 3, j: 60 }, hq: { b: 11, j: 30 },
        power_plant: { b: 40, j: 90 }, pylon: { b: 50, j: 100 }, refinery: { b: 18, j: 120 },
        turret: { b: 80, j: 420 }, lightning: { b: 8, j: 70 }, slow: { b: 5, j: 140 }, wall: { b: 120, j: 900 }
      }
    },
    done: null
  };
  PRESETS.done = (function () {
    var p = { sectors: C.sectors.map(function (s) { return s.key; }), research: Object.keys(C.research_names),
      shop: ['miner_drone', 'repair_companion'], hostiles: {}, allies: {} };
    C.hostiles.forEach(function (h) {
      p.hostiles[h.key] = { k: track(h).mastered + Math.ceil(track(h).mastered / 5), hit: reachableTypes(h) };
    });
    ALLIES.forEach(function (a) { p.allies[a.key] = { b: 40, j: 150 }; });
    return p;
  })();

  var state = { preset: 'mid', side: 'hostile', sel: { hostile: 'grunt', ally: 'mech_combat' }, designer: false, wave: {}, skin: {} };
  var P = PRESETS[state.preset];

  // ------------------------------------------------------------------ progress
  function hp(h) { return P.hostiles[h.key] || { k: 0, hit: [] }; }
  // The weapon types that have hit it and could: a type that cannot reach it
  // never counts, whatever a save says.
  function learned(h) {
    var p = hp(h);
    return (p.hit || []).filter(function (k) { return ELEM[k] && reach(h, k).can; });
  }
  // Something only a few types can reach (a flyer: the Missile Turret, the SAM
  // and the mech's Missile Rack) is countered by every one of them.
  function matchNeed(h) { return Math.min(C.counter_types, reachableTypes(h).length); }
  function tierOf(e) {
    if (e.side === 'ally') return allyTier(e);
    var p = hp(e), K = track(e);
    if (!p.k && !p.seen) return 0;
    if (p.k < K.catalogued) return 1;
    if (learned(e).length < matchNeed(e)) return 2;
    if (p.k < K.experienced) return 3;
    if (p.k < K.mastered) return 4;
    return 5;
  }
  function available(a) {
    var u = a.unlock;
    if (u[0] === 'start') return true;
    if (u[0] === 'research') return P.research.indexOf(u[1]) >= 0;
    if (u[0] === 'sector') return P.sectors.indexOf(u[1]) >= 0;
    if (u[0] === 'shop') return P.shop.indexOf(a.key) >= 0;
    return false;
  }
  function ap(a) { return P.allies[a.key] || { b: 0, j: 0 }; }
  function allyTier(a) {
    if (!available(a)) return 0;
    var p = ap(a);
    if (p.b < T_ALLY[0].built) return 0;
    if (p.b < T_ALLY[1].built) return 1;
    if (p.j < T_ALLY[2].jobs) return 2;
    return 3;
  }
  function tiersFor(e) { return isCrew(e) ? [] : (e.side === 'ally' ? T_ALLY : (isFinale(e) ? T_BOSS : T_HOST)); }
  function earned(e) {
    var t = tierOf(e), pp = 0, sp = 0;
    tiersFor(e).forEach(function (r) { if (r.n <= t) { pp += r.pp; sp += r.sp; } });
    return { pp: pp, sp: sp };
  }
  function lockOf(a) {
    var u = a.unlock;
    if (available(a)) return null;
    if (u[0] === 'research') return { t: 'RESEARCH', b: 'Unlocks with ' + C.research_names[u[1]] + ' in the research tree.' };
    if (u[0] === 'sector') return { t: 'SECTOR', b: 'Part of ' + SECTOR[u[1]].name + '\'s kit. Reach that sector to field it.' };
    if (u[0] === 'shop') return { t: 'SUPPLY DEPOT', b: 'A crate at the Supply Depot. Buy it once to field it.' };
    return { t: 'NOT IN THE GAME YET', soon: true,
      b: 'The chassis is modelled and rigged, but mech_role.gd gates it on research key ' + u[1] +
         ', which is not in the tree. Nothing can unlock it today.' };
  }
  var JOB = {
    slow: 'enemies chilled', hq: 'waves held', power_plant: 'buildings powered', pylon: 'buildings powered',
    battery: 'outages covered', refinery: 'loads refined', scanner: 'wrecks found', repair_drone: 'repairs',
    repair_companion: 'repairs', wall: 'hits absorbed', belt: 'crates carried', excavator: 'cells dug',
    miner_drone: 'seams mined', dozer: 'road cells graded', paver: 'road cells laid', transport: 'flights out',
    muster_siren: 'crowds called', hangar: 'sorties', fighter_factory: 'fighters built',
    control_tower: 'lifts called', launch_pad: 'launches'
  };
  function jobNoun(a) { return a.weaponKey || a.key === 'fighter' ? 'kills' : (JOB[a.key] || 'jobs done'); }

  // The last step of its own track, whatever that track's length.
  function mastered(h) { return tierOf(h) >= tiersFor(h).length; }
  function milestoneDone(m) {
    var k = m.key;
    if (k.indexOf('boss_') === 0) return mastered(HOST[k.slice(5)]);
    if (k.indexOf('sector_') === 0) {
      var g = k.slice(7);
      return C.hostiles.filter(function (h) { return h.group === g && !isFinale(h); })
        .every(function (h) { return tierOf(h) >= 3; });
    }
    if (k === 'all_hostiles') return C.hostiles.every(mastered);
    if (k === 'all_allies') {
      var av = ALLIES.filter(available);
      return av.length > 0 && av.every(function (a) { return allyTier(a) >= 3; });
    }
    return false;
  }
  function totals() {
    var pp = 0, got = 0, max = 0;
    C.hostiles.forEach(function (h) { pp += earned(h).pp; got += tierOf(h); max += tiersFor(h).length; });
    ALLIES.forEach(function (a) {
      pp += earned(a).pp;
      if (a.unlock[0] === 'missing') return;
      got += allyTier(a); max += 3;
    });
    var sp = 0;
    C.sp_milestones.forEach(function (m) { if (milestoneDone(m)) sp += m.sp; });
    return { pp: pp, sp: sp, know: Math.round(100 * got / max) };
  }

  // What a player may read of an entry at its tier. REVEAL ALL overrides.
  function reveal(e) {
    var t = tierOf(e), d = state.designer;
    if (e.side === 'ally') {
      return { name: true, stats: d || t >= 1, service: d || t >= 2, matchups: d || t >= 3, look: available(e) || d ? 'model' : 'blueprint' };
    }
    if (isFinale(e)) {
      return { name: d || t >= 1, stats: d || t >= 2, abil: d ? 99 : (t >= 3 ? 99 : (t >= 2 ? 1 : 0)), abilNames: d || t >= 2,
        targets: d || t >= 3, weak: d || t >= 4, allMx: d || t >= 4, look: d || t >= 1 ? 'model' : 'silhouette' };
    }
    return { name: d || t >= 1, stats: d || t >= 2, abil: d || t >= 3 ? 99 : 0, abilNames: d || t >= 2,
      targets: d || t >= 3, weak: d || t >= 3, allMx: d || t >= 4, look: d || t >= 1 ? 'model' : 'silhouette' };
  }

  // ------------------------------------------------------------------ stats
  var STAT = {
    hp: ['HEALTH', ''], damage: ['DAMAGE', 'per hit'], speed: ['MOVE SPEED', 'u/s'],
    range: ['RANGE', 'u'], preferred_range: ['HOLDS OFF AT', 'u'], min_range: ['DEAD ZONE', 'u inside'],
    xp: ['XP', ''], dig_rate: ['DIG RATE', ''], dig_mult: ['DIG SPEED', 'x swarm'], first_wave: ['FIRST WAVE', 'difficulty'],
    max_per_wave: ['MAX PER WAVE', ''], every_n_waves: ['COMES EVERY', 'waves'], hatch_ramp_waves: ['HATCH RAMP', 'waves'],
    generators: ['GENERATORS', ''], generator_hp: ['GENERATOR HP', ''], radial_every: ['RADIAL BURST', 's apart'],
    blast_radius: ['BLAST RADIUS', 'u'], crater_radius: ['CRATER RADIUS', 'u'], breath_range: ['BREATH RANGE', 'u'],
    breath_every: ['BREATH', 's apart'], rock_damage: ['ROCK DAMAGE', ''], stomp_radius: ['STOMP RADIUS', 'u'],
    altitude: ['ALTITUDE', 'u'], trawl_altitude: ['TRAWL ALTITUDE', 'u'], missiles: ['MISSILES', 'per volley'],
    fan: ['BEAM FAN', ''], minions: ['MINIONS', 'per call'], minion_every: ['MINIONS', 's apart'], splash: ['SPLASH', 'u'],
    pod: ['POD SIZE', ''], count: ['COUNT', ''], laid_every: ['EGG LAID', 's apart'], yield: ['YIELD', 'per trip'],
    mine_every: ['MINES', 's apart'], crew_drop_every: ['CREW DROP', 's apart'], safe_altitude: ['SAFE ALTITUDE', 'u'],
    power_range: ['POWER RANGE', 'u'], power_out: ['POWER OUT', ''], power: ['POWER DRAW', ''], slow: ['SLOW', ''],
    burn_dps: ['BURN', 'dps'], puddle_dps: ['PUDDLE', 'dps'], poison_dps: ['POISON', 'dps'], duration: ['DURATION', 's'],
    heal: ['REPAIR RATE', ''], armour: ['ARMOUR', '']
  };
  var CELL = C.grid;
  // A stat's live value. `key` reads GameConfig (the .tres under the codex's
  // overrides), `mul` derives from keys, anything else is script-owned.
  function sval(s) {
    if (s.key) return cfg(s.key);
    if (s.mul) {
      var v = s.mul.reduce(function (a, k) { return a * cfg(k); }, s.factor != null ? s.factor : 1);
      var d = Math.pow(10, s.round != null ? s.round : 2);
      return Math.round(v * d) / d;
    }
    return s.v;
  }
  function sper(s) { return s.per_key ? cfg(s.per_key) : s.per_wave; }
  function waveOf(e) { return state.wave[e.key] != null ? state.wave[e.key] : (e.stats.first_wave ? sval(e.stats.first_wave) : 1); }
  function valueAt(s, W) { var p = sper(s); return p != null ? sval(s) + p * W : sval(s); }
  function editing() { return state.designer; }
  function inp(attr, v, step) {
    return '<input class="ed" type="number" step="' + (step || 'any') + '" ' + attr + ' value="' + v + '">';
  }
  function was(from, to) { return from !== to ? '<span class="was">was ' + num(from) + '</span>' : ''; }
  function srcLine(s) {
    if (s.key) return s.key + (s.per_key ? ' + ' + s.per_key : '') + (BAL.config[s.key] != null || (s.per_key && BAL.config[s.per_key] != null) ? '  CODEX OVERRIDE' : '');
    if (s.mul) return s.src + ', derived';
    return s.src ? s.src + ', read-only' : '';
  }

  function statCards(e, open) {
    var W = waveOf(e), out = [], st = e.stats;
    var keys = Object.keys(st);
    // Attack rate and derived DPS lead after the big three, because they are
    // what the brief asked for by name.
    var order = ['hp', 'damage', 'attack_interval', 'range', 'speed'];
    keys.sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    var ed = editing();
    keys.forEach(function (k) {
      var s = st[k], m = STAT[k] || [human(k), ''], lbl = m[0], unit = m[1], v, small = '';
      var base = sval(s), per = sper(s), val = valueAt(s, W);
      if (k === 'attack_interval') {
        lbl = 'ATTACK RATE';
        v = num(1 / base) + '<small>/s</small>';
        small = 'every ' + num(base) + ' s';
      } else if (k === 'armour') {
        v = Math.round(val * 100) + '<small>%</small>';
        small = val ? 'off every hit taken' : 'none';
      } else {
        v = num(val) + (unit ? '<small>' + esc(unit) + '</small>' : '');
        if (unit === 'u' && val >= CELL) small = num(val / CELL) + ' cells';
      }
      if (per != null) small = '+' + num(per) + ' a wave, shown at wave ' + W;
      var body = '';
      if (ed && open && s.key) {
        body = '<label class="edrow">' + (per != null ? 'BASE' : (k === 'attack_interval' ? 'EVERY S' : 'SET')) +
          inp('data-cfg="' + s.key + '"', base) + was(loadedCfg(s.key), base) + '</label>';
        if (s.per_key) body += '<label class="edrow">A WAVE' + inp('data-cfg="' + s.per_key + '"', per) + was(loadedCfg(s.per_key), per) + '</label>';
      }
      var changed = (s.key && loadedCfg(s.key) !== cfg(s.key)) || (s.per_key && loadedCfg(s.per_key) !== cfg(s.per_key));
      out.push(card(lbl, open ? v : '???', open ? small : '', srcLine(s), per != null, body, changed));
    });
    if (st.damage && st.attack_interval) {
      var dps = valueAt(st.damage, W) / sval(st.attack_interval);
      out.push(card('DPS', open ? num(dps) : '???', open ? 'damage x rate' + (sper(st.damage) != null ? ', at wave ' + W : '') : '', 'derived on this page', sper(st.damage) != null));
    }
    return out.join('');
  }
  function card(k, v, small, src, scales, body, changed) {
    var hidden = v === '???';
    return '<div class="stat' + (scales ? ' scales' : '') + (hidden ? ' hidden' : '') + (changed ? ' changed' : '') + '">' +
      '<span class="k">' + esc(k) + '</span><span class="v">' + v + '</span>' +
      (small ? '<span class="src" style="color:var(--dim)">' + esc(small) + '</span>' : '') + (body || '') +
      (src && !hidden ? '<span class="src" title="' + esc(src) + '">' + esc(src) + '</span>' : '') + '</div>';
  }
  function hasWave(e) { return Object.keys(e.stats).some(function (k) { return sper(e.stats[k]) != null; }); }
  function waveLabel(W) {
    var d = Math.floor((W - 1) / 10) + 1, w = W - (d - 1) * 10;
    return 'wave ' + W + ' <span style="color:var(--dim)">(depth ' + d + ', wave ' + w + ' on screen)</span>';
  }

  // ------------------------------------------------------------------ header
  function renderTotals() {
    var t = totals();
    $('#t-know').textContent = t.know + '%';
    $('#t-sp').textContent = t.sp + ' / ' + C.totals.sp;
    $('#t-pp').textContent = t.pp.toLocaleString('en-US') + ' / ' + C.totals.pp.toLocaleString('en-US');
  }

  // ------------------------------------------------------------------ list
  function pips(e) {
    var n = tiersFor(e).length, t = tierOf(e), s = '';
    for (var i = 1; i <= n; i++) s += '<i class="' + (i <= t ? 'on' : '') + '"></i>';
    return '<span class="pips' + (e.side === 'hostile' && isFinale(e) ? ' boss' : '') + '" aria-label="Tier ' + t + ' of ' + n + '">' + s + '</span>';
  }
  function row(e) {
    var rv = reveal(e), cls = 'row', chip = '', name = e.name;
    if (e.side === 'hostile') {
      if (!rv.name) { cls += ' unknown'; name = '???'; }
      if (isFinale(e)) chip = '<span class="chip boss">BOSS</span>';
      else if (e.boss === 'mini') chip = '<span class="chip boss">MINI</span>';
    } else {
      var lk = lockOf(e);
      if (isCrew(e)) chip = '<span class="chip">CREW</span>';
      else if (lk) { cls += ' locked'; chip = lk.soon ? '<span class="chip soon">NOT IN GAME</span>' : '<span class="chip lock">LOCKED</span>'; }
      else if (tierOf(e) === 0) chip = '<span class="chip ok">NEW</span>';
    }
    var cur = state.sel[state.side] === e.key;
    return '<button class="' + cls + '" data-key="' + e.key + '"' + (cur ? ' aria-current="true"' : '') + '>' +
      pips(e) + '<span class="nm">' + esc(name) + '</span>' + chip + '</button>';
  }
  function groupHead(label, list) {
    if (list.length && isCrew(list[0])) return '<div class="group-h">' + esc(label) + '<span>' + list.length + '</span></div>';
    var n = list.filter(function (e) { return tierOf(e) > 0; }).length;
    return '<div class="group-h">' + esc(label) + '<span>' + n + ' / ' + list.length + '</span></div>';
  }
  function renderList() {
    var h = '';
    if (state.side === 'hostile') {
      C.sectors.forEach(function (s) {
        var list = C.hostiles.filter(function (x) { return x.group === s.key; });
        h += groupHead(s.name, list) + list.map(row).join('');
      });
    } else {
      [['CREW', C.crew || []], ['MECHS', C.mechs], ['UNITS', C.units], ['BUILDINGS', C.buildings]].forEach(function (g) {
        if (!g[1].length) return;
        h += groupHead(g[0], g[1]) + g[1].map(row).join('');
      });
    }
    var done = C.sp_milestones.filter(milestoneDone).length;
    h += '<details class="milestones"' + (state.msOpen ? ' open' : '') + '><summary>SP MILESTONES ' + done + ' / ' + C.sp_milestones.length +
      ' <span class="prop-chip">PROPOSED</span></summary><ul>' +
      C.sp_milestones.map(function (m) {
        var ok = milestoneDone(m);
        return '<li class="' + (ok ? 'done' : '') + '"><span class="tick">' + (ok ? '✓' : '○') + '</span><span>' +
          esc(m.name) + '</span><b>+' + m.sp + ' SP</b></li>';
      }).join('') + '</ul>' +
      '<div class="econ">The codex pays <b>' + C.totals.sp + ' SP</b> and <b>' + C.totals.pp.toLocaleString('en-US') +
      ' PP</b> in all. For scale: a campaign clear pays <b>' + C.economy.campaign_sp + ' SP</b> and about <b>' +
      C.economy.clear_pp.toLocaleString('en-US') + ' PP</b>, the demo <b>' + C.economy.demo_sp +
      ' SP</b>, and the research tree costs <b>' + C.economy.tree_pp.toLocaleString('en-US') + ' PP</b>. Inside the demo the codex can pay <b>' +
      C.economy.demo_codex_sp + ' SP</b> (Dust Hive only), taking the demo from ' + C.economy.demo_sp + ' to <b>' +
      (C.economy.demo_sp + C.economy.demo_codex_sp) + ' SP</b>: enough for Acid Tech (5 SP) in the demo.</div></details>';
    $('#list').innerHTML = h;
  }

  // ------------------------------------------------------------------ dossier
  function tierTrack(e) {
    var t = tierOf(e), rows = tiersFor(e);
    return '<div class="tiers">' + rows.map(function (r) {
      var cls = r.n <= t ? 'got' : (r.n === t + 1 ? 'next' : '');
      var pay = (r.pp ? '<span class="pp">+' + r.pp + ' PP</span>' : '') + (r.sp ? '<span class="sp">+' + r.sp + ' SP</span>' : '');
      var extra = cls === 'got' ? '<span class="claimed">CLAIMED</span>' : '';
      var bar = cls === 'next' ? progressBar(e, r) : '';
      return '<div class="tier ' + cls + '"><span class="n">' + r.n + '</span>' +
        '<div><div class="t">' + esc(r.name) + '</div><div class="need">' + esc(needOf(e, r)) + '</div>' +
        '<div class="rev">Reveals: ' + esc(r.reveals) + '</div></div>' +
        '<div class="pay">' + pay + '<br>' + extra + '</div>' + bar + '</div>';
    }).join('') + '</div>';
  }
  // A tier's requirement in words, from the numbers the page tests against,
  // so the sentence and the bar can never quote different thresholds.
  function needOf(e, r) {
    if (r.need) return r.need;
    if (r.kills) {
      var n = track(e)[r.kills];
      return num(n) + ' kill' + (n === 1 ? '' : 's') + (r.kills === 'catalogued' ? ', any weapon' : '');
    }
    if (r.types) {
      return 'Hit it with ' + r.types + ' different weapon types: any tower type, the mech gun, or a mech weapon. ' +
        'Every salvaged mech weapon is a type of its own, so salvage is the quick way.';
    }
    return '';
  }
  function tierName(e, n) { return tiersFor(e)[n - 1].name; }
  function barHtml(have, need, label) {
    var f = clamp(have / need, 0, 1) * 100;
    return '<div class="bar"><i style="--f:' + f.toFixed(1) + '%"></i><span>' + label + '</span></div>';
  }
  function progressBar(e, r) {
    if (e.side === 'ally') {
      var p = ap(e);
      if (r.built != null) {
        if (!available(e)) return '<div class="bar"><span>' + esc(lockOf(e).b) + '</span></div>';
        return barHtml(p.b, r.built, num(p.b) + ' / ' + r.built + ' built');
      }
      return barHtml(p.j, r.jobs, num(p.j) + ' / ' + r.jobs + ' ' + jobNoun(e));
    }
    var h = hp(e);
    if (r.n === 1) {
      return '<div class="bar"><span>' + (isFinale(e) ? 'Waits at ' + esc(e.first) + ', ' : 'Somewhere in ') +
        esc(SECTOR[e.group].name) + '</span></div>';
    }
    if (r.kills) { var n = track(e)[r.kills]; return barHtml(h.k, n, num(h.k) + ' / ' + num(n) + ' kills'); }
    var need = matchNeed(e), have = learned(e);
    var names = have.map(function (k) { return ELEM[k].name.toUpperCase() + ' \u2713'; });
    var only = reachableTypes(e).length < r.types;
    return barHtml(have.length, need, have.length + ' / ' + need + ' weapon types' +
        (only ? ' (only ' + need + ' type' + (need > 1 ? 's' : '') + ' can reach it)' : '')) +
      '<div class="bar"><span>' + (names.length ? names.join(' \u00B7 ') : 'Nothing has hit it yet') + '</span></div>';
  }

  function matchupGrid(e, rv) {
    var tier = tierOf(e), got = learned(e);
    return '<div class="mx">' + C.weapons.map(function (w) {
      var r = reach(e, w.key);
      // A column is learned once any weapon type under it has landed a hit:
      // the mech column by the gun or any salvaged weapon.
      var hitBy = got.filter(function (k) { return ELEM[k].resist === w.key; });
      if (!r.can) {
        return '<div class="mcell no"><span class="w">' + esc(w.name) + '</span><span class="m">' +
          (tier >= 1 || state.designer ? 'CAN\'T HIT' : '???') + '</span><span class="q">' + (tier >= 1 || state.designer ? esc(r.q) : '') + '</span></div>';
      }
      var known = rv.allMx || hitBy.length > 0;
      if (!known) {
        return '<div class="mcell unk"><span class="w">' + esc(w.name) + '</span><span class="m">???</span><span class="q">Hit it once to learn</span></div>';
      }
      var m = mult(e, w.key), cls = m > 1 ? ' weak' : (m < 1 ? ' res' : '');
      var ch = resChanged(e.key, w.key);
      return '<div class="mcell' + cls + (hitBy.length ? ' learned' : '') + (ch ? ' changed' : '') + '"><span class="w">' + esc(w.name) + '</span><span class="m">x' +
        m.toFixed(2) + '</span>' +
        (editing() ? '<label class="edrow">' + inp('data-res="' + e.key + '|' + w.key + '" min="0"', m, '0.05') + was(loadedRes(e.key, w.key), m) + '</label>' : '') +
        '<span class="q">' + esc(r.q || (m === 1 ? 'Full damage' : (m > 1 ? 'Weak to it' : 'Shrugs it off'))) +
        (hitBy.length && w.key === 'mech' ? ' \u00B7 by ' + hitBy.map(function (k) { return ELEM[k].name; }).join(', ') : '') + '</span></div>';
    }).join('') + '</div>';
  }

  function weakChips(e) {
    var weak = [], res = [], out = [];
    C.weapons.forEach(function (w) {
      var r = reach(e, w.key);
      if (!r.can) { out.push(w.short); return; }
      var m = mult(e, w.key);
      if (m > 1) weak.push(w.name + ' x' + m.toFixed(2));
      if (m < 1) res.push(w.name + ' x' + m.toFixed(2));
    });
    var h = '';
    h += '<div class="chips"><span class="lbl">WEAK TO</span>' + (weak.length ? weak.map(function (s) { return '<span class="chip weak">' + esc(s) + '</span>'; }).join('') :
      '<span class="chip">' + (res.length ? 'NOTHING IN PARTICULAR' : 'NEUTRAL: EVERY WEAPON X1.00') + '</span>') + '</div>';
    if (res.length) h += '<div class="chips"><span class="lbl">RESISTS</span>' + res.map(function (s) { return '<span class="chip res">' + esc(s) + '</span>'; }).join('') + '</div>';
    if (out.length) h += '<div class="chips"><span class="lbl">OUT OF REACH OF</span>' + out.map(function (s) { return '<span class="chip reach">' + esc(s) + '</span>'; }).join('') + '</div>';
    var arm = armourOf(e);
    h += '<div class="stats"><div class="stat' + (resChanged(e.key, 'armour') ? ' changed' : '') + '"><span class="k">ARMOUR</span><span class="v">' +
      Math.round(arm * 100) + '<small>% off each hit</small></span>' +
      (editing() ? '<label class="edrow">FRACTION' + inp('data-res="' + e.key + '|armour" min="0" max="0.95"', arm, '0.05') + was(loadedRes(e.key, 'armour'), arm) + '</label>' : '') +
      '<span class="src">codex_balance.json resist.' + esc(e.key) + '.armour</span></div></div>';
    return h;
  }

  function abilities(e, rv) {
    return '<ul class="abil">' + e.abilities.map(function (a, i) {
      var full = i < rv.abil, named = rv.abilNames || full;
      if (full) return '<li><b>' + esc(a[0]) + '</b><span>' + esc(a[1]) + '</span></li>';
      return '<li class="hid"><b>' + (named ? esc(a[0]) : '???') + '</b><span class="redact">' +
        tierName(e, 3) + ' reveals this</span></li>';
    }).join('') + '</ul>';
  }

  function hostileDossier(e) {
    var rv = reveal(e), t = tierOf(e), s = SECTOR[e.group], ern = earned(e);
    var maxpp = tiersFor(e).reduce(function (a, r) { return a + r.pp; }, 0);
    var maxsp = tiersFor(e).reduce(function (a, r) { return a + r.sp; }, 0);
    var h = '<div class="d-head"><div class="d-eyebrow">' + esc(s.name.toUpperCase()) + ' · ' +
      (rv.name ? 'FIRST SEEN ' + esc(e.first.toUpperCase()) : 'NOT YET SIGHTED') + '</div>';
    h += '<h2 class="d-name' + (rv.name ? '' : ' unknown') + '">' + (rv.name ? esc(e.name) : '???') + '</h2>';
    h += '<div class="d-sub">' + pips(e) + '<span class="chip' + (isFinale(e) ? ' boss' : '') + '">' +
      (t ? esc(tiersFor(e)[t - 1].name) : 'UNKNOWN') + '</span>';
    if (isFinale(e)) h += '<span class="chip boss">SECTOR BOSS</span>';
    else if (e.boss === 'mini') h += '<span class="chip boss">MINI-BOSS</span>';
    if (rv.name && e.named_by) h += '<span class="wt">named after ' + esc(e.named_by) + '</span>';
    h += '</div>';
    if (rv.name) {
      h += '<p class="d-role">' + esc(e.role) + '</p><div class="chips">' +
        e.tags.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('') + '</div>';
    } else {
      h += '<p class="d-role redact">Something in ' + esc(s.name) + '. Encounter it to open the entry.</p>';
    }
    h += '</div>';

    h += '<div class="sec"><div class="sec-h"><span>KNOWLEDGE <span class="prop-chip">PROPOSED</span></span><span class="aside">' +
      '<span style="color:var(--pp)">' + ern.pp + ' / ' + maxpp + ' PP</span>' +
      (maxsp ? ' · <span style="color:var(--sp)">' + ern.sp + ' / ' + maxsp + ' SP</span>' : '') + '</span></div>' + tierTrack(e) + '</div>';

    h += '<div class="sec"><div class="sec-h"><span>FIELD NUMBERS</span><span class="aside">' +
      (rv.stats ? 'from GameConfig and the scripts' : tierName(e, 2) + ' reveals these') + '</span></div>';
    if (rv.stats && hasWave(e)) {
      var W = waveOf(e);
      h += '<div class="wave"><label for="wave">DIFFICULTY</label><input id="wave" type="range" min="1" max="40" value="' + W +
        '"><output id="wave-out">' + waveLabel(W) + '</output></div>';
    }
    h += '<div class="stats" id="stats">' + statCards(e, rv.stats) + '</div></div>';

    h += '<div class="sec"><div class="sec-h"><span>MATCHUPS</span><span class="aside">damage taken, by weapon</span></div>' +
      matchupGrid(e, rv) + '<div class="legend">Multipliers and armour are live game data: <code>codex_balance.json</code>, read by <code>CodexBalance</code> at every hit. ' +
      'Shipped neutral, for tuning. Which weapon can reach it at all is the game\'s hit rule.</div></div>';

    h += '<div class="sec"><div class="sec-h"><span>WEAKNESSES</span><span class="aside">' +
      (rv.weak ? '' : tierName(e, isFinale(e) ? 4 : 3) + ' reveals these') + '</span></div>' +
      (rv.weak ? weakChips(e) : '<p class="redact">Hit it with three different weapon types.</p>') + '</div>';

    h += '<div class="sec"><div class="sec-h"><span>BEHAVIOUR</span></div>' +
      (rv.targets ? '<p class="targets"><b style="color:var(--amber);font-weight:normal">GOES FOR </b>' + esc(e.targets) + '</p>' :
        '<p class="redact">What it goes after: <b>' + tierName(e, 3) + '</b> reveals this.</p>') +
      (rv.name ? abilities(e, rv) : '') + '</div>';

    h += '<div class="src-line">Source: ' + esc(e.src) + '</div>';
    return h;
  }

  function allyDossier(a) {
    var rv = reveal(a), t = tierOf(a), lk = lockOf(a), p = ap(a), ern = earned(a);
    var kind = a.kind === 'mech' ? 'MECH' : (a.kind === 'unit' ? 'UNIT' : 'BUILDING');
    var maxpp = T_ALLY.reduce(function (s, r) { return s + r.pp; }, 0);
    var h = '<div class="d-head"><div class="d-eyebrow">YOUR SIDE · ' + kind + '</div>' +
      '<h2 class="d-name">' + esc(a.name) + '</h2><div class="d-sub">' + pips(a) +
      '<span class="chip">' + (t ? esc(T_ALLY[t - 1].name) : (lk ? 'LOCKED' : 'NOT FIELDED')) + '</span>' +
      (a.weapon ? '<span class="chip">' + esc(a.kind === 'mech' ? a.weapon : WEAPON[a.weapon] ? WEAPON[a.weapon].name : a.weapon) + '</span>' : '') +
      '</div>' + (a.role ? '<p class="d-role">' + esc(a.role) + '</p>' : '') + '</div>';
    if (lk) {
      h += '<div class="lockbox' + (lk.soon ? ' soon' : '') + '"><b>' + esc(lk.t) + '</b><span>' + esc(lk.b) + '</span></div>';
    } else {
      h += '<div class="lockbox okbox"><b>AVAILABLE</b><span>' +
        (a.unlock[0] === 'start' ? 'Yours from the first run.' :
          a.unlock[0] === 'research' ? 'Researched: ' + esc(C.research_names[a.unlock[1]]) + '.' :
          a.unlock[0] === 'sector' ? 'Issued with ' + esc(SECTOR[a.unlock[1]].name) + '.' : 'Bought at the Supply Depot.') + '</span></div>';
    }
    h += '<div class="sec"><div class="sec-h"><span>SERVICE <span class="prop-chip">PROPOSED</span></span><span class="aside"><span style="color:var(--pp)">' +
      ern.pp + ' / ' + maxpp + ' PP</span></span></div>' + tierTrack(a) + '</div>';

    h += '<div class="sec"><div class="sec-h"><span>NUMBERS</span><span class="aside">' + (rv.stats ? 'from GameConfig' : 'FIELDED reveals these') + '</span></div>';
    h += Object.keys(a.stats).length ? '<div class="stats" id="stats">' + statCards(a, rv.stats) + '</div>' :
      '<p class="redact">No combat numbers: this one works rather than fights.</p>';
    h += '</div>';

    if (rv.service) {
      h += '<div class="sec"><div class="sec-h"><span>SERVICE RECORD</span></div><div class="stats">' +
        card(a.kind === 'building' ? 'BUILT' : 'DEPLOYED', num(p.b), '', '', false) + card(jobNoun(a).toUpperCase(), num(p.j), '', '', false) + '</div></div>';
    }

    if (a.weaponKey && WEAPON[a.weaponKey]) {
      h += '<div class="sec"><div class="sec-h"><span>AGAINST THE HOSTILES</span><span class="aside">' +
        (rv.matchups ? '' : 'VETERAN reveals these') + '</span></div>';
      if (rv.matchups) {
        h += '<div class="mx">' + C.hostiles.map(function (e) {
          var seen = tierOf(e) > 0 || state.designer, r = reach(e, a.weaponKey);
          if (!seen) return '<div class="mcell unk"><span class="w">???</span><span class="m">???</span><span class="q">Not sighted</span></div>';
          if (!r.can) return '<div class="mcell no"><span class="w">' + esc(e.name) + '</span><span class="m">CAN\'T HIT</span><span class="q">' + esc(r.q) + '</span></div>';
          var m = mult(e, a.weaponKey), cls = m > 1 ? ' weak' : (m < 1 ? ' res' : '');
          return '<div class="mcell' + cls + '"><span class="w">' + esc(e.name) + '</span><span class="m">x' + m.toFixed(2) + '</span><span class="q">' + esc(r.q || '') + '</span></div>';
        }).join('') + '</div><div class="legend">Each hostile\'s multiplier for this weapon, from <code>codex_balance.json</code>. Edit them on the hostile\'s own entry.</div>';
      } else {
        h += '<p class="redact">' + num(p.j) + ' / ' + T_ALLY[2].jobs + ' kills.</p>';
      }
      h += '</div>';
    }
    if (a.src) h += '<div class="src-line">Source: ' + esc(a.src) + '</div>';
    return h;
  }

  function crewDossier(a) {
    return '<div class="d-head"><div class="d-eyebrow">YOUR SIDE \u00B7 CREW</div>' +
      '<h2 class="d-name">' + esc(a.name) + '</h2><div class="d-sub"><span class="chip">CREW</span><span class="chip">IDLE</span></div>' +
      '<p class="d-role">' + esc(a.role) + '</p></div>' +
      '<div class="sec"><div class="sec-h"><span>WHERE YOU SEE THEM</span></div><p class="targets">' + esc(a.seen) + '</p></div>' +
      '<div class="sec"><div class="sec-h"><span>SCALE</span></div><p class="targets">' + esc(a.note) + '</p></div>' +
      '<div class="sec"><div class="sec-h"><span>NUMBERS</span></div><p class="redact">None. The crew do not fight, so there is nothing to tune and no knowledge track.</p></div>' +
      '<div class="src-line">Source: ' + esc(a.src) + '</div>';
  }

  function current() {
    var k = state.sel[state.side];
    return state.side === 'hostile' ? HOST[k] : ALLY[k];
  }
  function renderDossier() {
    var e = current();
    $('#dossier').innerHTML = e.side === 'hostile' ? hostileDossier(e) : (isCrew(e) ? crewDossier(e) : allyDossier(e));
    var wave = $('#wave');
    if (wave) {
      wave.addEventListener('input', function () {
        state.wave[e.key] = +wave.value;
        $('#wave-out').innerHTML = waveLabel(+wave.value);
        $('#stats').innerHTML = statCards(e, reveal(e).stats);
      });
    }
  }

  function renderTray() {
    var n = edits().length;
    $('#tray').hidden = !(editing() || n);
    $('#tray-n').textContent = n ? n + ' CHANGE' + (n > 1 ? 'S' : '') + ' NOT YET EXPORTED' : 'NO CHANGES YET';
    $('#tray-from').textContent = 'Balance loaded from ' + BAL_FROM + '.';
    $('#tray-undo').disabled = !undo.length;
    $('#tray-discard').disabled = !n;
  }

  function renderAll(reloadModel) {
    renderTray();
    renderTotals();
    renderList();
    renderDossier();
    if (reloadModel) V.show(current());
    else V.restyle(current());
  }

  // ------------------------------------------------------------------ viewer
  var V = (function () {
    var canvas = $('#view'), vp = canvas.parentNode;
    if (!window.THREE || !THREE.GLTFLoader) {
      $('#loading').hidden = false;
      $('#loading').textContent = 'THREE.JS FAILED TO LOAD';
      return { show: function () {}, restyle: function () {} };
    }
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080B);
    var camera = new THREE.PerspectiveCamera(36, 1, 0.2, 30000);
    scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x1a140e, 0.95));
    var sun = new THREE.DirectionalLight(0xffffff, 1.15); sun.position.set(260, 480, 320); scene.add(sun);
    var rim = new THREE.DirectionalLight(0x59F2FF, 0.55); rim.position.set(-320, 160, -360); scene.add(rim);

    var world = new THREE.Group(); scene.add(world);
    var grid = null, floor = null, rails = new THREE.Group(); world.add(rails);
    var tagLayer = [];
    var loader = new THREE.GLTFLoader();
    // Decode each model's embedded textures through an <img>, never through
    // ImageBitmapLoader. On Chrome the loader picks the latter, which fetch()es
    // the texture's blob: URL, and a sandboxed page (the published artifact)
    // refuses blob: under connect-src: every model arrived without a texture.
    // An <img> reads the same URL under img-src, which allows it.
    loader.register(function (parser) {
      parser.textureLoader = new THREE.TextureLoader(parser.options.manager);
      parser.textureLoader.setCrossOrigin(parser.options.crossOrigin);
      return { name: 'codex_textures_via_img' };
    });
    var bufs = {};
    var yard = null, yardBox = YARD_MODEL.size;
    var cur = null;           // { holder, obj, mixer, actions, entry, size, motion }
    var token = 0;
    var toggles = { mech: false, grid: true, rails: true, turn: false };
    var HOME = { yaw: -0.65, pitch: 0.32, dist: 300, tx: 0, ty: 20 };
    var yaw = HOME.yaw, pitch = HOME.pitch, dist = HOME.dist, target = new THREE.Vector3();
    var minDist = 20, maxDist = 6000;
    var clock = new THREE.Clock(), elapsed = 0;

    function fetchBuf(file) {
      if (!bufs[file]) {
        bufs[file] = fetch(file).then(function (r) {
          if (!r.ok) throw new Error(file + ': HTTP ' + r.status);
          if (!/\.b64\.txt$/.test(file)) return r.arrayBuffer();
          // The published-artifact build: the host serves no .glb, so the
          // model comes as base64 text (gen_bestiary.py --artifact).
          return r.text().then(function (t) {
            var bin = atob(t.trim()), out = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
            return out.buffer;
          });
        });
      }
      return bufs[file];
    }
    function load(file) {
      return fetchBuf(file).then(function (buf) {
        return new Promise(function (res, rej) { loader.parse(buf.slice(0), '', res, rej); });
      });
    }
    // Scale to the height the game measured, centre on the origin in XZ,
    // stand on y = 0. The GLTFDocument exports carry the -50000 offset the
    // exporter parked them at, and the source files carry their own import
    // scale; both come out the same size the game draws.
    //
    // `posed` entries were measured in Godot from their POSED vertices, so
    // they are fitted the same way here: a skinned mesh's own bounding box is
    // its unposed bind shape (the humans' is a T-pose in centimetres), which
    // would scale them to nonsense.
    function boxOf(obj, posed) {
      if (!posed) return new THREE.Box3().setFromObject(obj);
      var box = new THREE.Box3(), v = new THREE.Vector3();
      obj.traverse(function (n) {
        if (!n.isMesh || !n.geometry || !n.geometry.attributes.position) return;
        var count = n.geometry.attributes.position.count, step = Math.max(1, Math.floor(count / 4000));
        if (n.isSkinnedMesh) {
          n.skeleton.update();
          for (var i = 0; i < count; i += step) {
            v.fromBufferAttribute(n.geometry.attributes.position, i);
            n.boneTransform(i, v);
            box.expandByPoint(v.applyMatrix4(n.matrixWorld));
          }
        } else {
          if (!n.geometry.boundingBox) n.geometry.computeBoundingBox();
          box.union(n.geometry.boundingBox.clone().applyMatrix4(n.matrixWorld));
        }
      });
      return box;
    }
    function fit(obj, size, posed) {
      obj.updateMatrixWorld(true);
      var box = boxOf(obj, posed);
      var h = box.max.y - box.min.y;
      if (h > 1e-6) obj.scale.multiplyScalar(size[1] / h);
      obj.updateMatrixWorld(true);
      box = boxOf(obj, posed);
      var c = box.getCenter(new THREE.Vector3());
      obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= box.min.y;
      var holder = new THREE.Group(); holder.add(obj);
      return holder;
    }
    function dispose(o) {
      o.traverse(function (n) {
        if (n.geometry) n.geometry.dispose();
        var mats = n.userData.orig ? [].concat(n.userData.orig, n.material) : (n.material ? [].concat(n.material) : []);
        mats.forEach(function (m) {
          if (!m) return;
          Object.keys(m).forEach(function (k) { if (m[k] && m[k].isTexture) m[k].dispose(); });
          m.dispose();
        });
      });
    }
    var SIL = new THREE.MeshBasicMaterial({ color: 0x0B141B });
    var BLUE = new THREE.MeshBasicMaterial({ color: 0x59F2FF, wireframe: true, transparent: true, opacity: 0.28 });
    function look(obj, mode) {
      obj.traverse(function (n) {
        if (!n.isMesh) return;
        if (!n.userData.orig) n.userData.orig = n.material;
        n.material = mode === 'silhouette' ? SIL : (mode === 'blueprint' ? BLUE : n.userData.orig);
      });
    }

    function tag(text, cls, pos) {
      var d = document.createElement('div');
      d.className = 'tag3d ' + (cls || '');
      d.textContent = text;
      vp.appendChild(d);
      tagLayer.push({ el: d, pos: pos, group: cls });
      return d;
    }
    function clearTags() { tagLayer.forEach(function (t) { t.el.remove(); }); tagLayer = []; }
    function line(points, color, opacity) {
      var g = new THREE.BufferGeometry().setFromPoints(points);
      return new THREE.Line(g, new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity }));
    }

    // The yard: a 40 unit build grid sized to what stands on it, a rail at the
    // mech's height, and for a flyer a second rail at the height it flies.
    function buildYard(span, alt) {
      if (grid) { world.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
      if (floor) { world.remove(floor); floor.geometry.dispose(); floor.material.dispose(); }
      rails.children.slice().forEach(function (c) { rails.remove(c); c.geometry.dispose(); c.material.dispose(); });
      clearTags();
      var cells = Math.max(8, Math.ceil(span * 1.6 / CELL));
      if (cells % 2) cells++;
      var size = cells * CELL, half = size / 2;
      grid = new THREE.GridHelper(size, cells, 0x1C6B77, 0x15323D);
      grid.material.transparent = true; grid.material.opacity = 0.8;
      world.add(grid);
      floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ color: 0x090E13 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -0.3;
      world.add(floor);
      function lrail(y, color, text, cls) {
        rails.add(line([new THREE.Vector3(-half, y, half), new THREE.Vector3(-half, y, -half), new THREE.Vector3(half, y, -half)], color, 0.75));
        rails.add(line([new THREE.Vector3(half, 0, -half), new THREE.Vector3(half, y, -half)], color, 0.35));
        rails.add(line([new THREE.Vector3(-half, 0, half), new THREE.Vector3(-half, y, half)], color, 0.35));
        tag(text, cls, new THREE.Vector3(half, y, -half));
      }
      lrail(MECH_H, 0x59F2FF, 'MECH HEIGHT ' + num(MECH_H), 'rail');
      if (alt) lrail(alt, 0xFFB333, 'FLIES AT ' + num(alt), 'alt rail');
      applyToggles();
      return size;
    }

    function applyToggles() {
      if (grid) grid.visible = toggles.grid;
      if (floor) floor.visible = toggles.grid;
      rails.visible = toggles.rails;
      if (yard) yard.visible = toggles.mech && !(cur && cur.entry.key === C.yardstick);
      tagLayer.forEach(function (t) {
        var g = t.group || '';
        t.hide = (g.indexOf('rail') >= 0 && !toggles.rails) || (g.indexOf('yard') >= 0 && !(yard && yard.visible));
      });
      document.querySelectorAll('.toggles button[data-t]').forEach(function (b) {
        if (b.dataset.t in toggles) b.setAttribute('aria-pressed', String(toggles[b.dataset.t]));
      });
    }

    function frame(size, alt) {
      var top = (alt || 0) + size[1];
      var width = size[0] + (toggles.mech ? yardBox[0] + 24 : 0);
      // Without the mech the model alone sets the frame, so a 2 unit crew
      // member fills the view instead of standing lost in a mech-sized one.
      var span = Math.max(width, size[2], top, toggles.mech ? MECH_H * 1.4 : 0, 1);
      var fov = camera.fov * Math.PI / 180;
      HOME.dist = clamp(span * 0.62 / Math.tan(fov / 2) + span * 0.35, 3, 5000);
      HOME.ty = top * 0.45;
      HOME.tx = toggles.mech ? -(yardBox[0] + 24) / 2 : 0;
      minDist = Math.max(0.8, span * 0.25); maxDist = Math.max(600, span * 8);
      yaw = HOME.yaw; pitch = HOME.pitch; dist = HOME.dist;
      target.set(HOME.tx, HOME.ty, 0);
    }

    function placeYard(size) {
      if (!yard) return;
      yard.position.set(-(size[0] / 2 + yardBox[0] / 2 + 24), 0, 0);
      var yt = tagLayer.filter(function (t) { return t.group === 'yard'; })[0];
      if (yt) yt.pos.set(yard.position.x, -2, yardBox[2] / 2 + 6);
      else tag('COMBAT MECH', 'yard', new THREE.Vector3(yard.position.x, -2, yardBox[2] / 2 + 6));
    }

    // ----------------------------------------------------------- clips
    var clipBox = $('#clips'), skinBox = $('#skins');
    function clipButtons(e) {
      var c = cur, h = '';
      if (c && c.clips.length) {
        h = c.clips.map(function (cl, i) {
          return '<button data-clip="' + i + '" aria-pressed="' + (i === c.active) + '">' + esc(human(cl.name)) + '</button>';
        }).join('');
      } else {
        h = '<span class="note">No animation in the game\'s model</span>';
      }
      var m = e.motion;
      if (m && m.kind === 'hover') h += '<span class="note">Hover drawn by the page, at the altitude it flies</span>';
      if (m && m.kind === 'hop') h += '<span class="note">The hop, drawn by the page: ' + num(m.height) + ' up, ' + num(m.air) + ' s in the air, ' + num(m.rest) + ' s down</span>';
      clipBox.innerHTML = h;
    }
    clipBox.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-clip]');
      if (!b || !cur) return;
      play(+b.dataset.clip, true);
      clipBox.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });
    function play(i, user) {
      if (!cur || !cur.mixer) return;
      var next = cur.actions[i], prev = cur.actions[cur.active];
      if (prev && prev !== next) prev.fadeOut(0.25);
      next.reset().fadeIn(0.25).play();
      cur.active = i;
      if (user) cur.mixer.timeScale = 1;
    }
    function skinButtons(e) {
      if (e.skins.length < 2) { skinBox.innerHTML = ''; return; }
      var sel = state.skin[e.key] || e.skins[0];
      skinBox.innerHTML = e.skins.map(function (s) {
        return '<button data-skin="' + s + '" aria-pressed="' + (s === sel) + '">' + esc((C.skin_names && C.skin_names[s]) || human(s.replace(/^swarm_/, ''))) + '</button>';
      }).join('');
    }
    skinBox.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-skin]');
      if (!b) return;
      var e = current();
      state.skin[e.key] = b.dataset.skin;
      show(e);
    });

    function sizeLine(e, size, look) {
      var out = '<b>' + num(size[0]) + ' x ' + num(size[1]) + ' x ' + num(size[2]) + '</b> u (w x h x d) = <b>' +
        num(size[1] / MECH_H) + '</b> mech heights, ' + num(size[0] / CELL) + ' cells wide';
      if (look === 'silhouette') out = 'Size unknown until sighted';
      $('#size').innerHTML = out;
    }

    function veil(e, lookMode) {
      var v = $('#veil');
      v.classList.toggle('blueprint', lookMode === 'blueprint');
      if (lookMode === 'model') { v.hidden = true; return; }
      v.hidden = false;
      if (lookMode === 'silhouette') {
        v.querySelector('b').textContent = '???';
        $('#veil-why').textContent = 'Not yet sighted. Somewhere in ' + SECTOR[e.group].name + '.';
      } else {
        var lk = lockOf(e);
        v.querySelector('b').textContent = lk && lk.soon ? 'NOT IN THE GAME YET' : 'LOCKED';
        $('#veil-why').textContent = lk ? lk.b : '';
      }
    }

    function show(e) {
      var my = ++token;
      var skin = e.skins.length ? (state.skin[e.key] || e.skins[0]) : null;
      skinButtons(e);
      var lookMode = reveal(e).look;
      veil(e, lookMode);
      if (cur) { world.remove(cur.holder); dispose(cur.holder); cur = null; }
      if (!skin) {
        clipBox.innerHTML = '<span class="note">No model exported for this entry</span>';
        $('#size').textContent = '';
        return;
      }
      var info = e.models[skin];
      var alt = e.motion && e.motion.kind === 'hover' ? e.motion.alt : 0;
      buildYard(Math.max(info.size[0] + yardBox[0] + 24, info.size[2], alt + info.size[1]), alt);
      placeYard(info.size);
      applyToggles();
      frame(info.size, alt);
      sizeLine(e, info.size, lookMode);
      $('#loading').hidden = false;
      $('#loading').textContent = 'LOADING MODEL';
      load(info.file).then(function (gltf) {
        if (my !== token) { dispose(gltf.scene); return; }
        var clips = (gltf.animations || []).filter(function (a) { return a.name && a.name !== 'RESET'; });
        var c = { holder: null, obj: gltf.scene, entry: e, size: info.size, motion: e.motion, alt: alt, clips: clips, actions: [], active: -1, mixer: null };
        if (clips.length) {
          c.mixer = new THREE.AnimationMixer(gltf.scene);
          c.actions = clips.map(function (cl) { return c.mixer.clipAction(cl); });
          var pref = ['idle', 'walk', 'attack'], pick = 0;
          for (var i = 0; i < pref.length; i++) {
            var at = clips.map(function (x) { return x.name.toLowerCase(); }).indexOf(pref[i]);
            if (at >= 0) { pick = at; break; }
          }
          c.active = pick;
          c.actions[pick].play();
          // Stand it on the clip's first frame BEFORE measuring, so a T-posed
          // rig is fitted in the pose it is shown in.
          c.mixer.update(0);
          if (REDUCED) c.mixer.timeScale = 0;
        }
        var holder = fit(gltf.scene, info.size, info.posed);
        c.holder = holder;
        look(gltf.scene, lookMode);
        holder.position.y = alt;
        if (e.face) holder.rotation.y = e.face * Math.PI / 180;
        world.add(holder);
        cur = c;
        applyToggles();
        clipButtons(e);
        $('#loading').hidden = true;
      }).catch(function (err) {
        if (my !== token) return;
        $('#loading').hidden = false;
        $('#loading').textContent = 'MODEL FAILED: ' + err.message;
      });
      clipButtons(e);
    }

    function restyle(e) {
      if (!cur || cur.entry !== e) { show(e); return; }
      var lookMode = reveal(e).look;
      look(cur.obj, lookMode);
      veil(e, lookMode);
      sizeLine(e, cur.size, lookMode);
    }

    // The yardstick, loaded once and kept.
    load(YARD_MODEL.file).then(function (gltf) {
      yard = fit(gltf.scene, yardBox);
      world.add(yard);
      if (cur) placeYard(cur.size); else placeYard([0, 0, 0]);
      applyToggles();
    }).catch(function () {});

    // ----------------------------------------------------------- input
    var ptrs = {}, pinch0 = 0;
    function pts() { return Object.keys(ptrs).map(function (k) { return ptrs[k]; }); }
    function pdist() { var p = pts(); return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1; }
    canvas.addEventListener('pointerdown', function (ev) {
      canvas.setPointerCapture(ev.pointerId);
      ptrs[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      if (pts().length === 2) pinch0 = pdist();
    });
    canvas.addEventListener('pointermove', function (ev) {
      var p = ptrs[ev.pointerId];
      if (!p) return;
      var n = pts().length;
      if (n === 1) {
        yaw -= (ev.clientX - p.x) * 0.008;
        pitch = clamp(pitch + (ev.clientY - p.y) * 0.006, -0.05, 1.4);
      }
      p.x = ev.clientX; p.y = ev.clientY;
      if (n === 2) { var d = pdist(); dist = clamp(dist * pinch0 / d, minDist, maxDist); pinch0 = d; }
    });
    function up(ev) { delete ptrs[ev.pointerId]; }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      dist = clamp(dist * Math.exp(ev.deltaY * 0.0012), minDist, maxDist);
    }, { passive: false });
    canvas.addEventListener('keydown', function (ev) {
      var k = ev.key, used = true;
      if (k === 'ArrowLeft') yaw += 0.12;
      else if (k === 'ArrowRight') yaw -= 0.12;
      else if (k === 'ArrowUp') pitch = clamp(pitch + 0.08, -0.05, 1.4);
      else if (k === 'ArrowDown') pitch = clamp(pitch - 0.08, -0.05, 1.4);
      else if (k === '+' || k === '=') dist = clamp(dist * 0.87, minDist, maxDist);
      else if (k === '-' || k === '_') dist = clamp(dist / 0.87, minDist, maxDist);
      else if (k === 'r' || k === 'R') reset();
      else used = false;
      if (used) ev.preventDefault();
    });
    function reset() { yaw = HOME.yaw; pitch = HOME.pitch; dist = HOME.dist; target.set(HOME.tx, HOME.ty, 0); }
    // The yardstick is a checkbox, off by default: the grid and the height
    // rail already give scale, and the mech is there when a comparison is wanted.
    $('#t-mech').checked = toggles.mech;
    $('#t-mech').addEventListener('change', function () {
      toggles.mech = $('#t-mech').checked;
      applyToggles();
      if (cur) { placeYard(cur.size); frame(cur.size, cur.alt); }
    });
    document.querySelector('.toggles').addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-t]');
      if (!b) return;
      var t = b.dataset.t;
      if (t === 'reset') { reset(); return; }
      toggles[t] = !toggles[t];
      applyToggles();
    });

    // ----------------------------------------------------------- loop
    function resize() {
      var w = vp.clientWidth, h = vp.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(vp);
    window.addEventListener('resize', resize);
    resize();

    var v3 = new THREE.Vector3();
    function tick() {
      var dt = Math.min(clock.getDelta(), 0.1);
      elapsed += dt;
      if (cur) {
        if (cur.mixer) cur.mixer.update(dt);
        var m = cur.motion, y = cur.alt;
        if (m && m.kind === 'hover' && !REDUCED) y = cur.alt + Math.sin(elapsed * 1.3) * Math.min(4, cur.alt * 0.05);
        if (m && m.kind === 'hop' && !REDUCED) {
          var cyc = m.air + m.rest, ph = elapsed % cyc;
          if (ph < m.air) { var f = ph / m.air; y = 4 * m.height * f * (1 - f); }
        }
        cur.holder.position.y = y;
        if (toggles.turn && !REDUCED) cur.holder.rotation.y += dt * 0.45;
      }
      camera.position.set(
        target.x + dist * Math.cos(pitch) * Math.sin(yaw),
        target.y + dist * Math.sin(pitch),
        target.z + dist * Math.cos(pitch) * Math.cos(yaw));
      camera.lookAt(target);
      renderer.render(scene, camera);
      var w = vp.clientWidth, h = vp.clientHeight;
      tagLayer.forEach(function (t) {
        v3.copy(t.pos).project(camera);
        var off = t.hide || v3.z > 1 || v3.x < -1.2 || v3.x > 1.2 || v3.y < -1.2 || v3.y > 1.2;
        t.el.style.display = off ? 'none' : '';
        if (!off) {
          t.el.style.left = ((v3.x + 1) / 2 * w).toFixed(1) + 'px';
          t.el.style.top = ((1 - v3.y) / 2 * h).toFixed(1) + 'px';
        }
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    return { show: show, restyle: restyle };
  })();

  // ------------------------------------------------------------------ events
  document.querySelector('.tabs').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-side]');
    if (!b || b.dataset.side === state.side) return;
    state.side = b.dataset.side;
    document.querySelectorAll('.tabs button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
    renderAll(true);
  });
  $('#list').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-key]');
    if (!b) return;
    state.sel[state.side] = b.dataset.key;
    renderAll(true);
  });
  $('#list').addEventListener('toggle', function (ev) {
    if (ev.target.classList && ev.target.classList.contains('milestones')) state.msOpen = ev.target.open;
  }, true);
  $('#preset').addEventListener('change', function () {
    state.preset = $('#preset').value;
    P = PRESETS[state.preset];
    renderAll(false);
  });
  $('#designer').addEventListener('change', function () {
    state.designer = $('#designer').checked;
    renderAll(false);
  });

  // Edits. One delegated listener, so re-rendering the dossier never leaves
  // an input without one. Committed on change (blur or Enter), not per key.
  $('#dossier').addEventListener('change', function (ev) {
    var t = ev.target;
    if (!t.classList || !t.classList.contains('ed')) return;
    var v = parseFloat(t.value);
    if (!isFinite(v)) { renderAll(false); return; }
    if (t.dataset.cfg) setCfg(t.dataset.cfg, v);
    else if (t.dataset.res) { var p = t.dataset.res.split('|'); setRes(p[0], p[1], v); }
    renderAll(false);
  });
  $('#tray-undo').addEventListener('click', function () {
    if (!undo.length) return;
    BAL = undo.pop();
    saveDraft();
    renderAll(false);
  });
  $('#tray-discard').addEventListener('click', function () {
    undo.push(clone(BAL));
    BAL = clone(LOADED);
    BAL.config = BAL.config || {};
    clearDraft();
    renderAll(false);
  });
  function openExport() {
    var list = edits();
    $('#exp-list').innerHTML = list.length ? list.map(function (x) {
      return '<li><code>' + esc(x.what) + '</code> ' + num(x.from) + ' to <b>' + num(x.to) + '</b></li>';
    }).join('') : '<li>No changes: this is the file as loaded.</li>';
    $('#exp-text').value = exportText();
    $('#exp-status').textContent = '';
    $('#export').hidden = false;
    $('#export').scrollIntoView({ block: 'nearest' });
  }
  $('#tray-export').addEventListener('click', openExport);
  $('#exp-close').addEventListener('click', function () { $('#export').hidden = true; });
  $('#exp-copy').addEventListener('click', function () {
    var text = $('#exp-text').value;
    function fallback() {
      $('#exp-text').focus();
      $('#exp-text').select();
      $('#exp-status').textContent = 'Selected. Press Ctrl+C (Cmd+C) to copy.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { $('#exp-status').textContent = 'Copied.'; }, fallback);
    } else fallback();
  });
  $('#exp-download').addEventListener('click', function () {
    try {
      var url = URL.createObjectURL(new Blob([$('#exp-text').value], { type: 'application/json' }));
      var a = document.createElement('a');
      a.href = url; a.download = 'codex_balance.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      $('#exp-status').textContent = 'Saved as codex_balance.json. If nothing arrived, this copy of the page blocks downloads: use COPY.';
    } catch (e) {
      $('#exp-status').textContent = 'This copy of the page blocks downloads: use COPY.';
    }
  });

  // The site's own copy of the balance file wins over the one baked into
  // data.js, so a new export checked in beside this page shows up without a
  // rebuild. Then any unsent draft from this browser.
  renderAll(true);
  var boot = window.fetch ? fetch('codex_balance.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : Promise.resolve(null);
  boot.then(function (j) {
    if (j && j.resist) {
      LOADED = clone(j);
      BAL = clone(j);
      BAL.config = BAL.config || {};
      BAL_FROM = 'codex_balance.json, checked in beside this page';
    }
    restoreDraft();
    renderAll(false);
  });
})();
