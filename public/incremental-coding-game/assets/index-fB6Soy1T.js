var Bd = Object.defineProperty;
var bd = (e, t, n) =>
  t in e
    ? Bd(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
    : (e[t] = n);
var Vt = (e, t, n) => bd(e, typeof t != "symbol" ? t + "" : t, n);
(function () {
  const t = document.createElement("link").relList;
  if (t && t.supports && t.supports("modulepreload")) return;
  for (const o of document.querySelectorAll('link[rel="modulepreload"]')) r(o);
  new MutationObserver((o) => {
    for (const l of o)
      if (l.type === "childList")
        for (const i of l.addedNodes)
          i.tagName === "LINK" && i.rel === "modulepreload" && r(i);
  }).observe(document, { childList: !0, subtree: !0 });
  function n(o) {
    const l = {};
    return (
      o.integrity && (l.integrity = o.integrity),
      o.referrerPolicy && (l.referrerPolicy = o.referrerPolicy),
      o.crossOrigin === "use-credentials"
        ? (l.credentials = "include")
        : o.crossOrigin === "anonymous"
          ? (l.credentials = "omit")
          : (l.credentials = "same-origin"),
      l
    );
  }
  function r(o) {
    if (o.ep) return;
    o.ep = !0;
    const l = n(o);
    fetch(o.href, l);
  }
})();
function Wd(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default")
    ? e.default
    : e;
}
var aa = { exports: {} },
  Qo = {},
  ca = { exports: {} },
  b = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Ir = Symbol.for("react.element"),
  Hd = Symbol.for("react.portal"),
  Vd = Symbol.for("react.fragment"),
  Qd = Symbol.for("react.strict_mode"),
  Kd = Symbol.for("react.profiler"),
  Yd = Symbol.for("react.provider"),
  Xd = Symbol.for("react.context"),
  Gd = Symbol.for("react.forward_ref"),
  Zd = Symbol.for("react.suspense"),
  Jd = Symbol.for("react.memo"),
  qd = Symbol.for("react.lazy"),
  Us = Symbol.iterator;
function ef(e) {
  return e === null || typeof e != "object"
    ? null
    : ((e = (Us && e[Us]) || e["@@iterator"]),
      typeof e == "function" ? e : null);
}
var da = {
    isMounted: function () {
      return !1;
    },
    enqueueForceUpdate: function () {},
    enqueueReplaceState: function () {},
    enqueueSetState: function () {},
  },
  fa = Object.assign,
  pa = {};
function Bn(e, t, n) {
  ((this.props = e),
    (this.context = t),
    (this.refs = pa),
    (this.updater = n || da));
}
Bn.prototype.isReactComponent = {};
Bn.prototype.setState = function (e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null)
    throw Error(
      "setState(...): takes an object of state variables to update or a function which returns an object of state variables.",
    );
  this.updater.enqueueSetState(this, e, t, "setState");
};
Bn.prototype.forceUpdate = function (e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function ma() {}
ma.prototype = Bn.prototype;
function Fi(e, t, n) {
  ((this.props = e),
    (this.context = t),
    (this.refs = pa),
    (this.updater = n || da));
}
var Ui = (Fi.prototype = new ma());
Ui.constructor = Fi;
fa(Ui, Bn.prototype);
Ui.isPureReactComponent = !0;
var Bs = Array.isArray,
  ha = Object.prototype.hasOwnProperty,
  Bi = { current: null },
  ga = { key: !0, ref: !0, __self: !0, __source: !0 };
function va(e, t, n) {
  var r,
    o = {},
    l = null,
    i = null;
  if (t != null)
    for (r in (t.ref !== void 0 && (i = t.ref),
    t.key !== void 0 && (l = "" + t.key),
    t))
      ha.call(t, r) && !ga.hasOwnProperty(r) && (o[r] = t[r]);
  var s = arguments.length - 2;
  if (s === 1) o.children = n;
  else if (1 < s) {
    for (var u = Array(s), a = 0; a < s; a++) u[a] = arguments[a + 2];
    o.children = u;
  }
  if (e && e.defaultProps)
    for (r in ((s = e.defaultProps), s)) o[r] === void 0 && (o[r] = s[r]);
  return {
    $$typeof: Ir,
    type: e,
    key: l,
    ref: i,
    props: o,
    _owner: Bi.current,
  };
}
function tf(e, t) {
  return {
    $$typeof: Ir,
    type: e.type,
    key: t,
    ref: e.ref,
    props: e.props,
    _owner: e._owner,
  };
}
function bi(e) {
  return typeof e == "object" && e !== null && e.$$typeof === Ir;
}
function nf(e) {
  var t = { "=": "=0", ":": "=2" };
  return (
    "$" +
    e.replace(/[=:]/g, function (n) {
      return t[n];
    })
  );
}
var bs = /\/+/g;
function fl(e, t) {
  return typeof e == "object" && e !== null && e.key != null
    ? nf("" + e.key)
    : t.toString(36);
}
function uo(e, t, n, r, o) {
  var l = typeof e;
  (l === "undefined" || l === "boolean") && (e = null);
  var i = !1;
  if (e === null) i = !0;
  else
    switch (l) {
      case "string":
      case "number":
        i = !0;
        break;
      case "object":
        switch (e.$$typeof) {
          case Ir:
          case Hd:
            i = !0;
        }
    }
  if (i)
    return (
      (i = e),
      (o = o(i)),
      (e = r === "" ? "." + fl(i, 0) : r),
      Bs(o)
        ? ((n = ""),
          e != null && (n = e.replace(bs, "$&/") + "/"),
          uo(o, t, n, "", function (a) {
            return a;
          }))
        : o != null &&
          (bi(o) &&
            (o = tf(
              o,
              n +
                (!o.key || (i && i.key === o.key)
                  ? ""
                  : ("" + o.key).replace(bs, "$&/") + "/") +
                e,
            )),
          t.push(o)),
      1
    );
  if (((i = 0), (r = r === "" ? "." : r + ":"), Bs(e)))
    for (var s = 0; s < e.length; s++) {
      l = e[s];
      var u = r + fl(l, s);
      i += uo(l, t, n, u, o);
    }
  else if (((u = ef(e)), typeof u == "function"))
    for (e = u.call(e), s = 0; !(l = e.next()).done; )
      ((l = l.value), (u = r + fl(l, s++)), (i += uo(l, t, n, u, o)));
  else if (l === "object")
    throw (
      (t = String(e)),
      Error(
        "Objects are not valid as a React child (found: " +
          (t === "[object Object]"
            ? "object with keys {" + Object.keys(e).join(", ") + "}"
            : t) +
          "). If you meant to render a collection of children, use an array instead.",
      )
    );
  return i;
}
function Wr(e, t, n) {
  if (e == null) return e;
  var r = [],
    o = 0;
  return (
    uo(e, r, "", "", function (l) {
      return t.call(n, l, o++);
    }),
    r
  );
}
function rf(e) {
  if (e._status === -1) {
    var t = e._result;
    ((t = t()),
      t.then(
        function (n) {
          (e._status === 0 || e._status === -1) &&
            ((e._status = 1), (e._result = n));
        },
        function (n) {
          (e._status === 0 || e._status === -1) &&
            ((e._status = 2), (e._result = n));
        },
      ),
      e._status === -1 && ((e._status = 0), (e._result = t)));
  }
  if (e._status === 1) return e._result.default;
  throw e._result;
}
var Re = { current: null },
  ao = { transition: null },
  of = {
    ReactCurrentDispatcher: Re,
    ReactCurrentBatchConfig: ao,
    ReactCurrentOwner: Bi,
  };
function ya() {
  throw Error("act(...) is not supported in production builds of React.");
}
b.Children = {
  map: Wr,
  forEach: function (e, t, n) {
    Wr(
      e,
      function () {
        t.apply(this, arguments);
      },
      n,
    );
  },
  count: function (e) {
    var t = 0;
    return (
      Wr(e, function () {
        t++;
      }),
      t
    );
  },
  toArray: function (e) {
    return (
      Wr(e, function (t) {
        return t;
      }) || []
    );
  },
  only: function (e) {
    if (!bi(e))
      throw Error(
        "React.Children.only expected to receive a single React element child.",
      );
    return e;
  },
};
b.Component = Bn;
b.Fragment = Vd;
b.Profiler = Kd;
b.PureComponent = Fi;
b.StrictMode = Qd;
b.Suspense = Zd;
b.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = of;
b.act = ya;
b.cloneElement = function (e, t, n) {
  if (e == null)
    throw Error(
      "React.cloneElement(...): The argument must be a React element, but you passed " +
        e +
        ".",
    );
  var r = fa({}, e.props),
    o = e.key,
    l = e.ref,
    i = e._owner;
  if (t != null) {
    if (
      (t.ref !== void 0 && ((l = t.ref), (i = Bi.current)),
      t.key !== void 0 && (o = "" + t.key),
      e.type && e.type.defaultProps)
    )
      var s = e.type.defaultProps;
    for (u in t)
      ha.call(t, u) &&
        !ga.hasOwnProperty(u) &&
        (r[u] = t[u] === void 0 && s !== void 0 ? s[u] : t[u]);
  }
  var u = arguments.length - 2;
  if (u === 1) r.children = n;
  else if (1 < u) {
    s = Array(u);
    for (var a = 0; a < u; a++) s[a] = arguments[a + 2];
    r.children = s;
  }
  return { $$typeof: Ir, type: e.type, key: o, ref: l, props: r, _owner: i };
};
b.createContext = function (e) {
  return (
    (e = {
      $$typeof: Xd,
      _currentValue: e,
      _currentValue2: e,
      _threadCount: 0,
      Provider: null,
      Consumer: null,
      _defaultValue: null,
      _globalName: null,
    }),
    (e.Provider = { $$typeof: Yd, _context: e }),
    (e.Consumer = e)
  );
};
b.createElement = va;
b.createFactory = function (e) {
  var t = va.bind(null, e);
  return ((t.type = e), t);
};
b.createRef = function () {
  return { current: null };
};
b.forwardRef = function (e) {
  return { $$typeof: Gd, render: e };
};
b.isValidElement = bi;
b.lazy = function (e) {
  return { $$typeof: qd, _payload: { _status: -1, _result: e }, _init: rf };
};
b.memo = function (e, t) {
  return { $$typeof: Jd, type: e, compare: t === void 0 ? null : t };
};
b.startTransition = function (e) {
  var t = ao.transition;
  ao.transition = {};
  try {
    e();
  } finally {
    ao.transition = t;
  }
};
b.unstable_act = ya;
b.useCallback = function (e, t) {
  return Re.current.useCallback(e, t);
};
b.useContext = function (e) {
  return Re.current.useContext(e);
};
b.useDebugValue = function () {};
b.useDeferredValue = function (e) {
  return Re.current.useDeferredValue(e);
};
b.useEffect = function (e, t) {
  return Re.current.useEffect(e, t);
};
b.useId = function () {
  return Re.current.useId();
};
b.useImperativeHandle = function (e, t, n) {
  return Re.current.useImperativeHandle(e, t, n);
};
b.useInsertionEffect = function (e, t) {
  return Re.current.useInsertionEffect(e, t);
};
b.useLayoutEffect = function (e, t) {
  return Re.current.useLayoutEffect(e, t);
};
b.useMemo = function (e, t) {
  return Re.current.useMemo(e, t);
};
b.useReducer = function (e, t, n) {
  return Re.current.useReducer(e, t, n);
};
b.useRef = function (e) {
  return Re.current.useRef(e);
};
b.useState = function (e) {
  return Re.current.useState(e);
};
b.useSyncExternalStore = function (e, t, n) {
  return Re.current.useSyncExternalStore(e, t, n);
};
b.useTransition = function () {
  return Re.current.useTransition();
};
b.version = "18.3.1";
ca.exports = b;
var E = ca.exports;
const We = Wd(E);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var lf = E,
  sf = Symbol.for("react.element"),
  uf = Symbol.for("react.fragment"),
  af = Object.prototype.hasOwnProperty,
  cf = lf.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  df = { key: !0, ref: !0, __self: !0, __source: !0 };
function xa(e, t, n) {
  var r,
    o = {},
    l = null,
    i = null;
  (n !== void 0 && (l = "" + n),
    t.key !== void 0 && (l = "" + t.key),
    t.ref !== void 0 && (i = t.ref));
  for (r in t) af.call(t, r) && !df.hasOwnProperty(r) && (o[r] = t[r]);
  if (e && e.defaultProps)
    for (r in ((t = e.defaultProps), t)) o[r] === void 0 && (o[r] = t[r]);
  return {
    $$typeof: sf,
    type: e,
    key: l,
    ref: i,
    props: o,
    _owner: cf.current,
  };
}
Qo.Fragment = uf;
Qo.jsx = xa;
Qo.jsxs = xa;
aa.exports = Qo;
var f = aa.exports,
  Hl = {},
  wa = { exports: {} },
  $e = {},
  Sa = { exports: {} },
  ka = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ (function (e) {
  function t(P, D) {
    var U = P.length;
    P.push(D);
    e: for (; 0 < U; ) {
      var A = (U - 1) >>> 1,
        I = P[A];
      if (0 < o(I, D)) ((P[A] = D), (P[U] = I), (U = A));
      else break e;
    }
  }
  function n(P) {
    return P.length === 0 ? null : P[0];
  }
  function r(P) {
    if (P.length === 0) return null;
    var D = P[0],
      U = P.pop();
    if (U !== D) {
      P[0] = U;
      e: for (var A = 0, I = P.length, Q = I >>> 1; A < Q; ) {
        var K = 2 * (A + 1) - 1,
          de = P[K],
          Ye = K + 1,
          Ue = P[Ye];
        if (0 > o(de, U))
          Ye < I && 0 > o(Ue, de)
            ? ((P[A] = Ue), (P[Ye] = U), (A = Ye))
            : ((P[A] = de), (P[K] = U), (A = K));
        else if (Ye < I && 0 > o(Ue, U)) ((P[A] = Ue), (P[Ye] = U), (A = Ye));
        else break e;
      }
    }
    return D;
  }
  function o(P, D) {
    var U = P.sortIndex - D.sortIndex;
    return U !== 0 ? U : P.id - D.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var l = performance;
    e.unstable_now = function () {
      return l.now();
    };
  } else {
    var i = Date,
      s = i.now();
    e.unstable_now = function () {
      return i.now() - s;
    };
  }
  var u = [],
    a = [],
    m = 1,
    c = null,
    v = 3,
    w = !1,
    C = !1,
    y = !1,
    N = typeof setTimeout == "function" ? setTimeout : null,
    p = typeof clearTimeout == "function" ? clearTimeout : null,
    d = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" &&
    navigator.scheduling !== void 0 &&
    navigator.scheduling.isInputPending !== void 0 &&
    navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function h(P) {
    for (var D = n(a); D !== null; ) {
      if (D.callback === null) r(a);
      else if (D.startTime <= P)
        (r(a), (D.sortIndex = D.expirationTime), t(u, D));
      else break;
      D = n(a);
    }
  }
  function g(P) {
    if (((y = !1), h(P), !C))
      if (n(u) !== null) ((C = !0), B(S));
      else {
        var D = n(a);
        D !== null && ue(g, D.startTime - P);
      }
  }
  function S(P, D) {
    ((C = !1), y && ((y = !1), p(j), (j = -1)), (w = !0));
    var U = v;
    try {
      for (
        h(D), c = n(u);
        c !== null && (!(c.expirationTime > D) || (P && !F()));
      ) {
        var A = c.callback;
        if (typeof A == "function") {
          ((c.callback = null), (v = c.priorityLevel));
          var I = A(c.expirationTime <= D);
          ((D = e.unstable_now()),
            typeof I == "function" ? (c.callback = I) : c === n(u) && r(u),
            h(D));
        } else r(u);
        c = n(u);
      }
      if (c !== null) var Q = !0;
      else {
        var K = n(a);
        (K !== null && ue(g, K.startTime - D), (Q = !1));
      }
      return Q;
    } finally {
      ((c = null), (v = U), (w = !1));
    }
  }
  var x = !1,
    k = null,
    j = -1,
    O = 5,
    R = -1;
  function F() {
    return !(e.unstable_now() - R < O);
  }
  function te() {
    if (k !== null) {
      var P = e.unstable_now();
      R = P;
      var D = !0;
      try {
        D = k(!0, P);
      } finally {
        D ? G() : ((x = !1), (k = null));
      }
    } else x = !1;
  }
  var G;
  if (typeof d == "function")
    G = function () {
      d(te);
    };
  else if (typeof MessageChannel < "u") {
    var Ce = new MessageChannel(),
      $ = Ce.port2;
    ((Ce.port1.onmessage = te),
      (G = function () {
        $.postMessage(null);
      }));
  } else
    G = function () {
      N(te, 0);
    };
  function B(P) {
    ((k = P), x || ((x = !0), G()));
  }
  function ue(P, D) {
    j = N(function () {
      P(e.unstable_now());
    }, D);
  }
  ((e.unstable_IdlePriority = 5),
    (e.unstable_ImmediatePriority = 1),
    (e.unstable_LowPriority = 4),
    (e.unstable_NormalPriority = 3),
    (e.unstable_Profiling = null),
    (e.unstable_UserBlockingPriority = 2),
    (e.unstable_cancelCallback = function (P) {
      P.callback = null;
    }),
    (e.unstable_continueExecution = function () {
      C || w || ((C = !0), B(S));
    }),
    (e.unstable_forceFrameRate = function (P) {
      0 > P || 125 < P
        ? console.error(
            "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported",
          )
        : (O = 0 < P ? Math.floor(1e3 / P) : 5);
    }),
    (e.unstable_getCurrentPriorityLevel = function () {
      return v;
    }),
    (e.unstable_getFirstCallbackNode = function () {
      return n(u);
    }),
    (e.unstable_next = function (P) {
      switch (v) {
        case 1:
        case 2:
        case 3:
          var D = 3;
          break;
        default:
          D = v;
      }
      var U = v;
      v = D;
      try {
        return P();
      } finally {
        v = U;
      }
    }),
    (e.unstable_pauseExecution = function () {}),
    (e.unstable_requestPaint = function () {}),
    (e.unstable_runWithPriority = function (P, D) {
      switch (P) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          P = 3;
      }
      var U = v;
      v = P;
      try {
        return D();
      } finally {
        v = U;
      }
    }),
    (e.unstable_scheduleCallback = function (P, D, U) {
      var A = e.unstable_now();
      switch (
        (typeof U == "object" && U !== null
          ? ((U = U.delay), (U = typeof U == "number" && 0 < U ? A + U : A))
          : (U = A),
        P)
      ) {
        case 1:
          var I = -1;
          break;
        case 2:
          I = 250;
          break;
        case 5:
          I = 1073741823;
          break;
        case 4:
          I = 1e4;
          break;
        default:
          I = 5e3;
      }
      return (
        (I = U + I),
        (P = {
          id: m++,
          callback: D,
          priorityLevel: P,
          startTime: U,
          expirationTime: I,
          sortIndex: -1,
        }),
        U > A
          ? ((P.sortIndex = U),
            t(a, P),
            n(u) === null &&
              P === n(a) &&
              (y ? (p(j), (j = -1)) : (y = !0), ue(g, U - A)))
          : ((P.sortIndex = I), t(u, P), C || w || ((C = !0), B(S))),
        P
      );
    }),
    (e.unstable_shouldYield = F),
    (e.unstable_wrapCallback = function (P) {
      var D = v;
      return function () {
        var U = v;
        v = D;
        try {
          return P.apply(this, arguments);
        } finally {
          v = U;
        }
      };
    }));
})(ka);
Sa.exports = ka;
var ff = Sa.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var pf = E,
  De = ff;
function _(e) {
  for (
    var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1;
    n < arguments.length;
    n++
  )
    t += "&args[]=" + encodeURIComponent(arguments[n]);
  return (
    "Minified React error #" +
    e +
    "; visit " +
    t +
    " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
  );
}
var Ca = new Set(),
  vr = {};
function un(e, t) {
  (Mn(e, t), Mn(e + "Capture", t));
}
function Mn(e, t) {
  for (vr[e] = t, e = 0; e < t.length; e++) Ca.add(t[e]);
}
var vt = !(
    typeof window > "u" ||
    typeof window.document > "u" ||
    typeof window.document.createElement > "u"
  ),
  Vl = Object.prototype.hasOwnProperty,
  mf =
    /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
  Ws = {},
  Hs = {};
function hf(e) {
  return Vl.call(Hs, e)
    ? !0
    : Vl.call(Ws, e)
      ? !1
      : mf.test(e)
        ? (Hs[e] = !0)
        : ((Ws[e] = !0), !1);
}
function gf(e, t, n, r) {
  if (n !== null && n.type === 0) return !1;
  switch (typeof t) {
    case "function":
    case "symbol":
      return !0;
    case "boolean":
      return r
        ? !1
        : n !== null
          ? !n.acceptsBooleans
          : ((e = e.toLowerCase().slice(0, 5)), e !== "data-" && e !== "aria-");
    default:
      return !1;
  }
}
function vf(e, t, n, r) {
  if (t === null || typeof t > "u" || gf(e, t, n, r)) return !0;
  if (r) return !1;
  if (n !== null)
    switch (n.type) {
      case 3:
        return !t;
      case 4:
        return t === !1;
      case 5:
        return isNaN(t);
      case 6:
        return isNaN(t) || 1 > t;
    }
  return !1;
}
function Te(e, t, n, r, o, l, i) {
  ((this.acceptsBooleans = t === 2 || t === 3 || t === 4),
    (this.attributeName = r),
    (this.attributeNamespace = o),
    (this.mustUseProperty = n),
    (this.propertyName = e),
    (this.type = t),
    (this.sanitizeURL = l),
    (this.removeEmptyString = i));
}
var ye = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style"
  .split(" ")
  .forEach(function (e) {
    ye[e] = new Te(e, 0, !1, e, null, !1, !1);
  });
[
  ["acceptCharset", "accept-charset"],
  ["className", "class"],
  ["htmlFor", "for"],
  ["httpEquiv", "http-equiv"],
].forEach(function (e) {
  var t = e[0];
  ye[t] = new Te(t, 1, !1, e[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function (e) {
  ye[e] = new Te(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
[
  "autoReverse",
  "externalResourcesRequired",
  "focusable",
  "preserveAlpha",
].forEach(function (e) {
  ye[e] = new Te(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope"
  .split(" ")
  .forEach(function (e) {
    ye[e] = new Te(e, 3, !1, e.toLowerCase(), null, !1, !1);
  });
["checked", "multiple", "muted", "selected"].forEach(function (e) {
  ye[e] = new Te(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function (e) {
  ye[e] = new Te(e, 4, !1, e, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function (e) {
  ye[e] = new Te(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function (e) {
  ye[e] = new Te(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var Wi = /[\-:]([a-z])/g;
function Hi(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height"
  .split(" ")
  .forEach(function (e) {
    var t = e.replace(Wi, Hi);
    ye[t] = new Te(t, 1, !1, e, null, !1, !1);
  });
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type"
  .split(" ")
  .forEach(function (e) {
    var t = e.replace(Wi, Hi);
    ye[t] = new Te(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
  });
["xml:base", "xml:lang", "xml:space"].forEach(function (e) {
  var t = e.replace(Wi, Hi);
  ye[t] = new Te(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function (e) {
  ye[e] = new Te(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
ye.xlinkHref = new Te(
  "xlinkHref",
  1,
  !1,
  "xlink:href",
  "http://www.w3.org/1999/xlink",
  !0,
  !1,
);
["src", "href", "action", "formAction"].forEach(function (e) {
  ye[e] = new Te(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function Vi(e, t, n, r) {
  var o = ye.hasOwnProperty(t) ? ye[t] : null;
  (o !== null
    ? o.type !== 0
    : r ||
      !(2 < t.length) ||
      (t[0] !== "o" && t[0] !== "O") ||
      (t[1] !== "n" && t[1] !== "N")) &&
    (vf(t, n, o, r) && (n = null),
    r || o === null
      ? hf(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n))
      : o.mustUseProperty
        ? (e[o.propertyName] = n === null ? (o.type === 3 ? !1 : "") : n)
        : ((t = o.attributeName),
          (r = o.attributeNamespace),
          n === null
            ? e.removeAttribute(t)
            : ((o = o.type),
              (n = o === 3 || (o === 4 && n === !0) ? "" : "" + n),
              r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var St = pf.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  Hr = Symbol.for("react.element"),
  mn = Symbol.for("react.portal"),
  hn = Symbol.for("react.fragment"),
  Qi = Symbol.for("react.strict_mode"),
  Ql = Symbol.for("react.profiler"),
  Ea = Symbol.for("react.provider"),
  ja = Symbol.for("react.context"),
  Ki = Symbol.for("react.forward_ref"),
  Kl = Symbol.for("react.suspense"),
  Yl = Symbol.for("react.suspense_list"),
  Yi = Symbol.for("react.memo"),
  Et = Symbol.for("react.lazy"),
  Ra = Symbol.for("react.offscreen"),
  Vs = Symbol.iterator;
function Kn(e) {
  return e === null || typeof e != "object"
    ? null
    : ((e = (Vs && e[Vs]) || e["@@iterator"]),
      typeof e == "function" ? e : null);
}
var le = Object.assign,
  pl;
function nr(e) {
  if (pl === void 0)
    try {
      throw Error();
    } catch (n) {
      var t = n.stack.trim().match(/\n( *(at )?)/);
      pl = (t && t[1]) || "";
    }
  return (
    `
` +
    pl +
    e
  );
}
var ml = !1;
function hl(e, t) {
  if (!e || ml) return "";
  ml = !0;
  var n = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (t)
      if (
        ((t = function () {
          throw Error();
        }),
        Object.defineProperty(t.prototype, "props", {
          set: function () {
            throw Error();
          },
        }),
        typeof Reflect == "object" && Reflect.construct)
      ) {
        try {
          Reflect.construct(t, []);
        } catch (a) {
          var r = a;
        }
        Reflect.construct(e, [], t);
      } else {
        try {
          t.call();
        } catch (a) {
          r = a;
        }
        e.call(t.prototype);
      }
    else {
      try {
        throw Error();
      } catch (a) {
        r = a;
      }
      e();
    }
  } catch (a) {
    if (a && r && typeof a.stack == "string") {
      for (
        var o = a.stack.split(`
`),
          l = r.stack.split(`
`),
          i = o.length - 1,
          s = l.length - 1;
        1 <= i && 0 <= s && o[i] !== l[s];
      )
        s--;
      for (; 1 <= i && 0 <= s; i--, s--)
        if (o[i] !== l[s]) {
          if (i !== 1 || s !== 1)
            do
              if ((i--, s--, 0 > s || o[i] !== l[s])) {
                var u =
                  `
` + o[i].replace(" at new ", " at ");
                return (
                  e.displayName &&
                    u.includes("<anonymous>") &&
                    (u = u.replace("<anonymous>", e.displayName)),
                  u
                );
              }
            while (1 <= i && 0 <= s);
          break;
        }
    }
  } finally {
    ((ml = !1), (Error.prepareStackTrace = n));
  }
  return (e = e ? e.displayName || e.name : "") ? nr(e) : "";
}
function yf(e) {
  switch (e.tag) {
    case 5:
      return nr(e.type);
    case 16:
      return nr("Lazy");
    case 13:
      return nr("Suspense");
    case 19:
      return nr("SuspenseList");
    case 0:
    case 2:
    case 15:
      return ((e = hl(e.type, !1)), e);
    case 11:
      return ((e = hl(e.type.render, !1)), e);
    case 1:
      return ((e = hl(e.type, !0)), e);
    default:
      return "";
  }
}
function Xl(e) {
  if (e == null) return null;
  if (typeof e == "function") return e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case hn:
      return "Fragment";
    case mn:
      return "Portal";
    case Ql:
      return "Profiler";
    case Qi:
      return "StrictMode";
    case Kl:
      return "Suspense";
    case Yl:
      return "SuspenseList";
  }
  if (typeof e == "object")
    switch (e.$$typeof) {
      case ja:
        return (e.displayName || "Context") + ".Consumer";
      case Ea:
        return (e._context.displayName || "Context") + ".Provider";
      case Ki:
        var t = e.render;
        return (
          (e = e.displayName),
          e ||
            ((e = t.displayName || t.name || ""),
            (e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef")),
          e
        );
      case Yi:
        return (
          (t = e.displayName || null),
          t !== null ? t : Xl(e.type) || "Memo"
        );
      case Et:
        ((t = e._payload), (e = e._init));
        try {
          return Xl(e(t));
        } catch {}
    }
  return null;
}
function xf(e) {
  var t = e.type;
  switch (e.tag) {
    case 24:
      return "Cache";
    case 9:
      return (t.displayName || "Context") + ".Consumer";
    case 10:
      return (t._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return (
        (e = t.render),
        (e = e.displayName || e.name || ""),
        t.displayName || (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef")
      );
    case 7:
      return "Fragment";
    case 5:
      return t;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return Xl(t);
    case 8:
      return t === Qi ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if (typeof t == "function") return t.displayName || t.name || null;
      if (typeof t == "string") return t;
  }
  return null;
}
function Ut(e) {
  switch (typeof e) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return e;
    case "object":
      return e;
    default:
      return "";
  }
}
function Ta(e) {
  var t = e.type;
  return (
    (e = e.nodeName) &&
    e.toLowerCase() === "input" &&
    (t === "checkbox" || t === "radio")
  );
}
function wf(e) {
  var t = Ta(e) ? "checked" : "value",
    n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
    r = "" + e[t];
  if (
    !e.hasOwnProperty(t) &&
    typeof n < "u" &&
    typeof n.get == "function" &&
    typeof n.set == "function"
  ) {
    var o = n.get,
      l = n.set;
    return (
      Object.defineProperty(e, t, {
        configurable: !0,
        get: function () {
          return o.call(this);
        },
        set: function (i) {
          ((r = "" + i), l.call(this, i));
        },
      }),
      Object.defineProperty(e, t, { enumerable: n.enumerable }),
      {
        getValue: function () {
          return r;
        },
        setValue: function (i) {
          r = "" + i;
        },
        stopTracking: function () {
          ((e._valueTracker = null), delete e[t]);
        },
      }
    );
  }
}
function Vr(e) {
  e._valueTracker || (e._valueTracker = wf(e));
}
function Na(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var n = t.getValue(),
    r = "";
  return (
    e && (r = Ta(e) ? (e.checked ? "true" : "false") : e.value),
    (e = r),
    e !== n ? (t.setValue(e), !0) : !1
  );
}
function So(e) {
  if (((e = e || (typeof document < "u" ? document : void 0)), typeof e > "u"))
    return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function Gl(e, t) {
  var n = t.checked;
  return le({}, t, {
    defaultChecked: void 0,
    defaultValue: void 0,
    value: void 0,
    checked: n ?? e._wrapperState.initialChecked,
  });
}
function Qs(e, t) {
  var n = t.defaultValue == null ? "" : t.defaultValue,
    r = t.checked != null ? t.checked : t.defaultChecked;
  ((n = Ut(t.value != null ? t.value : n)),
    (e._wrapperState = {
      initialChecked: r,
      initialValue: n,
      controlled:
        t.type === "checkbox" || t.type === "radio"
          ? t.checked != null
          : t.value != null,
    }));
}
function _a(e, t) {
  ((t = t.checked), t != null && Vi(e, "checked", t, !1));
}
function Zl(e, t) {
  _a(e, t);
  var n = Ut(t.value),
    r = t.type;
  if (n != null)
    r === "number"
      ? ((n === 0 && e.value === "") || e.value != n) && (e.value = "" + n)
      : e.value !== "" + n && (e.value = "" + n);
  else if (r === "submit" || r === "reset") {
    e.removeAttribute("value");
    return;
  }
  (t.hasOwnProperty("value")
    ? Jl(e, t.type, n)
    : t.hasOwnProperty("defaultValue") && Jl(e, t.type, Ut(t.defaultValue)),
    t.checked == null &&
      t.defaultChecked != null &&
      (e.defaultChecked = !!t.defaultChecked));
}
function Ks(e, t, n) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var r = t.type;
    if (
      !(
        (r !== "submit" && r !== "reset") ||
        (t.value !== void 0 && t.value !== null)
      )
    )
      return;
    ((t = "" + e._wrapperState.initialValue),
      n || t === e.value || (e.value = t),
      (e.defaultValue = t));
  }
  ((n = e.name),
    n !== "" && (e.name = ""),
    (e.defaultChecked = !!e._wrapperState.initialChecked),
    n !== "" && (e.name = n));
}
function Jl(e, t, n) {
  (t !== "number" || So(e.ownerDocument) !== e) &&
    (n == null
      ? (e.defaultValue = "" + e._wrapperState.initialValue)
      : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var rr = Array.isArray;
function Tn(e, t, n, r) {
  if (((e = e.options), t)) {
    t = {};
    for (var o = 0; o < n.length; o++) t["$" + n[o]] = !0;
    for (n = 0; n < e.length; n++)
      ((o = t.hasOwnProperty("$" + e[n].value)),
        e[n].selected !== o && (e[n].selected = o),
        o && r && (e[n].defaultSelected = !0));
  } else {
    for (n = "" + Ut(n), t = null, o = 0; o < e.length; o++) {
      if (e[o].value === n) {
        ((e[o].selected = !0), r && (e[o].defaultSelected = !0));
        return;
      }
      t !== null || e[o].disabled || (t = e[o]);
    }
    t !== null && (t.selected = !0);
  }
}
function ql(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(_(91));
  return le({}, t, {
    value: void 0,
    defaultValue: void 0,
    children: "" + e._wrapperState.initialValue,
  });
}
function Ys(e, t) {
  var n = t.value;
  if (n == null) {
    if (((n = t.children), (t = t.defaultValue), n != null)) {
      if (t != null) throw Error(_(92));
      if (rr(n)) {
        if (1 < n.length) throw Error(_(93));
        n = n[0];
      }
      t = n;
    }
    (t == null && (t = ""), (n = t));
  }
  e._wrapperState = { initialValue: Ut(n) };
}
function Pa(e, t) {
  var n = Ut(t.value),
    r = Ut(t.defaultValue);
  (n != null &&
    ((n = "" + n),
    n !== e.value && (e.value = n),
    t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
    r != null && (e.defaultValue = "" + r));
}
function Xs(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function za(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function ei(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml"
    ? za(t)
    : e === "http://www.w3.org/2000/svg" && t === "foreignObject"
      ? "http://www.w3.org/1999/xhtml"
      : e;
}
var Qr,
  La = (function (e) {
    return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction
      ? function (t, n, r, o) {
          MSApp.execUnsafeLocalFunction(function () {
            return e(t, n, r, o);
          });
        }
      : e;
  })(function (e, t) {
    if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e)
      e.innerHTML = t;
    else {
      for (
        Qr = Qr || document.createElement("div"),
          Qr.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>",
          t = Qr.firstChild;
        e.firstChild;
      )
        e.removeChild(e.firstChild);
      for (; t.firstChild; ) e.appendChild(t.firstChild);
    }
  });
function yr(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var sr = {
    animationIterationCount: !0,
    aspectRatio: !0,
    borderImageOutset: !0,
    borderImageSlice: !0,
    borderImageWidth: !0,
    boxFlex: !0,
    boxFlexGroup: !0,
    boxOrdinalGroup: !0,
    columnCount: !0,
    columns: !0,
    flex: !0,
    flexGrow: !0,
    flexPositive: !0,
    flexShrink: !0,
    flexNegative: !0,
    flexOrder: !0,
    gridArea: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowSpan: !0,
    gridRowStart: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnSpan: !0,
    gridColumnStart: !0,
    fontWeight: !0,
    lineClamp: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    tabSize: !0,
    widows: !0,
    zIndex: !0,
    zoom: !0,
    fillOpacity: !0,
    floodOpacity: !0,
    stopOpacity: !0,
    strokeDasharray: !0,
    strokeDashoffset: !0,
    strokeMiterlimit: !0,
    strokeOpacity: !0,
    strokeWidth: !0,
  },
  Sf = ["Webkit", "ms", "Moz", "O"];
Object.keys(sr).forEach(function (e) {
  Sf.forEach(function (t) {
    ((t = t + e.charAt(0).toUpperCase() + e.substring(1)), (sr[t] = sr[e]));
  });
});
function Ma(e, t, n) {
  return t == null || typeof t == "boolean" || t === ""
    ? ""
    : n || typeof t != "number" || t === 0 || (sr.hasOwnProperty(e) && sr[e])
      ? ("" + t).trim()
      : t + "px";
}
function Oa(e, t) {
  e = e.style;
  for (var n in t)
    if (t.hasOwnProperty(n)) {
      var r = n.indexOf("--") === 0,
        o = Ma(n, t[n], r);
      (n === "float" && (n = "cssFloat"), r ? e.setProperty(n, o) : (e[n] = o));
    }
}
var kf = le(
  { menuitem: !0 },
  {
    area: !0,
    base: !0,
    br: !0,
    col: !0,
    embed: !0,
    hr: !0,
    img: !0,
    input: !0,
    keygen: !0,
    link: !0,
    meta: !0,
    param: !0,
    source: !0,
    track: !0,
    wbr: !0,
  },
);
function ti(e, t) {
  if (t) {
    if (kf[e] && (t.children != null || t.dangerouslySetInnerHTML != null))
      throw Error(_(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(_(60));
      if (
        typeof t.dangerouslySetInnerHTML != "object" ||
        !("__html" in t.dangerouslySetInnerHTML)
      )
        throw Error(_(61));
    }
    if (t.style != null && typeof t.style != "object") throw Error(_(62));
  }
}
function ni(e, t) {
  if (e.indexOf("-") === -1) return typeof t.is == "string";
  switch (e) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return !1;
    default:
      return !0;
  }
}
var ri = null;
function Xi(e) {
  return (
    (e = e.target || e.srcElement || window),
    e.correspondingUseElement && (e = e.correspondingUseElement),
    e.nodeType === 3 ? e.parentNode : e
  );
}
var oi = null,
  Nn = null,
  _n = null;
function Gs(e) {
  if ((e = Fr(e))) {
    if (typeof oi != "function") throw Error(_(280));
    var t = e.stateNode;
    t && ((t = Zo(t)), oi(e.stateNode, e.type, t));
  }
}
function Aa(e) {
  Nn ? (_n ? _n.push(e) : (_n = [e])) : (Nn = e);
}
function Ia() {
  if (Nn) {
    var e = Nn,
      t = _n;
    if (((_n = Nn = null), Gs(e), t)) for (e = 0; e < t.length; e++) Gs(t[e]);
  }
}
function Da(e, t) {
  return e(t);
}
function $a() {}
var gl = !1;
function Fa(e, t, n) {
  if (gl) return e(t, n);
  gl = !0;
  try {
    return Da(e, t, n);
  } finally {
    ((gl = !1), (Nn !== null || _n !== null) && ($a(), Ia()));
  }
}
function xr(e, t) {
  var n = e.stateNode;
  if (n === null) return null;
  var r = Zo(n);
  if (r === null) return null;
  n = r[t];
  e: switch (t) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      ((r = !r.disabled) ||
        ((e = e.type),
        (r = !(
          e === "button" ||
          e === "input" ||
          e === "select" ||
          e === "textarea"
        ))),
        (e = !r));
      break e;
    default:
      e = !1;
  }
  if (e) return null;
  if (n && typeof n != "function") throw Error(_(231, t, typeof n));
  return n;
}
var li = !1;
if (vt)
  try {
    var Yn = {};
    (Object.defineProperty(Yn, "passive", {
      get: function () {
        li = !0;
      },
    }),
      window.addEventListener("test", Yn, Yn),
      window.removeEventListener("test", Yn, Yn));
  } catch {
    li = !1;
  }
function Cf(e, t, n, r, o, l, i, s, u) {
  var a = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, a);
  } catch (m) {
    this.onError(m);
  }
}
var ur = !1,
  ko = null,
  Co = !1,
  ii = null,
  Ef = {
    onError: function (e) {
      ((ur = !0), (ko = e));
    },
  };
function jf(e, t, n, r, o, l, i, s, u) {
  ((ur = !1), (ko = null), Cf.apply(Ef, arguments));
}
function Rf(e, t, n, r, o, l, i, s, u) {
  if ((jf.apply(this, arguments), ur)) {
    if (ur) {
      var a = ko;
      ((ur = !1), (ko = null));
    } else throw Error(_(198));
    Co || ((Co = !0), (ii = a));
  }
}
function an(e) {
  var t = e,
    n = e;
  if (e.alternate) for (; t.return; ) t = t.return;
  else {
    e = t;
    do ((t = e), t.flags & 4098 && (n = t.return), (e = t.return));
    while (e);
  }
  return t.tag === 3 ? n : null;
}
function Ua(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (
      (t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)),
      t !== null)
    )
      return t.dehydrated;
  }
  return null;
}
function Zs(e) {
  if (an(e) !== e) throw Error(_(188));
}
function Tf(e) {
  var t = e.alternate;
  if (!t) {
    if (((t = an(e)), t === null)) throw Error(_(188));
    return t !== e ? null : e;
  }
  for (var n = e, r = t; ; ) {
    var o = n.return;
    if (o === null) break;
    var l = o.alternate;
    if (l === null) {
      if (((r = o.return), r !== null)) {
        n = r;
        continue;
      }
      break;
    }
    if (o.child === l.child) {
      for (l = o.child; l; ) {
        if (l === n) return (Zs(o), e);
        if (l === r) return (Zs(o), t);
        l = l.sibling;
      }
      throw Error(_(188));
    }
    if (n.return !== r.return) ((n = o), (r = l));
    else {
      for (var i = !1, s = o.child; s; ) {
        if (s === n) {
          ((i = !0), (n = o), (r = l));
          break;
        }
        if (s === r) {
          ((i = !0), (r = o), (n = l));
          break;
        }
        s = s.sibling;
      }
      if (!i) {
        for (s = l.child; s; ) {
          if (s === n) {
            ((i = !0), (n = l), (r = o));
            break;
          }
          if (s === r) {
            ((i = !0), (r = l), (n = o));
            break;
          }
          s = s.sibling;
        }
        if (!i) throw Error(_(189));
      }
    }
    if (n.alternate !== r) throw Error(_(190));
  }
  if (n.tag !== 3) throw Error(_(188));
  return n.stateNode.current === n ? e : t;
}
function Ba(e) {
  return ((e = Tf(e)), e !== null ? ba(e) : null);
}
function ba(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = ba(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var Wa = De.unstable_scheduleCallback,
  Js = De.unstable_cancelCallback,
  Nf = De.unstable_shouldYield,
  _f = De.unstable_requestPaint,
  se = De.unstable_now,
  Pf = De.unstable_getCurrentPriorityLevel,
  Gi = De.unstable_ImmediatePriority,
  Ha = De.unstable_UserBlockingPriority,
  Eo = De.unstable_NormalPriority,
  zf = De.unstable_LowPriority,
  Va = De.unstable_IdlePriority,
  Ko = null,
  ut = null;
function Lf(e) {
  if (ut && typeof ut.onCommitFiberRoot == "function")
    try {
      ut.onCommitFiberRoot(Ko, e, void 0, (e.current.flags & 128) === 128);
    } catch {}
}
var qe = Math.clz32 ? Math.clz32 : Af,
  Mf = Math.log,
  Of = Math.LN2;
function Af(e) {
  return ((e >>>= 0), e === 0 ? 32 : (31 - ((Mf(e) / Of) | 0)) | 0);
}
var Kr = 64,
  Yr = 4194304;
function or(e) {
  switch (e & -e) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return e & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return e;
  }
}
function jo(e, t) {
  var n = e.pendingLanes;
  if (n === 0) return 0;
  var r = 0,
    o = e.suspendedLanes,
    l = e.pingedLanes,
    i = n & 268435455;
  if (i !== 0) {
    var s = i & ~o;
    s !== 0 ? (r = or(s)) : ((l &= i), l !== 0 && (r = or(l)));
  } else ((i = n & ~o), i !== 0 ? (r = or(i)) : l !== 0 && (r = or(l)));
  if (r === 0) return 0;
  if (
    t !== 0 &&
    t !== r &&
    !(t & o) &&
    ((o = r & -r), (l = t & -t), o >= l || (o === 16 && (l & 4194240) !== 0))
  )
    return t;
  if ((r & 4 && (r |= n & 16), (t = e.entangledLanes), t !== 0))
    for (e = e.entanglements, t &= r; 0 < t; )
      ((n = 31 - qe(t)), (o = 1 << n), (r |= e[n]), (t &= ~o));
  return r;
}
function If(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
      return t + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function Df(e, t) {
  for (
    var n = e.suspendedLanes,
      r = e.pingedLanes,
      o = e.expirationTimes,
      l = e.pendingLanes;
    0 < l;
  ) {
    var i = 31 - qe(l),
      s = 1 << i,
      u = o[i];
    (u === -1
      ? (!(s & n) || s & r) && (o[i] = If(s, t))
      : u <= t && (e.expiredLanes |= s),
      (l &= ~s));
  }
}
function si(e) {
  return (
    (e = e.pendingLanes & -1073741825),
    e !== 0 ? e : e & 1073741824 ? 1073741824 : 0
  );
}
function Qa() {
  var e = Kr;
  return ((Kr <<= 1), !(Kr & 4194240) && (Kr = 64), e);
}
function vl(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e);
  return t;
}
function Dr(e, t, n) {
  ((e.pendingLanes |= t),
    t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
    (e = e.eventTimes),
    (t = 31 - qe(t)),
    (e[t] = n));
}
function $f(e, t) {
  var n = e.pendingLanes & ~t;
  ((e.pendingLanes = t),
    (e.suspendedLanes = 0),
    (e.pingedLanes = 0),
    (e.expiredLanes &= t),
    (e.mutableReadLanes &= t),
    (e.entangledLanes &= t),
    (t = e.entanglements));
  var r = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var o = 31 - qe(n),
      l = 1 << o;
    ((t[o] = 0), (r[o] = -1), (e[o] = -1), (n &= ~l));
  }
}
function Zi(e, t) {
  var n = (e.entangledLanes |= t);
  for (e = e.entanglements; n; ) {
    var r = 31 - qe(n),
      o = 1 << r;
    ((o & t) | (e[r] & t) && (e[r] |= t), (n &= ~o));
  }
}
var H = 0;
function Ka(e) {
  return (
    (e &= -e),
    1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1
  );
}
var Ya,
  Ji,
  Xa,
  Ga,
  Za,
  ui = !1,
  Xr = [],
  Pt = null,
  zt = null,
  Lt = null,
  wr = new Map(),
  Sr = new Map(),
  Rt = [],
  Ff =
    "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(
      " ",
    );
function qs(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      Pt = null;
      break;
    case "dragenter":
    case "dragleave":
      zt = null;
      break;
    case "mouseover":
    case "mouseout":
      Lt = null;
      break;
    case "pointerover":
    case "pointerout":
      wr.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Sr.delete(t.pointerId);
  }
}
function Xn(e, t, n, r, o, l) {
  return e === null || e.nativeEvent !== l
    ? ((e = {
        blockedOn: t,
        domEventName: n,
        eventSystemFlags: r,
        nativeEvent: l,
        targetContainers: [o],
      }),
      t !== null && ((t = Fr(t)), t !== null && Ji(t)),
      e)
    : ((e.eventSystemFlags |= r),
      (t = e.targetContainers),
      o !== null && t.indexOf(o) === -1 && t.push(o),
      e);
}
function Uf(e, t, n, r, o) {
  switch (t) {
    case "focusin":
      return ((Pt = Xn(Pt, e, t, n, r, o)), !0);
    case "dragenter":
      return ((zt = Xn(zt, e, t, n, r, o)), !0);
    case "mouseover":
      return ((Lt = Xn(Lt, e, t, n, r, o)), !0);
    case "pointerover":
      var l = o.pointerId;
      return (wr.set(l, Xn(wr.get(l) || null, e, t, n, r, o)), !0);
    case "gotpointercapture":
      return (
        (l = o.pointerId),
        Sr.set(l, Xn(Sr.get(l) || null, e, t, n, r, o)),
        !0
      );
  }
  return !1;
}
function Ja(e) {
  var t = Gt(e.target);
  if (t !== null) {
    var n = an(t);
    if (n !== null) {
      if (((t = n.tag), t === 13)) {
        if (((t = Ua(n)), t !== null)) {
          ((e.blockedOn = t),
            Za(e.priority, function () {
              Xa(n);
            }));
          return;
        }
      } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
        return;
      }
    }
  }
  e.blockedOn = null;
}
function co(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = ai(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var r = new n.constructor(n.type, n);
      ((ri = r), n.target.dispatchEvent(r), (ri = null));
    } else return ((t = Fr(n)), t !== null && Ji(t), (e.blockedOn = n), !1);
    t.shift();
  }
  return !0;
}
function eu(e, t, n) {
  co(e) && n.delete(t);
}
function Bf() {
  ((ui = !1),
    Pt !== null && co(Pt) && (Pt = null),
    zt !== null && co(zt) && (zt = null),
    Lt !== null && co(Lt) && (Lt = null),
    wr.forEach(eu),
    Sr.forEach(eu));
}
function Gn(e, t) {
  e.blockedOn === t &&
    ((e.blockedOn = null),
    ui ||
      ((ui = !0),
      De.unstable_scheduleCallback(De.unstable_NormalPriority, Bf)));
}
function kr(e) {
  function t(o) {
    return Gn(o, e);
  }
  if (0 < Xr.length) {
    Gn(Xr[0], e);
    for (var n = 1; n < Xr.length; n++) {
      var r = Xr[n];
      r.blockedOn === e && (r.blockedOn = null);
    }
  }
  for (
    Pt !== null && Gn(Pt, e),
      zt !== null && Gn(zt, e),
      Lt !== null && Gn(Lt, e),
      wr.forEach(t),
      Sr.forEach(t),
      n = 0;
    n < Rt.length;
    n++
  )
    ((r = Rt[n]), r.blockedOn === e && (r.blockedOn = null));
  for (; 0 < Rt.length && ((n = Rt[0]), n.blockedOn === null); )
    (Ja(n), n.blockedOn === null && Rt.shift());
}
var Pn = St.ReactCurrentBatchConfig,
  Ro = !0;
function bf(e, t, n, r) {
  var o = H,
    l = Pn.transition;
  Pn.transition = null;
  try {
    ((H = 1), qi(e, t, n, r));
  } finally {
    ((H = o), (Pn.transition = l));
  }
}
function Wf(e, t, n, r) {
  var o = H,
    l = Pn.transition;
  Pn.transition = null;
  try {
    ((H = 4), qi(e, t, n, r));
  } finally {
    ((H = o), (Pn.transition = l));
  }
}
function qi(e, t, n, r) {
  if (Ro) {
    var o = ai(e, t, n, r);
    if (o === null) (Tl(e, t, r, To, n), qs(e, r));
    else if (Uf(o, e, t, n, r)) r.stopPropagation();
    else if ((qs(e, r), t & 4 && -1 < Ff.indexOf(e))) {
      for (; o !== null; ) {
        var l = Fr(o);
        if (
          (l !== null && Ya(l),
          (l = ai(e, t, n, r)),
          l === null && Tl(e, t, r, To, n),
          l === o)
        )
          break;
        o = l;
      }
      o !== null && r.stopPropagation();
    } else Tl(e, t, r, null, n);
  }
}
var To = null;
function ai(e, t, n, r) {
  if (((To = null), (e = Xi(r)), (e = Gt(e)), e !== null))
    if (((t = an(e)), t === null)) e = null;
    else if (((n = t.tag), n === 13)) {
      if (((e = Ua(t)), e !== null)) return e;
      e = null;
    } else if (n === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated)
        return t.tag === 3 ? t.stateNode.containerInfo : null;
      e = null;
    } else t !== e && (e = null);
  return ((To = e), null);
}
function qa(e) {
  switch (e) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (Pf()) {
        case Gi:
          return 1;
        case Ha:
          return 4;
        case Eo:
        case zf:
          return 16;
        case Va:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var Nt = null,
  es = null,
  fo = null;
function ec() {
  if (fo) return fo;
  var e,
    t = es,
    n = t.length,
    r,
    o = "value" in Nt ? Nt.value : Nt.textContent,
    l = o.length;
  for (e = 0; e < n && t[e] === o[e]; e++);
  var i = n - e;
  for (r = 1; r <= i && t[n - r] === o[l - r]; r++);
  return (fo = o.slice(e, 1 < r ? 1 - r : void 0));
}
function po(e) {
  var t = e.keyCode;
  return (
    "charCode" in e
      ? ((e = e.charCode), e === 0 && t === 13 && (e = 13))
      : (e = t),
    e === 10 && (e = 13),
    32 <= e || e === 13 ? e : 0
  );
}
function Gr() {
  return !0;
}
function tu() {
  return !1;
}
function Fe(e) {
  function t(n, r, o, l, i) {
    ((this._reactName = n),
      (this._targetInst = o),
      (this.type = r),
      (this.nativeEvent = l),
      (this.target = i),
      (this.currentTarget = null));
    for (var s in e)
      e.hasOwnProperty(s) && ((n = e[s]), (this[s] = n ? n(l) : l[s]));
    return (
      (this.isDefaultPrevented = (
        l.defaultPrevented != null ? l.defaultPrevented : l.returnValue === !1
      )
        ? Gr
        : tu),
      (this.isPropagationStopped = tu),
      this
    );
  }
  return (
    le(t.prototype, {
      preventDefault: function () {
        this.defaultPrevented = !0;
        var n = this.nativeEvent;
        n &&
          (n.preventDefault
            ? n.preventDefault()
            : typeof n.returnValue != "unknown" && (n.returnValue = !1),
          (this.isDefaultPrevented = Gr));
      },
      stopPropagation: function () {
        var n = this.nativeEvent;
        n &&
          (n.stopPropagation
            ? n.stopPropagation()
            : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0),
          (this.isPropagationStopped = Gr));
      },
      persist: function () {},
      isPersistent: Gr,
    }),
    t
  );
}
var bn = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function (e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0,
  },
  ts = Fe(bn),
  $r = le({}, bn, { view: 0, detail: 0 }),
  Hf = Fe($r),
  yl,
  xl,
  Zn,
  Yo = le({}, $r, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: ns,
    button: 0,
    buttons: 0,
    relatedTarget: function (e) {
      return e.relatedTarget === void 0
        ? e.fromElement === e.srcElement
          ? e.toElement
          : e.fromElement
        : e.relatedTarget;
    },
    movementX: function (e) {
      return "movementX" in e
        ? e.movementX
        : (e !== Zn &&
            (Zn && e.type === "mousemove"
              ? ((yl = e.screenX - Zn.screenX), (xl = e.screenY - Zn.screenY))
              : (xl = yl = 0),
            (Zn = e)),
          yl);
    },
    movementY: function (e) {
      return "movementY" in e ? e.movementY : xl;
    },
  }),
  nu = Fe(Yo),
  Vf = le({}, Yo, { dataTransfer: 0 }),
  Qf = Fe(Vf),
  Kf = le({}, $r, { relatedTarget: 0 }),
  wl = Fe(Kf),
  Yf = le({}, bn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
  Xf = Fe(Yf),
  Gf = le({}, bn, {
    clipboardData: function (e) {
      return "clipboardData" in e ? e.clipboardData : window.clipboardData;
    },
  }),
  Zf = Fe(Gf),
  Jf = le({}, bn, { data: 0 }),
  ru = Fe(Jf),
  qf = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified",
  },
  ep = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta",
  },
  tp = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey",
  };
function np(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = tp[e]) ? !!t[e] : !1;
}
function ns() {
  return np;
}
var rp = le({}, $r, {
    key: function (e) {
      if (e.key) {
        var t = qf[e.key] || e.key;
        if (t !== "Unidentified") return t;
      }
      return e.type === "keypress"
        ? ((e = po(e)), e === 13 ? "Enter" : String.fromCharCode(e))
        : e.type === "keydown" || e.type === "keyup"
          ? ep[e.keyCode] || "Unidentified"
          : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: ns,
    charCode: function (e) {
      return e.type === "keypress" ? po(e) : 0;
    },
    keyCode: function (e) {
      return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
    which: function (e) {
      return e.type === "keypress"
        ? po(e)
        : e.type === "keydown" || e.type === "keyup"
          ? e.keyCode
          : 0;
    },
  }),
  op = Fe(rp),
  lp = le({}, Yo, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0,
  }),
  ou = Fe(lp),
  ip = le({}, $r, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: ns,
  }),
  sp = Fe(ip),
  up = le({}, bn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
  ap = Fe(up),
  cp = le({}, Yo, {
    deltaX: function (e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function (e) {
      return "deltaY" in e
        ? e.deltaY
        : "wheelDeltaY" in e
          ? -e.wheelDeltaY
          : "wheelDelta" in e
            ? -e.wheelDelta
            : 0;
    },
    deltaZ: 0,
    deltaMode: 0,
  }),
  dp = Fe(cp),
  fp = [9, 13, 27, 32],
  rs = vt && "CompositionEvent" in window,
  ar = null;
vt && "documentMode" in document && (ar = document.documentMode);
var pp = vt && "TextEvent" in window && !ar,
  tc = vt && (!rs || (ar && 8 < ar && 11 >= ar)),
  lu = " ",
  iu = !1;
function nc(e, t) {
  switch (e) {
    case "keyup":
      return fp.indexOf(t.keyCode) !== -1;
    case "keydown":
      return t.keyCode !== 229;
    case "keypress":
    case "mousedown":
    case "focusout":
      return !0;
    default:
      return !1;
  }
}
function rc(e) {
  return ((e = e.detail), typeof e == "object" && "data" in e ? e.data : null);
}
var gn = !1;
function mp(e, t) {
  switch (e) {
    case "compositionend":
      return rc(t);
    case "keypress":
      return t.which !== 32 ? null : ((iu = !0), lu);
    case "textInput":
      return ((e = t.data), e === lu && iu ? null : e);
    default:
      return null;
  }
}
function hp(e, t) {
  if (gn)
    return e === "compositionend" || (!rs && nc(e, t))
      ? ((e = ec()), (fo = es = Nt = null), (gn = !1), e)
      : null;
  switch (e) {
    case "paste":
      return null;
    case "keypress":
      if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
        if (t.char && 1 < t.char.length) return t.char;
        if (t.which) return String.fromCharCode(t.which);
      }
      return null;
    case "compositionend":
      return tc && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var gp = {
  color: !0,
  date: !0,
  datetime: !0,
  "datetime-local": !0,
  email: !0,
  month: !0,
  number: !0,
  password: !0,
  range: !0,
  search: !0,
  tel: !0,
  text: !0,
  time: !0,
  url: !0,
  week: !0,
};
function su(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!gp[e.type] : t === "textarea";
}
function oc(e, t, n, r) {
  (Aa(r),
    (t = No(t, "onChange")),
    0 < t.length &&
      ((n = new ts("onChange", "change", null, n, r)),
      e.push({ event: n, listeners: t })));
}
var cr = null,
  Cr = null;
function vp(e) {
  hc(e, 0);
}
function Xo(e) {
  var t = xn(e);
  if (Na(t)) return e;
}
function yp(e, t) {
  if (e === "change") return t;
}
var lc = !1;
if (vt) {
  var Sl;
  if (vt) {
    var kl = "oninput" in document;
    if (!kl) {
      var uu = document.createElement("div");
      (uu.setAttribute("oninput", "return;"),
        (kl = typeof uu.oninput == "function"));
    }
    Sl = kl;
  } else Sl = !1;
  lc = Sl && (!document.documentMode || 9 < document.documentMode);
}
function au() {
  cr && (cr.detachEvent("onpropertychange", ic), (Cr = cr = null));
}
function ic(e) {
  if (e.propertyName === "value" && Xo(Cr)) {
    var t = [];
    (oc(t, Cr, e, Xi(e)), Fa(vp, t));
  }
}
function xp(e, t, n) {
  e === "focusin"
    ? (au(), (cr = t), (Cr = n), cr.attachEvent("onpropertychange", ic))
    : e === "focusout" && au();
}
function wp(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown")
    return Xo(Cr);
}
function Sp(e, t) {
  if (e === "click") return Xo(t);
}
function kp(e, t) {
  if (e === "input" || e === "change") return Xo(t);
}
function Cp(e, t) {
  return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var tt = typeof Object.is == "function" ? Object.is : Cp;
function Er(e, t) {
  if (tt(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null)
    return !1;
  var n = Object.keys(e),
    r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (r = 0; r < n.length; r++) {
    var o = n[r];
    if (!Vl.call(t, o) || !tt(e[o], t[o])) return !1;
  }
  return !0;
}
function cu(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function du(e, t) {
  var n = cu(e);
  e = 0;
  for (var r; n; ) {
    if (n.nodeType === 3) {
      if (((r = e + n.textContent.length), e <= t && r >= t))
        return { node: n, offset: t - e };
      e = r;
    }
    e: {
      for (; n; ) {
        if (n.nextSibling) {
          n = n.nextSibling;
          break e;
        }
        n = n.parentNode;
      }
      n = void 0;
    }
    n = cu(n);
  }
}
function sc(e, t) {
  return e && t
    ? e === t
      ? !0
      : e && e.nodeType === 3
        ? !1
        : t && t.nodeType === 3
          ? sc(e, t.parentNode)
          : "contains" in e
            ? e.contains(t)
            : e.compareDocumentPosition
              ? !!(e.compareDocumentPosition(t) & 16)
              : !1
    : !1;
}
function uc() {
  for (var e = window, t = So(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == "string";
    } catch {
      n = !1;
    }
    if (n) e = t.contentWindow;
    else break;
    t = So(e.document);
  }
  return t;
}
function os(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return (
    t &&
    ((t === "input" &&
      (e.type === "text" ||
        e.type === "search" ||
        e.type === "tel" ||
        e.type === "url" ||
        e.type === "password")) ||
      t === "textarea" ||
      e.contentEditable === "true")
  );
}
function Ep(e) {
  var t = uc(),
    n = e.focusedElem,
    r = e.selectionRange;
  if (
    t !== n &&
    n &&
    n.ownerDocument &&
    sc(n.ownerDocument.documentElement, n)
  ) {
    if (r !== null && os(n)) {
      if (
        ((t = r.start),
        (e = r.end),
        e === void 0 && (e = t),
        "selectionStart" in n)
      )
        ((n.selectionStart = t),
          (n.selectionEnd = Math.min(e, n.value.length)));
      else if (
        ((e = ((t = n.ownerDocument || document) && t.defaultView) || window),
        e.getSelection)
      ) {
        e = e.getSelection();
        var o = n.textContent.length,
          l = Math.min(r.start, o);
        ((r = r.end === void 0 ? l : Math.min(r.end, o)),
          !e.extend && l > r && ((o = r), (r = l), (l = o)),
          (o = du(n, l)));
        var i = du(n, r);
        o &&
          i &&
          (e.rangeCount !== 1 ||
            e.anchorNode !== o.node ||
            e.anchorOffset !== o.offset ||
            e.focusNode !== i.node ||
            e.focusOffset !== i.offset) &&
          ((t = t.createRange()),
          t.setStart(o.node, o.offset),
          e.removeAllRanges(),
          l > r
            ? (e.addRange(t), e.extend(i.node, i.offset))
            : (t.setEnd(i.node, i.offset), e.addRange(t)));
      }
    }
    for (t = [], e = n; (e = e.parentNode); )
      e.nodeType === 1 &&
        t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++)
      ((e = t[n]),
        (e.element.scrollLeft = e.left),
        (e.element.scrollTop = e.top));
  }
}
var jp = vt && "documentMode" in document && 11 >= document.documentMode,
  vn = null,
  ci = null,
  dr = null,
  di = !1;
function fu(e, t, n) {
  var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  di ||
    vn == null ||
    vn !== So(r) ||
    ((r = vn),
    "selectionStart" in r && os(r)
      ? (r = { start: r.selectionStart, end: r.selectionEnd })
      : ((r = (
          (r.ownerDocument && r.ownerDocument.defaultView) ||
          window
        ).getSelection()),
        (r = {
          anchorNode: r.anchorNode,
          anchorOffset: r.anchorOffset,
          focusNode: r.focusNode,
          focusOffset: r.focusOffset,
        })),
    (dr && Er(dr, r)) ||
      ((dr = r),
      (r = No(ci, "onSelect")),
      0 < r.length &&
        ((t = new ts("onSelect", "select", null, t, n)),
        e.push({ event: t, listeners: r }),
        (t.target = vn))));
}
function Zr(e, t) {
  var n = {};
  return (
    (n[e.toLowerCase()] = t.toLowerCase()),
    (n["Webkit" + e] = "webkit" + t),
    (n["Moz" + e] = "moz" + t),
    n
  );
}
var yn = {
    animationend: Zr("Animation", "AnimationEnd"),
    animationiteration: Zr("Animation", "AnimationIteration"),
    animationstart: Zr("Animation", "AnimationStart"),
    transitionend: Zr("Transition", "TransitionEnd"),
  },
  Cl = {},
  ac = {};
vt &&
  ((ac = document.createElement("div").style),
  "AnimationEvent" in window ||
    (delete yn.animationend.animation,
    delete yn.animationiteration.animation,
    delete yn.animationstart.animation),
  "TransitionEvent" in window || delete yn.transitionend.transition);
function Go(e) {
  if (Cl[e]) return Cl[e];
  if (!yn[e]) return e;
  var t = yn[e],
    n;
  for (n in t) if (t.hasOwnProperty(n) && n in ac) return (Cl[e] = t[n]);
  return e;
}
var cc = Go("animationend"),
  dc = Go("animationiteration"),
  fc = Go("animationstart"),
  pc = Go("transitionend"),
  mc = new Map(),
  pu =
    "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
      " ",
    );
function bt(e, t) {
  (mc.set(e, t), un(t, [e]));
}
for (var El = 0; El < pu.length; El++) {
  var jl = pu[El],
    Rp = jl.toLowerCase(),
    Tp = jl[0].toUpperCase() + jl.slice(1);
  bt(Rp, "on" + Tp);
}
bt(cc, "onAnimationEnd");
bt(dc, "onAnimationIteration");
bt(fc, "onAnimationStart");
bt("dblclick", "onDoubleClick");
bt("focusin", "onFocus");
bt("focusout", "onBlur");
bt(pc, "onTransitionEnd");
Mn("onMouseEnter", ["mouseout", "mouseover"]);
Mn("onMouseLeave", ["mouseout", "mouseover"]);
Mn("onPointerEnter", ["pointerout", "pointerover"]);
Mn("onPointerLeave", ["pointerout", "pointerover"]);
un(
  "onChange",
  "change click focusin focusout input keydown keyup selectionchange".split(
    " ",
  ),
);
un(
  "onSelect",
  "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
    " ",
  ),
);
un("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
un(
  "onCompositionEnd",
  "compositionend focusout keydown keypress keyup mousedown".split(" "),
);
un(
  "onCompositionStart",
  "compositionstart focusout keydown keypress keyup mousedown".split(" "),
);
un(
  "onCompositionUpdate",
  "compositionupdate focusout keydown keypress keyup mousedown".split(" "),
);
var lr =
    "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
      " ",
    ),
  Np = new Set("cancel close invalid load scroll toggle".split(" ").concat(lr));
function mu(e, t, n) {
  var r = e.type || "unknown-event";
  ((e.currentTarget = n), Rf(r, t, void 0, e), (e.currentTarget = null));
}
function hc(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var r = e[n],
      o = r.event;
    r = r.listeners;
    e: {
      var l = void 0;
      if (t)
        for (var i = r.length - 1; 0 <= i; i--) {
          var s = r[i],
            u = s.instance,
            a = s.currentTarget;
          if (((s = s.listener), u !== l && o.isPropagationStopped())) break e;
          (mu(o, s, a), (l = u));
        }
      else
        for (i = 0; i < r.length; i++) {
          if (
            ((s = r[i]),
            (u = s.instance),
            (a = s.currentTarget),
            (s = s.listener),
            u !== l && o.isPropagationStopped())
          )
            break e;
          (mu(o, s, a), (l = u));
        }
    }
  }
  if (Co) throw ((e = ii), (Co = !1), (ii = null), e);
}
function Z(e, t) {
  var n = t[gi];
  n === void 0 && (n = t[gi] = new Set());
  var r = e + "__bubble";
  n.has(r) || (gc(t, e, 2, !1), n.add(r));
}
function Rl(e, t, n) {
  var r = 0;
  (t && (r |= 4), gc(n, e, r, t));
}
var Jr = "_reactListening" + Math.random().toString(36).slice(2);
function jr(e) {
  if (!e[Jr]) {
    ((e[Jr] = !0),
      Ca.forEach(function (n) {
        n !== "selectionchange" && (Np.has(n) || Rl(n, !1, e), Rl(n, !0, e));
      }));
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[Jr] || ((t[Jr] = !0), Rl("selectionchange", !1, t));
  }
}
function gc(e, t, n, r) {
  switch (qa(t)) {
    case 1:
      var o = bf;
      break;
    case 4:
      o = Wf;
      break;
    default:
      o = qi;
  }
  ((n = o.bind(null, t, n, e)),
    (o = void 0),
    !li ||
      (t !== "touchstart" && t !== "touchmove" && t !== "wheel") ||
      (o = !0),
    r
      ? o !== void 0
        ? e.addEventListener(t, n, { capture: !0, passive: o })
        : e.addEventListener(t, n, !0)
      : o !== void 0
        ? e.addEventListener(t, n, { passive: o })
        : e.addEventListener(t, n, !1));
}
function Tl(e, t, n, r, o) {
  var l = r;
  if (!(t & 1) && !(t & 2) && r !== null)
    e: for (;;) {
      if (r === null) return;
      var i = r.tag;
      if (i === 3 || i === 4) {
        var s = r.stateNode.containerInfo;
        if (s === o || (s.nodeType === 8 && s.parentNode === o)) break;
        if (i === 4)
          for (i = r.return; i !== null; ) {
            var u = i.tag;
            if (
              (u === 3 || u === 4) &&
              ((u = i.stateNode.containerInfo),
              u === o || (u.nodeType === 8 && u.parentNode === o))
            )
              return;
            i = i.return;
          }
        for (; s !== null; ) {
          if (((i = Gt(s)), i === null)) return;
          if (((u = i.tag), u === 5 || u === 6)) {
            r = l = i;
            continue e;
          }
          s = s.parentNode;
        }
      }
      r = r.return;
    }
  Fa(function () {
    var a = l,
      m = Xi(n),
      c = [];
    e: {
      var v = mc.get(e);
      if (v !== void 0) {
        var w = ts,
          C = e;
        switch (e) {
          case "keypress":
            if (po(n) === 0) break e;
          case "keydown":
          case "keyup":
            w = op;
            break;
          case "focusin":
            ((C = "focus"), (w = wl));
            break;
          case "focusout":
            ((C = "blur"), (w = wl));
            break;
          case "beforeblur":
          case "afterblur":
            w = wl;
            break;
          case "click":
            if (n.button === 2) break e;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            w = nu;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            w = Qf;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            w = sp;
            break;
          case cc:
          case dc:
          case fc:
            w = Xf;
            break;
          case pc:
            w = ap;
            break;
          case "scroll":
            w = Hf;
            break;
          case "wheel":
            w = dp;
            break;
          case "copy":
          case "cut":
          case "paste":
            w = Zf;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            w = ou;
        }
        var y = (t & 4) !== 0,
          N = !y && e === "scroll",
          p = y ? (v !== null ? v + "Capture" : null) : v;
        y = [];
        for (var d = a, h; d !== null; ) {
          h = d;
          var g = h.stateNode;
          if (
            (h.tag === 5 &&
              g !== null &&
              ((h = g),
              p !== null && ((g = xr(d, p)), g != null && y.push(Rr(d, g, h)))),
            N)
          )
            break;
          d = d.return;
        }
        0 < y.length &&
          ((v = new w(v, C, null, n, m)), c.push({ event: v, listeners: y }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (
          ((v = e === "mouseover" || e === "pointerover"),
          (w = e === "mouseout" || e === "pointerout"),
          v &&
            n !== ri &&
            (C = n.relatedTarget || n.fromElement) &&
            (Gt(C) || C[yt]))
        )
          break e;
        if (
          (w || v) &&
          ((v =
            m.window === m
              ? m
              : (v = m.ownerDocument)
                ? v.defaultView || v.parentWindow
                : window),
          w
            ? ((C = n.relatedTarget || n.toElement),
              (w = a),
              (C = C ? Gt(C) : null),
              C !== null &&
                ((N = an(C)), C !== N || (C.tag !== 5 && C.tag !== 6)) &&
                (C = null))
            : ((w = null), (C = a)),
          w !== C)
        ) {
          if (
            ((y = nu),
            (g = "onMouseLeave"),
            (p = "onMouseEnter"),
            (d = "mouse"),
            (e === "pointerout" || e === "pointerover") &&
              ((y = ou),
              (g = "onPointerLeave"),
              (p = "onPointerEnter"),
              (d = "pointer")),
            (N = w == null ? v : xn(w)),
            (h = C == null ? v : xn(C)),
            (v = new y(g, d + "leave", w, n, m)),
            (v.target = N),
            (v.relatedTarget = h),
            (g = null),
            Gt(m) === a &&
              ((y = new y(p, d + "enter", C, n, m)),
              (y.target = h),
              (y.relatedTarget = N),
              (g = y)),
            (N = g),
            w && C)
          )
            t: {
              for (y = w, p = C, d = 0, h = y; h; h = pn(h)) d++;
              for (h = 0, g = p; g; g = pn(g)) h++;
              for (; 0 < d - h; ) ((y = pn(y)), d--);
              for (; 0 < h - d; ) ((p = pn(p)), h--);
              for (; d--; ) {
                if (y === p || (p !== null && y === p.alternate)) break t;
                ((y = pn(y)), (p = pn(p)));
              }
              y = null;
            }
          else y = null;
          (w !== null && hu(c, v, w, y, !1),
            C !== null && N !== null && hu(c, N, C, y, !0));
        }
      }
      e: {
        if (
          ((v = a ? xn(a) : window),
          (w = v.nodeName && v.nodeName.toLowerCase()),
          w === "select" || (w === "input" && v.type === "file"))
        )
          var S = yp;
        else if (su(v))
          if (lc) S = kp;
          else {
            S = wp;
            var x = xp;
          }
        else
          (w = v.nodeName) &&
            w.toLowerCase() === "input" &&
            (v.type === "checkbox" || v.type === "radio") &&
            (S = Sp);
        if (S && (S = S(e, a))) {
          oc(c, S, n, m);
          break e;
        }
        (x && x(e, v, a),
          e === "focusout" &&
            (x = v._wrapperState) &&
            x.controlled &&
            v.type === "number" &&
            Jl(v, "number", v.value));
      }
      switch (((x = a ? xn(a) : window), e)) {
        case "focusin":
          (su(x) || x.contentEditable === "true") &&
            ((vn = x), (ci = a), (dr = null));
          break;
        case "focusout":
          dr = ci = vn = null;
          break;
        case "mousedown":
          di = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          ((di = !1), fu(c, n, m));
          break;
        case "selectionchange":
          if (jp) break;
        case "keydown":
        case "keyup":
          fu(c, n, m);
      }
      var k;
      if (rs)
        e: {
          switch (e) {
            case "compositionstart":
              var j = "onCompositionStart";
              break e;
            case "compositionend":
              j = "onCompositionEnd";
              break e;
            case "compositionupdate":
              j = "onCompositionUpdate";
              break e;
          }
          j = void 0;
        }
      else
        gn
          ? nc(e, n) && (j = "onCompositionEnd")
          : e === "keydown" && n.keyCode === 229 && (j = "onCompositionStart");
      (j &&
        (tc &&
          n.locale !== "ko" &&
          (gn || j !== "onCompositionStart"
            ? j === "onCompositionEnd" && gn && (k = ec())
            : ((Nt = m),
              (es = "value" in Nt ? Nt.value : Nt.textContent),
              (gn = !0))),
        (x = No(a, j)),
        0 < x.length &&
          ((j = new ru(j, e, null, n, m)),
          c.push({ event: j, listeners: x }),
          k ? (j.data = k) : ((k = rc(n)), k !== null && (j.data = k)))),
        (k = pp ? mp(e, n) : hp(e, n)) &&
          ((a = No(a, "onBeforeInput")),
          0 < a.length &&
            ((m = new ru("onBeforeInput", "beforeinput", null, n, m)),
            c.push({ event: m, listeners: a }),
            (m.data = k))));
    }
    hc(c, t);
  });
}
function Rr(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function No(e, t) {
  for (var n = t + "Capture", r = []; e !== null; ) {
    var o = e,
      l = o.stateNode;
    (o.tag === 5 &&
      l !== null &&
      ((o = l),
      (l = xr(e, n)),
      l != null && r.unshift(Rr(e, l, o)),
      (l = xr(e, t)),
      l != null && r.push(Rr(e, l, o))),
      (e = e.return));
  }
  return r;
}
function pn(e) {
  if (e === null) return null;
  do e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function hu(e, t, n, r, o) {
  for (var l = t._reactName, i = []; n !== null && n !== r; ) {
    var s = n,
      u = s.alternate,
      a = s.stateNode;
    if (u !== null && u === r) break;
    (s.tag === 5 &&
      a !== null &&
      ((s = a),
      o
        ? ((u = xr(n, l)), u != null && i.unshift(Rr(n, u, s)))
        : o || ((u = xr(n, l)), u != null && i.push(Rr(n, u, s)))),
      (n = n.return));
  }
  i.length !== 0 && e.push({ event: t, listeners: i });
}
var _p = /\r\n?/g,
  Pp = /\u0000|\uFFFD/g;
function gu(e) {
  return (typeof e == "string" ? e : "" + e)
    .replace(
      _p,
      `
`,
    )
    .replace(Pp, "");
}
function qr(e, t, n) {
  if (((t = gu(t)), gu(e) !== t && n)) throw Error(_(425));
}
function _o() {}
var fi = null,
  pi = null;
function mi(e, t) {
  return (
    e === "textarea" ||
    e === "noscript" ||
    typeof t.children == "string" ||
    typeof t.children == "number" ||
    (typeof t.dangerouslySetInnerHTML == "object" &&
      t.dangerouslySetInnerHTML !== null &&
      t.dangerouslySetInnerHTML.__html != null)
  );
}
var hi = typeof setTimeout == "function" ? setTimeout : void 0,
  zp = typeof clearTimeout == "function" ? clearTimeout : void 0,
  vu = typeof Promise == "function" ? Promise : void 0,
  Lp =
    typeof queueMicrotask == "function"
      ? queueMicrotask
      : typeof vu < "u"
        ? function (e) {
            return vu.resolve(null).then(e).catch(Mp);
          }
        : hi;
function Mp(e) {
  setTimeout(function () {
    throw e;
  });
}
function Nl(e, t) {
  var n = t,
    r = 0;
  do {
    var o = n.nextSibling;
    if ((e.removeChild(n), o && o.nodeType === 8))
      if (((n = o.data), n === "/$")) {
        if (r === 0) {
          (e.removeChild(o), kr(t));
          return;
        }
        r--;
      } else (n !== "$" && n !== "$?" && n !== "$!") || r++;
    n = o;
  } while (n);
  kr(t);
}
function Mt(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType;
    if (t === 1 || t === 3) break;
    if (t === 8) {
      if (((t = e.data), t === "$" || t === "$!" || t === "$?")) break;
      if (t === "/$") return null;
    }
  }
  return e;
}
function yu(e) {
  e = e.previousSibling;
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var n = e.data;
      if (n === "$" || n === "$!" || n === "$?") {
        if (t === 0) return e;
        t--;
      } else n === "/$" && t++;
    }
    e = e.previousSibling;
  }
  return null;
}
var Wn = Math.random().toString(36).slice(2),
  st = "__reactFiber$" + Wn,
  Tr = "__reactProps$" + Wn,
  yt = "__reactContainer$" + Wn,
  gi = "__reactEvents$" + Wn,
  Op = "__reactListeners$" + Wn,
  Ap = "__reactHandles$" + Wn;
function Gt(e) {
  var t = e[st];
  if (t) return t;
  for (var n = e.parentNode; n; ) {
    if ((t = n[yt] || n[st])) {
      if (
        ((n = t.alternate),
        t.child !== null || (n !== null && n.child !== null))
      )
        for (e = yu(e); e !== null; ) {
          if ((n = e[st])) return n;
          e = yu(e);
        }
      return t;
    }
    ((e = n), (n = e.parentNode));
  }
  return null;
}
function Fr(e) {
  return (
    (e = e[st] || e[yt]),
    !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e
  );
}
function xn(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(_(33));
}
function Zo(e) {
  return e[Tr] || null;
}
var vi = [],
  wn = -1;
function Wt(e) {
  return { current: e };
}
function J(e) {
  0 > wn || ((e.current = vi[wn]), (vi[wn] = null), wn--);
}
function X(e, t) {
  (wn++, (vi[wn] = e.current), (e.current = t));
}
var Bt = {},
  ke = Wt(Bt),
  Pe = Wt(!1),
  nn = Bt;
function On(e, t) {
  var n = e.type.contextTypes;
  if (!n) return Bt;
  var r = e.stateNode;
  if (r && r.__reactInternalMemoizedUnmaskedChildContext === t)
    return r.__reactInternalMemoizedMaskedChildContext;
  var o = {},
    l;
  for (l in n) o[l] = t[l];
  return (
    r &&
      ((e = e.stateNode),
      (e.__reactInternalMemoizedUnmaskedChildContext = t),
      (e.__reactInternalMemoizedMaskedChildContext = o)),
    o
  );
}
function ze(e) {
  return ((e = e.childContextTypes), e != null);
}
function Po() {
  (J(Pe), J(ke));
}
function xu(e, t, n) {
  if (ke.current !== Bt) throw Error(_(168));
  (X(ke, t), X(Pe, n));
}
function vc(e, t, n) {
  var r = e.stateNode;
  if (((t = t.childContextTypes), typeof r.getChildContext != "function"))
    return n;
  r = r.getChildContext();
  for (var o in r) if (!(o in t)) throw Error(_(108, xf(e) || "Unknown", o));
  return le({}, n, r);
}
function zo(e) {
  return (
    (e =
      ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || Bt),
    (nn = ke.current),
    X(ke, e),
    X(Pe, Pe.current),
    !0
  );
}
function wu(e, t, n) {
  var r = e.stateNode;
  if (!r) throw Error(_(169));
  (n
    ? ((e = vc(e, t, nn)),
      (r.__reactInternalMemoizedMergedChildContext = e),
      J(Pe),
      J(ke),
      X(ke, e))
    : J(Pe),
    X(Pe, n));
}
var ft = null,
  Jo = !1,
  _l = !1;
function yc(e) {
  ft === null ? (ft = [e]) : ft.push(e);
}
function Ip(e) {
  ((Jo = !0), yc(e));
}
function Ht() {
  if (!_l && ft !== null) {
    _l = !0;
    var e = 0,
      t = H;
    try {
      var n = ft;
      for (H = 1; e < n.length; e++) {
        var r = n[e];
        do r = r(!0);
        while (r !== null);
      }
      ((ft = null), (Jo = !1));
    } catch (o) {
      throw (ft !== null && (ft = ft.slice(e + 1)), Wa(Gi, Ht), o);
    } finally {
      ((H = t), (_l = !1));
    }
  }
  return null;
}
var Sn = [],
  kn = 0,
  Lo = null,
  Mo = 0,
  Be = [],
  be = 0,
  rn = null,
  pt = 1,
  mt = "";
function Yt(e, t) {
  ((Sn[kn++] = Mo), (Sn[kn++] = Lo), (Lo = e), (Mo = t));
}
function xc(e, t, n) {
  ((Be[be++] = pt), (Be[be++] = mt), (Be[be++] = rn), (rn = e));
  var r = pt;
  e = mt;
  var o = 32 - qe(r) - 1;
  ((r &= ~(1 << o)), (n += 1));
  var l = 32 - qe(t) + o;
  if (30 < l) {
    var i = o - (o % 5);
    ((l = (r & ((1 << i) - 1)).toString(32)),
      (r >>= i),
      (o -= i),
      (pt = (1 << (32 - qe(t) + o)) | (n << o) | r),
      (mt = l + e));
  } else ((pt = (1 << l) | (n << o) | r), (mt = e));
}
function ls(e) {
  e.return !== null && (Yt(e, 1), xc(e, 1, 0));
}
function is(e) {
  for (; e === Lo; )
    ((Lo = Sn[--kn]), (Sn[kn] = null), (Mo = Sn[--kn]), (Sn[kn] = null));
  for (; e === rn; )
    ((rn = Be[--be]),
      (Be[be] = null),
      (mt = Be[--be]),
      (Be[be] = null),
      (pt = Be[--be]),
      (Be[be] = null));
}
var Ie = null,
  Ae = null,
  ee = !1,
  Je = null;
function wc(e, t) {
  var n = He(5, null, null, 0);
  ((n.elementType = "DELETED"),
    (n.stateNode = t),
    (n.return = e),
    (t = e.deletions),
    t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n));
}
function Su(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return (
        (t =
          t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase()
            ? null
            : t),
        t !== null
          ? ((e.stateNode = t), (Ie = e), (Ae = Mt(t.firstChild)), !0)
          : !1
      );
    case 6:
      return (
        (t = e.pendingProps === "" || t.nodeType !== 3 ? null : t),
        t !== null ? ((e.stateNode = t), (Ie = e), (Ae = null), !0) : !1
      );
    case 13:
      return (
        (t = t.nodeType !== 8 ? null : t),
        t !== null
          ? ((n = rn !== null ? { id: pt, overflow: mt } : null),
            (e.memoizedState = {
              dehydrated: t,
              treeContext: n,
              retryLane: 1073741824,
            }),
            (n = He(18, null, null, 0)),
            (n.stateNode = t),
            (n.return = e),
            (e.child = n),
            (Ie = e),
            (Ae = null),
            !0)
          : !1
      );
    default:
      return !1;
  }
}
function yi(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function xi(e) {
  if (ee) {
    var t = Ae;
    if (t) {
      var n = t;
      if (!Su(e, t)) {
        if (yi(e)) throw Error(_(418));
        t = Mt(n.nextSibling);
        var r = Ie;
        t && Su(e, t)
          ? wc(r, n)
          : ((e.flags = (e.flags & -4097) | 2), (ee = !1), (Ie = e));
      }
    } else {
      if (yi(e)) throw Error(_(418));
      ((e.flags = (e.flags & -4097) | 2), (ee = !1), (Ie = e));
    }
  }
}
function ku(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; )
    e = e.return;
  Ie = e;
}
function eo(e) {
  if (e !== Ie) return !1;
  if (!ee) return (ku(e), (ee = !0), !1);
  var t;
  if (
    ((t = e.tag !== 3) &&
      !(t = e.tag !== 5) &&
      ((t = e.type),
      (t = t !== "head" && t !== "body" && !mi(e.type, e.memoizedProps))),
    t && (t = Ae))
  ) {
    if (yi(e)) throw (Sc(), Error(_(418)));
    for (; t; ) (wc(e, t), (t = Mt(t.nextSibling)));
  }
  if ((ku(e), e.tag === 13)) {
    if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e))
      throw Error(_(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "/$") {
            if (t === 0) {
              Ae = Mt(e.nextSibling);
              break e;
            }
            t--;
          } else (n !== "$" && n !== "$!" && n !== "$?") || t++;
        }
        e = e.nextSibling;
      }
      Ae = null;
    }
  } else Ae = Ie ? Mt(e.stateNode.nextSibling) : null;
  return !0;
}
function Sc() {
  for (var e = Ae; e; ) e = Mt(e.nextSibling);
}
function An() {
  ((Ae = Ie = null), (ee = !1));
}
function ss(e) {
  Je === null ? (Je = [e]) : Je.push(e);
}
var Dp = St.ReactCurrentBatchConfig;
function Jn(e, t, n) {
  if (
    ((e = n.ref), e !== null && typeof e != "function" && typeof e != "object")
  ) {
    if (n._owner) {
      if (((n = n._owner), n)) {
        if (n.tag !== 1) throw Error(_(309));
        var r = n.stateNode;
      }
      if (!r) throw Error(_(147, e));
      var o = r,
        l = "" + e;
      return t !== null &&
        t.ref !== null &&
        typeof t.ref == "function" &&
        t.ref._stringRef === l
        ? t.ref
        : ((t = function (i) {
            var s = o.refs;
            i === null ? delete s[l] : (s[l] = i);
          }),
          (t._stringRef = l),
          t);
    }
    if (typeof e != "string") throw Error(_(284));
    if (!n._owner) throw Error(_(290, e));
  }
  return e;
}
function to(e, t) {
  throw (
    (e = Object.prototype.toString.call(t)),
    Error(
      _(
        31,
        e === "[object Object]"
          ? "object with keys {" + Object.keys(t).join(", ") + "}"
          : e,
      ),
    )
  );
}
function Cu(e) {
  var t = e._init;
  return t(e._payload);
}
function kc(e) {
  function t(p, d) {
    if (e) {
      var h = p.deletions;
      h === null ? ((p.deletions = [d]), (p.flags |= 16)) : h.push(d);
    }
  }
  function n(p, d) {
    if (!e) return null;
    for (; d !== null; ) (t(p, d), (d = d.sibling));
    return null;
  }
  function r(p, d) {
    for (p = new Map(); d !== null; )
      (d.key !== null ? p.set(d.key, d) : p.set(d.index, d), (d = d.sibling));
    return p;
  }
  function o(p, d) {
    return ((p = Dt(p, d)), (p.index = 0), (p.sibling = null), p);
  }
  function l(p, d, h) {
    return (
      (p.index = h),
      e
        ? ((h = p.alternate),
          h !== null
            ? ((h = h.index), h < d ? ((p.flags |= 2), d) : h)
            : ((p.flags |= 2), d))
        : ((p.flags |= 1048576), d)
    );
  }
  function i(p) {
    return (e && p.alternate === null && (p.flags |= 2), p);
  }
  function s(p, d, h, g) {
    return d === null || d.tag !== 6
      ? ((d = Il(h, p.mode, g)), (d.return = p), d)
      : ((d = o(d, h)), (d.return = p), d);
  }
  function u(p, d, h, g) {
    var S = h.type;
    return S === hn
      ? m(p, d, h.props.children, g, h.key)
      : d !== null &&
          (d.elementType === S ||
            (typeof S == "object" &&
              S !== null &&
              S.$$typeof === Et &&
              Cu(S) === d.type))
        ? ((g = o(d, h.props)), (g.ref = Jn(p, d, h)), (g.return = p), g)
        : ((g = wo(h.type, h.key, h.props, null, p.mode, g)),
          (g.ref = Jn(p, d, h)),
          (g.return = p),
          g);
  }
  function a(p, d, h, g) {
    return d === null ||
      d.tag !== 4 ||
      d.stateNode.containerInfo !== h.containerInfo ||
      d.stateNode.implementation !== h.implementation
      ? ((d = Dl(h, p.mode, g)), (d.return = p), d)
      : ((d = o(d, h.children || [])), (d.return = p), d);
  }
  function m(p, d, h, g, S) {
    return d === null || d.tag !== 7
      ? ((d = tn(h, p.mode, g, S)), (d.return = p), d)
      : ((d = o(d, h)), (d.return = p), d);
  }
  function c(p, d, h) {
    if ((typeof d == "string" && d !== "") || typeof d == "number")
      return ((d = Il("" + d, p.mode, h)), (d.return = p), d);
    if (typeof d == "object" && d !== null) {
      switch (d.$$typeof) {
        case Hr:
          return (
            (h = wo(d.type, d.key, d.props, null, p.mode, h)),
            (h.ref = Jn(p, null, d)),
            (h.return = p),
            h
          );
        case mn:
          return ((d = Dl(d, p.mode, h)), (d.return = p), d);
        case Et:
          var g = d._init;
          return c(p, g(d._payload), h);
      }
      if (rr(d) || Kn(d))
        return ((d = tn(d, p.mode, h, null)), (d.return = p), d);
      to(p, d);
    }
    return null;
  }
  function v(p, d, h, g) {
    var S = d !== null ? d.key : null;
    if ((typeof h == "string" && h !== "") || typeof h == "number")
      return S !== null ? null : s(p, d, "" + h, g);
    if (typeof h == "object" && h !== null) {
      switch (h.$$typeof) {
        case Hr:
          return h.key === S ? u(p, d, h, g) : null;
        case mn:
          return h.key === S ? a(p, d, h, g) : null;
        case Et:
          return ((S = h._init), v(p, d, S(h._payload), g));
      }
      if (rr(h) || Kn(h)) return S !== null ? null : m(p, d, h, g, null);
      to(p, h);
    }
    return null;
  }
  function w(p, d, h, g, S) {
    if ((typeof g == "string" && g !== "") || typeof g == "number")
      return ((p = p.get(h) || null), s(d, p, "" + g, S));
    if (typeof g == "object" && g !== null) {
      switch (g.$$typeof) {
        case Hr:
          return (
            (p = p.get(g.key === null ? h : g.key) || null),
            u(d, p, g, S)
          );
        case mn:
          return (
            (p = p.get(g.key === null ? h : g.key) || null),
            a(d, p, g, S)
          );
        case Et:
          var x = g._init;
          return w(p, d, h, x(g._payload), S);
      }
      if (rr(g) || Kn(g)) return ((p = p.get(h) || null), m(d, p, g, S, null));
      to(d, g);
    }
    return null;
  }
  function C(p, d, h, g) {
    for (
      var S = null, x = null, k = d, j = (d = 0), O = null;
      k !== null && j < h.length;
      j++
    ) {
      k.index > j ? ((O = k), (k = null)) : (O = k.sibling);
      var R = v(p, k, h[j], g);
      if (R === null) {
        k === null && (k = O);
        break;
      }
      (e && k && R.alternate === null && t(p, k),
        (d = l(R, d, j)),
        x === null ? (S = R) : (x.sibling = R),
        (x = R),
        (k = O));
    }
    if (j === h.length) return (n(p, k), ee && Yt(p, j), S);
    if (k === null) {
      for (; j < h.length; j++)
        ((k = c(p, h[j], g)),
          k !== null &&
            ((d = l(k, d, j)),
            x === null ? (S = k) : (x.sibling = k),
            (x = k)));
      return (ee && Yt(p, j), S);
    }
    for (k = r(p, k); j < h.length; j++)
      ((O = w(k, p, j, h[j], g)),
        O !== null &&
          (e && O.alternate !== null && k.delete(O.key === null ? j : O.key),
          (d = l(O, d, j)),
          x === null ? (S = O) : (x.sibling = O),
          (x = O)));
    return (
      e &&
        k.forEach(function (F) {
          return t(p, F);
        }),
      ee && Yt(p, j),
      S
    );
  }
  function y(p, d, h, g) {
    var S = Kn(h);
    if (typeof S != "function") throw Error(_(150));
    if (((h = S.call(h)), h == null)) throw Error(_(151));
    for (
      var x = (S = null), k = d, j = (d = 0), O = null, R = h.next();
      k !== null && !R.done;
      j++, R = h.next()
    ) {
      k.index > j ? ((O = k), (k = null)) : (O = k.sibling);
      var F = v(p, k, R.value, g);
      if (F === null) {
        k === null && (k = O);
        break;
      }
      (e && k && F.alternate === null && t(p, k),
        (d = l(F, d, j)),
        x === null ? (S = F) : (x.sibling = F),
        (x = F),
        (k = O));
    }
    if (R.done) return (n(p, k), ee && Yt(p, j), S);
    if (k === null) {
      for (; !R.done; j++, R = h.next())
        ((R = c(p, R.value, g)),
          R !== null &&
            ((d = l(R, d, j)),
            x === null ? (S = R) : (x.sibling = R),
            (x = R)));
      return (ee && Yt(p, j), S);
    }
    for (k = r(p, k); !R.done; j++, R = h.next())
      ((R = w(k, p, j, R.value, g)),
        R !== null &&
          (e && R.alternate !== null && k.delete(R.key === null ? j : R.key),
          (d = l(R, d, j)),
          x === null ? (S = R) : (x.sibling = R),
          (x = R)));
    return (
      e &&
        k.forEach(function (te) {
          return t(p, te);
        }),
      ee && Yt(p, j),
      S
    );
  }
  function N(p, d, h, g) {
    if (
      (typeof h == "object" &&
        h !== null &&
        h.type === hn &&
        h.key === null &&
        (h = h.props.children),
      typeof h == "object" && h !== null)
    ) {
      switch (h.$$typeof) {
        case Hr:
          e: {
            for (var S = h.key, x = d; x !== null; ) {
              if (x.key === S) {
                if (((S = h.type), S === hn)) {
                  if (x.tag === 7) {
                    (n(p, x.sibling),
                      (d = o(x, h.props.children)),
                      (d.return = p),
                      (p = d));
                    break e;
                  }
                } else if (
                  x.elementType === S ||
                  (typeof S == "object" &&
                    S !== null &&
                    S.$$typeof === Et &&
                    Cu(S) === x.type)
                ) {
                  (n(p, x.sibling),
                    (d = o(x, h.props)),
                    (d.ref = Jn(p, x, h)),
                    (d.return = p),
                    (p = d));
                  break e;
                }
                n(p, x);
                break;
              } else t(p, x);
              x = x.sibling;
            }
            h.type === hn
              ? ((d = tn(h.props.children, p.mode, g, h.key)),
                (d.return = p),
                (p = d))
              : ((g = wo(h.type, h.key, h.props, null, p.mode, g)),
                (g.ref = Jn(p, d, h)),
                (g.return = p),
                (p = g));
          }
          return i(p);
        case mn:
          e: {
            for (x = h.key; d !== null; ) {
              if (d.key === x)
                if (
                  d.tag === 4 &&
                  d.stateNode.containerInfo === h.containerInfo &&
                  d.stateNode.implementation === h.implementation
                ) {
                  (n(p, d.sibling),
                    (d = o(d, h.children || [])),
                    (d.return = p),
                    (p = d));
                  break e;
                } else {
                  n(p, d);
                  break;
                }
              else t(p, d);
              d = d.sibling;
            }
            ((d = Dl(h, p.mode, g)), (d.return = p), (p = d));
          }
          return i(p);
        case Et:
          return ((x = h._init), N(p, d, x(h._payload), g));
      }
      if (rr(h)) return C(p, d, h, g);
      if (Kn(h)) return y(p, d, h, g);
      to(p, h);
    }
    return (typeof h == "string" && h !== "") || typeof h == "number"
      ? ((h = "" + h),
        d !== null && d.tag === 6
          ? (n(p, d.sibling), (d = o(d, h)), (d.return = p), (p = d))
          : (n(p, d), (d = Il(h, p.mode, g)), (d.return = p), (p = d)),
        i(p))
      : n(p, d);
  }
  return N;
}
var In = kc(!0),
  Cc = kc(!1),
  Oo = Wt(null),
  Ao = null,
  Cn = null,
  us = null;
function as() {
  us = Cn = Ao = null;
}
function cs(e) {
  var t = Oo.current;
  (J(Oo), (e._currentValue = t));
}
function wi(e, t, n) {
  for (; e !== null; ) {
    var r = e.alternate;
    if (
      ((e.childLanes & t) !== t
        ? ((e.childLanes |= t), r !== null && (r.childLanes |= t))
        : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t),
      e === n)
    )
      break;
    e = e.return;
  }
}
function zn(e, t) {
  ((Ao = e),
    (us = Cn = null),
    (e = e.dependencies),
    e !== null &&
      e.firstContext !== null &&
      (e.lanes & t && (_e = !0), (e.firstContext = null)));
}
function Qe(e) {
  var t = e._currentValue;
  if (us !== e)
    if (((e = { context: e, memoizedValue: t, next: null }), Cn === null)) {
      if (Ao === null) throw Error(_(308));
      ((Cn = e), (Ao.dependencies = { lanes: 0, firstContext: e }));
    } else Cn = Cn.next = e;
  return t;
}
var Zt = null;
function ds(e) {
  Zt === null ? (Zt = [e]) : Zt.push(e);
}
function Ec(e, t, n, r) {
  var o = t.interleaved;
  return (
    o === null ? ((n.next = n), ds(t)) : ((n.next = o.next), (o.next = n)),
    (t.interleaved = n),
    xt(e, r)
  );
}
function xt(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; )
    ((e.childLanes |= t),
      (n = e.alternate),
      n !== null && (n.childLanes |= t),
      (n = e),
      (e = e.return));
  return n.tag === 3 ? n.stateNode : null;
}
var jt = !1;
function fs(e) {
  e.updateQueue = {
    baseState: e.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: { pending: null, interleaved: null, lanes: 0 },
    effects: null,
  };
}
function jc(e, t) {
  ((e = e.updateQueue),
    t.updateQueue === e &&
      (t.updateQueue = {
        baseState: e.baseState,
        firstBaseUpdate: e.firstBaseUpdate,
        lastBaseUpdate: e.lastBaseUpdate,
        shared: e.shared,
        effects: e.effects,
      }));
}
function gt(e, t) {
  return {
    eventTime: e,
    lane: t,
    tag: 0,
    payload: null,
    callback: null,
    next: null,
  };
}
function Ot(e, t, n) {
  var r = e.updateQueue;
  if (r === null) return null;
  if (((r = r.shared), W & 2)) {
    var o = r.pending;
    return (
      o === null ? (t.next = t) : ((t.next = o.next), (o.next = t)),
      (r.pending = t),
      xt(e, n)
    );
  }
  return (
    (o = r.interleaved),
    o === null ? ((t.next = t), ds(r)) : ((t.next = o.next), (o.next = t)),
    (r.interleaved = t),
    xt(e, n)
  );
}
function mo(e, t, n) {
  if (
    ((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194240) !== 0))
  ) {
    var r = t.lanes;
    ((r &= e.pendingLanes), (n |= r), (t.lanes = n), Zi(e, n));
  }
}
function Eu(e, t) {
  var n = e.updateQueue,
    r = e.alternate;
  if (r !== null && ((r = r.updateQueue), n === r)) {
    var o = null,
      l = null;
    if (((n = n.firstBaseUpdate), n !== null)) {
      do {
        var i = {
          eventTime: n.eventTime,
          lane: n.lane,
          tag: n.tag,
          payload: n.payload,
          callback: n.callback,
          next: null,
        };
        (l === null ? (o = l = i) : (l = l.next = i), (n = n.next));
      } while (n !== null);
      l === null ? (o = l = t) : (l = l.next = t);
    } else o = l = t;
    ((n = {
      baseState: r.baseState,
      firstBaseUpdate: o,
      lastBaseUpdate: l,
      shared: r.shared,
      effects: r.effects,
    }),
      (e.updateQueue = n));
    return;
  }
  ((e = n.lastBaseUpdate),
    e === null ? (n.firstBaseUpdate = t) : (e.next = t),
    (n.lastBaseUpdate = t));
}
function Io(e, t, n, r) {
  var o = e.updateQueue;
  jt = !1;
  var l = o.firstBaseUpdate,
    i = o.lastBaseUpdate,
    s = o.shared.pending;
  if (s !== null) {
    o.shared.pending = null;
    var u = s,
      a = u.next;
    ((u.next = null), i === null ? (l = a) : (i.next = a), (i = u));
    var m = e.alternate;
    m !== null &&
      ((m = m.updateQueue),
      (s = m.lastBaseUpdate),
      s !== i &&
        (s === null ? (m.firstBaseUpdate = a) : (s.next = a),
        (m.lastBaseUpdate = u)));
  }
  if (l !== null) {
    var c = o.baseState;
    ((i = 0), (m = a = u = null), (s = l));
    do {
      var v = s.lane,
        w = s.eventTime;
      if ((r & v) === v) {
        m !== null &&
          (m = m.next =
            {
              eventTime: w,
              lane: 0,
              tag: s.tag,
              payload: s.payload,
              callback: s.callback,
              next: null,
            });
        e: {
          var C = e,
            y = s;
          switch (((v = t), (w = n), y.tag)) {
            case 1:
              if (((C = y.payload), typeof C == "function")) {
                c = C.call(w, c, v);
                break e;
              }
              c = C;
              break e;
            case 3:
              C.flags = (C.flags & -65537) | 128;
            case 0:
              if (
                ((C = y.payload),
                (v = typeof C == "function" ? C.call(w, c, v) : C),
                v == null)
              )
                break e;
              c = le({}, c, v);
              break e;
            case 2:
              jt = !0;
          }
        }
        s.callback !== null &&
          s.lane !== 0 &&
          ((e.flags |= 64),
          (v = o.effects),
          v === null ? (o.effects = [s]) : v.push(s));
      } else
        ((w = {
          eventTime: w,
          lane: v,
          tag: s.tag,
          payload: s.payload,
          callback: s.callback,
          next: null,
        }),
          m === null ? ((a = m = w), (u = c)) : (m = m.next = w),
          (i |= v));
      if (((s = s.next), s === null)) {
        if (((s = o.shared.pending), s === null)) break;
        ((v = s),
          (s = v.next),
          (v.next = null),
          (o.lastBaseUpdate = v),
          (o.shared.pending = null));
      }
    } while (!0);
    if (
      (m === null && (u = c),
      (o.baseState = u),
      (o.firstBaseUpdate = a),
      (o.lastBaseUpdate = m),
      (t = o.shared.interleaved),
      t !== null)
    ) {
      o = t;
      do ((i |= o.lane), (o = o.next));
      while (o !== t);
    } else l === null && (o.shared.lanes = 0);
    ((ln |= i), (e.lanes = i), (e.memoizedState = c));
  }
}
function ju(e, t, n) {
  if (((e = t.effects), (t.effects = null), e !== null))
    for (t = 0; t < e.length; t++) {
      var r = e[t],
        o = r.callback;
      if (o !== null) {
        if (((r.callback = null), (r = n), typeof o != "function"))
          throw Error(_(191, o));
        o.call(r);
      }
    }
}
var Ur = {},
  at = Wt(Ur),
  Nr = Wt(Ur),
  _r = Wt(Ur);
function Jt(e) {
  if (e === Ur) throw Error(_(174));
  return e;
}
function ps(e, t) {
  switch ((X(_r, t), X(Nr, e), X(at, Ur), (e = t.nodeType), e)) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : ei(null, "");
      break;
    default:
      ((e = e === 8 ? t.parentNode : t),
        (t = e.namespaceURI || null),
        (e = e.tagName),
        (t = ei(t, e)));
  }
  (J(at), X(at, t));
}
function Dn() {
  (J(at), J(Nr), J(_r));
}
function Rc(e) {
  Jt(_r.current);
  var t = Jt(at.current),
    n = ei(t, e.type);
  t !== n && (X(Nr, e), X(at, n));
}
function ms(e) {
  Nr.current === e && (J(at), J(Nr));
}
var re = Wt(0);
function Do(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var n = t.memoizedState;
      if (
        n !== null &&
        ((n = n.dehydrated), n === null || n.data === "$?" || n.data === "$!")
      )
        return t;
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
      if (t.flags & 128) return t;
    } else if (t.child !== null) {
      ((t.child.return = t), (t = t.child));
      continue;
    }
    if (t === e) break;
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e) return null;
      t = t.return;
    }
    ((t.sibling.return = t.return), (t = t.sibling));
  }
  return null;
}
var Pl = [];
function hs() {
  for (var e = 0; e < Pl.length; e++)
    Pl[e]._workInProgressVersionPrimary = null;
  Pl.length = 0;
}
var ho = St.ReactCurrentDispatcher,
  zl = St.ReactCurrentBatchConfig,
  on = 0,
  oe = null,
  fe = null,
  me = null,
  $o = !1,
  fr = !1,
  Pr = 0,
  $p = 0;
function xe() {
  throw Error(_(321));
}
function gs(e, t) {
  if (t === null) return !1;
  for (var n = 0; n < t.length && n < e.length; n++)
    if (!tt(e[n], t[n])) return !1;
  return !0;
}
function vs(e, t, n, r, o, l) {
  if (
    ((on = l),
    (oe = t),
    (t.memoizedState = null),
    (t.updateQueue = null),
    (t.lanes = 0),
    (ho.current = e === null || e.memoizedState === null ? bp : Wp),
    (e = n(r, o)),
    fr)
  ) {
    l = 0;
    do {
      if (((fr = !1), (Pr = 0), 25 <= l)) throw Error(_(301));
      ((l += 1),
        (me = fe = null),
        (t.updateQueue = null),
        (ho.current = Hp),
        (e = n(r, o)));
    } while (fr);
  }
  if (
    ((ho.current = Fo),
    (t = fe !== null && fe.next !== null),
    (on = 0),
    (me = fe = oe = null),
    ($o = !1),
    t)
  )
    throw Error(_(300));
  return e;
}
function ys() {
  var e = Pr !== 0;
  return ((Pr = 0), e);
}
function lt() {
  var e = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
  return (me === null ? (oe.memoizedState = me = e) : (me = me.next = e), me);
}
function Ke() {
  if (fe === null) {
    var e = oe.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = fe.next;
  var t = me === null ? oe.memoizedState : me.next;
  if (t !== null) ((me = t), (fe = e));
  else {
    if (e === null) throw Error(_(310));
    ((fe = e),
      (e = {
        memoizedState: fe.memoizedState,
        baseState: fe.baseState,
        baseQueue: fe.baseQueue,
        queue: fe.queue,
        next: null,
      }),
      me === null ? (oe.memoizedState = me = e) : (me = me.next = e));
  }
  return me;
}
function zr(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function Ll(e) {
  var t = Ke(),
    n = t.queue;
  if (n === null) throw Error(_(311));
  n.lastRenderedReducer = e;
  var r = fe,
    o = r.baseQueue,
    l = n.pending;
  if (l !== null) {
    if (o !== null) {
      var i = o.next;
      ((o.next = l.next), (l.next = i));
    }
    ((r.baseQueue = o = l), (n.pending = null));
  }
  if (o !== null) {
    ((l = o.next), (r = r.baseState));
    var s = (i = null),
      u = null,
      a = l;
    do {
      var m = a.lane;
      if ((on & m) === m)
        (u !== null &&
          (u = u.next =
            {
              lane: 0,
              action: a.action,
              hasEagerState: a.hasEagerState,
              eagerState: a.eagerState,
              next: null,
            }),
          (r = a.hasEagerState ? a.eagerState : e(r, a.action)));
      else {
        var c = {
          lane: m,
          action: a.action,
          hasEagerState: a.hasEagerState,
          eagerState: a.eagerState,
          next: null,
        };
        (u === null ? ((s = u = c), (i = r)) : (u = u.next = c),
          (oe.lanes |= m),
          (ln |= m));
      }
      a = a.next;
    } while (a !== null && a !== l);
    (u === null ? (i = r) : (u.next = s),
      tt(r, t.memoizedState) || (_e = !0),
      (t.memoizedState = r),
      (t.baseState = i),
      (t.baseQueue = u),
      (n.lastRenderedState = r));
  }
  if (((e = n.interleaved), e !== null)) {
    o = e;
    do ((l = o.lane), (oe.lanes |= l), (ln |= l), (o = o.next));
    while (o !== e);
  } else o === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function Ml(e) {
  var t = Ke(),
    n = t.queue;
  if (n === null) throw Error(_(311));
  n.lastRenderedReducer = e;
  var r = n.dispatch,
    o = n.pending,
    l = t.memoizedState;
  if (o !== null) {
    n.pending = null;
    var i = (o = o.next);
    do ((l = e(l, i.action)), (i = i.next));
    while (i !== o);
    (tt(l, t.memoizedState) || (_e = !0),
      (t.memoizedState = l),
      t.baseQueue === null && (t.baseState = l),
      (n.lastRenderedState = l));
  }
  return [l, r];
}
function Tc() {}
function Nc(e, t) {
  var n = oe,
    r = Ke(),
    o = t(),
    l = !tt(r.memoizedState, o);
  if (
    (l && ((r.memoizedState = o), (_e = !0)),
    (r = r.queue),
    xs(zc.bind(null, n, r, e), [e]),
    r.getSnapshot !== t || l || (me !== null && me.memoizedState.tag & 1))
  ) {
    if (
      ((n.flags |= 2048),
      Lr(9, Pc.bind(null, n, r, o, t), void 0, null),
      he === null)
    )
      throw Error(_(349));
    on & 30 || _c(n, t, o);
  }
  return o;
}
function _c(e, t, n) {
  ((e.flags |= 16384),
    (e = { getSnapshot: t, value: n }),
    (t = oe.updateQueue),
    t === null
      ? ((t = { lastEffect: null, stores: null }),
        (oe.updateQueue = t),
        (t.stores = [e]))
      : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
}
function Pc(e, t, n, r) {
  ((t.value = n), (t.getSnapshot = r), Lc(t) && Mc(e));
}
function zc(e, t, n) {
  return n(function () {
    Lc(t) && Mc(e);
  });
}
function Lc(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !tt(e, n);
  } catch {
    return !0;
  }
}
function Mc(e) {
  var t = xt(e, 1);
  t !== null && et(t, e, 1, -1);
}
function Ru(e) {
  var t = lt();
  return (
    typeof e == "function" && (e = e()),
    (t.memoizedState = t.baseState = e),
    (e = {
      pending: null,
      interleaved: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: zr,
      lastRenderedState: e,
    }),
    (t.queue = e),
    (e = e.dispatch = Bp.bind(null, oe, e)),
    [t.memoizedState, e]
  );
}
function Lr(e, t, n, r) {
  return (
    (e = { tag: e, create: t, destroy: n, deps: r, next: null }),
    (t = oe.updateQueue),
    t === null
      ? ((t = { lastEffect: null, stores: null }),
        (oe.updateQueue = t),
        (t.lastEffect = e.next = e))
      : ((n = t.lastEffect),
        n === null
          ? (t.lastEffect = e.next = e)
          : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e))),
    e
  );
}
function Oc() {
  return Ke().memoizedState;
}
function go(e, t, n, r) {
  var o = lt();
  ((oe.flags |= e),
    (o.memoizedState = Lr(1 | t, n, void 0, r === void 0 ? null : r)));
}
function qo(e, t, n, r) {
  var o = Ke();
  r = r === void 0 ? null : r;
  var l = void 0;
  if (fe !== null) {
    var i = fe.memoizedState;
    if (((l = i.destroy), r !== null && gs(r, i.deps))) {
      o.memoizedState = Lr(t, n, l, r);
      return;
    }
  }
  ((oe.flags |= e), (o.memoizedState = Lr(1 | t, n, l, r)));
}
function Tu(e, t) {
  return go(8390656, 8, e, t);
}
function xs(e, t) {
  return qo(2048, 8, e, t);
}
function Ac(e, t) {
  return qo(4, 2, e, t);
}
function Ic(e, t) {
  return qo(4, 4, e, t);
}
function Dc(e, t) {
  if (typeof t == "function")
    return (
      (e = e()),
      t(e),
      function () {
        t(null);
      }
    );
  if (t != null)
    return (
      (e = e()),
      (t.current = e),
      function () {
        t.current = null;
      }
    );
}
function $c(e, t, n) {
  return (
    (n = n != null ? n.concat([e]) : null),
    qo(4, 4, Dc.bind(null, t, e), n)
  );
}
function ws() {}
function Fc(e, t) {
  var n = Ke();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && gs(t, r[1])
    ? r[0]
    : ((n.memoizedState = [e, t]), e);
}
function Uc(e, t) {
  var n = Ke();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && gs(t, r[1])
    ? r[0]
    : ((e = e()), (n.memoizedState = [e, t]), e);
}
function Bc(e, t, n) {
  return on & 21
    ? (tt(n, t) || ((n = Qa()), (oe.lanes |= n), (ln |= n), (e.baseState = !0)),
      t)
    : (e.baseState && ((e.baseState = !1), (_e = !0)), (e.memoizedState = n));
}
function Fp(e, t) {
  var n = H;
  ((H = n !== 0 && 4 > n ? n : 4), e(!0));
  var r = zl.transition;
  zl.transition = {};
  try {
    (e(!1), t());
  } finally {
    ((H = n), (zl.transition = r));
  }
}
function bc() {
  return Ke().memoizedState;
}
function Up(e, t, n) {
  var r = It(e);
  if (
    ((n = {
      lane: r,
      action: n,
      hasEagerState: !1,
      eagerState: null,
      next: null,
    }),
    Wc(e))
  )
    Hc(t, n);
  else if (((n = Ec(e, t, n, r)), n !== null)) {
    var o = je();
    (et(n, e, r, o), Vc(n, t, r));
  }
}
function Bp(e, t, n) {
  var r = It(e),
    o = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (Wc(e)) Hc(t, o);
  else {
    var l = e.alternate;
    if (
      e.lanes === 0 &&
      (l === null || l.lanes === 0) &&
      ((l = t.lastRenderedReducer), l !== null)
    )
      try {
        var i = t.lastRenderedState,
          s = l(i, n);
        if (((o.hasEagerState = !0), (o.eagerState = s), tt(s, i))) {
          var u = t.interleaved;
          (u === null
            ? ((o.next = o), ds(t))
            : ((o.next = u.next), (u.next = o)),
            (t.interleaved = o));
          return;
        }
      } catch {
      } finally {
      }
    ((n = Ec(e, t, o, r)),
      n !== null && ((o = je()), et(n, e, r, o), Vc(n, t, r)));
  }
}
function Wc(e) {
  var t = e.alternate;
  return e === oe || (t !== null && t === oe);
}
function Hc(e, t) {
  fr = $o = !0;
  var n = e.pending;
  (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)),
    (e.pending = t));
}
function Vc(e, t, n) {
  if (n & 4194240) {
    var r = t.lanes;
    ((r &= e.pendingLanes), (n |= r), (t.lanes = n), Zi(e, n));
  }
}
var Fo = {
    readContext: Qe,
    useCallback: xe,
    useContext: xe,
    useEffect: xe,
    useImperativeHandle: xe,
    useInsertionEffect: xe,
    useLayoutEffect: xe,
    useMemo: xe,
    useReducer: xe,
    useRef: xe,
    useState: xe,
    useDebugValue: xe,
    useDeferredValue: xe,
    useTransition: xe,
    useMutableSource: xe,
    useSyncExternalStore: xe,
    useId: xe,
    unstable_isNewReconciler: !1,
  },
  bp = {
    readContext: Qe,
    useCallback: function (e, t) {
      return ((lt().memoizedState = [e, t === void 0 ? null : t]), e);
    },
    useContext: Qe,
    useEffect: Tu,
    useImperativeHandle: function (e, t, n) {
      return (
        (n = n != null ? n.concat([e]) : null),
        go(4194308, 4, Dc.bind(null, t, e), n)
      );
    },
    useLayoutEffect: function (e, t) {
      return go(4194308, 4, e, t);
    },
    useInsertionEffect: function (e, t) {
      return go(4, 2, e, t);
    },
    useMemo: function (e, t) {
      var n = lt();
      return (
        (t = t === void 0 ? null : t),
        (e = e()),
        (n.memoizedState = [e, t]),
        e
      );
    },
    useReducer: function (e, t, n) {
      var r = lt();
      return (
        (t = n !== void 0 ? n(t) : t),
        (r.memoizedState = r.baseState = t),
        (e = {
          pending: null,
          interleaved: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: e,
          lastRenderedState: t,
        }),
        (r.queue = e),
        (e = e.dispatch = Up.bind(null, oe, e)),
        [r.memoizedState, e]
      );
    },
    useRef: function (e) {
      var t = lt();
      return ((e = { current: e }), (t.memoizedState = e));
    },
    useState: Ru,
    useDebugValue: ws,
    useDeferredValue: function (e) {
      return (lt().memoizedState = e);
    },
    useTransition: function () {
      var e = Ru(!1),
        t = e[0];
      return ((e = Fp.bind(null, e[1])), (lt().memoizedState = e), [t, e]);
    },
    useMutableSource: function () {},
    useSyncExternalStore: function (e, t, n) {
      var r = oe,
        o = lt();
      if (ee) {
        if (n === void 0) throw Error(_(407));
        n = n();
      } else {
        if (((n = t()), he === null)) throw Error(_(349));
        on & 30 || _c(r, t, n);
      }
      o.memoizedState = n;
      var l = { value: n, getSnapshot: t };
      return (
        (o.queue = l),
        Tu(zc.bind(null, r, l, e), [e]),
        (r.flags |= 2048),
        Lr(9, Pc.bind(null, r, l, n, t), void 0, null),
        n
      );
    },
    useId: function () {
      var e = lt(),
        t = he.identifierPrefix;
      if (ee) {
        var n = mt,
          r = pt;
        ((n = (r & ~(1 << (32 - qe(r) - 1))).toString(32) + n),
          (t = ":" + t + "R" + n),
          (n = Pr++),
          0 < n && (t += "H" + n.toString(32)),
          (t += ":"));
      } else ((n = $p++), (t = ":" + t + "r" + n.toString(32) + ":"));
      return (e.memoizedState = t);
    },
    unstable_isNewReconciler: !1,
  },
  Wp = {
    readContext: Qe,
    useCallback: Fc,
    useContext: Qe,
    useEffect: xs,
    useImperativeHandle: $c,
    useInsertionEffect: Ac,
    useLayoutEffect: Ic,
    useMemo: Uc,
    useReducer: Ll,
    useRef: Oc,
    useState: function () {
      return Ll(zr);
    },
    useDebugValue: ws,
    useDeferredValue: function (e) {
      var t = Ke();
      return Bc(t, fe.memoizedState, e);
    },
    useTransition: function () {
      var e = Ll(zr)[0],
        t = Ke().memoizedState;
      return [e, t];
    },
    useMutableSource: Tc,
    useSyncExternalStore: Nc,
    useId: bc,
    unstable_isNewReconciler: !1,
  },
  Hp = {
    readContext: Qe,
    useCallback: Fc,
    useContext: Qe,
    useEffect: xs,
    useImperativeHandle: $c,
    useInsertionEffect: Ac,
    useLayoutEffect: Ic,
    useMemo: Uc,
    useReducer: Ml,
    useRef: Oc,
    useState: function () {
      return Ml(zr);
    },
    useDebugValue: ws,
    useDeferredValue: function (e) {
      var t = Ke();
      return fe === null ? (t.memoizedState = e) : Bc(t, fe.memoizedState, e);
    },
    useTransition: function () {
      var e = Ml(zr)[0],
        t = Ke().memoizedState;
      return [e, t];
    },
    useMutableSource: Tc,
    useSyncExternalStore: Nc,
    useId: bc,
    unstable_isNewReconciler: !1,
  };
function Ge(e, t) {
  if (e && e.defaultProps) {
    ((t = le({}, t)), (e = e.defaultProps));
    for (var n in e) t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
function Si(e, t, n, r) {
  ((t = e.memoizedState),
    (n = n(r, t)),
    (n = n == null ? t : le({}, t, n)),
    (e.memoizedState = n),
    e.lanes === 0 && (e.updateQueue.baseState = n));
}
var el = {
  isMounted: function (e) {
    return (e = e._reactInternals) ? an(e) === e : !1;
  },
  enqueueSetState: function (e, t, n) {
    e = e._reactInternals;
    var r = je(),
      o = It(e),
      l = gt(r, o);
    ((l.payload = t),
      n != null && (l.callback = n),
      (t = Ot(e, l, o)),
      t !== null && (et(t, e, o, r), mo(t, e, o)));
  },
  enqueueReplaceState: function (e, t, n) {
    e = e._reactInternals;
    var r = je(),
      o = It(e),
      l = gt(r, o);
    ((l.tag = 1),
      (l.payload = t),
      n != null && (l.callback = n),
      (t = Ot(e, l, o)),
      t !== null && (et(t, e, o, r), mo(t, e, o)));
  },
  enqueueForceUpdate: function (e, t) {
    e = e._reactInternals;
    var n = je(),
      r = It(e),
      o = gt(n, r);
    ((o.tag = 2),
      t != null && (o.callback = t),
      (t = Ot(e, o, r)),
      t !== null && (et(t, e, r, n), mo(t, e, r)));
  },
};
function Nu(e, t, n, r, o, l, i) {
  return (
    (e = e.stateNode),
    typeof e.shouldComponentUpdate == "function"
      ? e.shouldComponentUpdate(r, l, i)
      : t.prototype && t.prototype.isPureReactComponent
        ? !Er(n, r) || !Er(o, l)
        : !0
  );
}
function Qc(e, t, n) {
  var r = !1,
    o = Bt,
    l = t.contextType;
  return (
    typeof l == "object" && l !== null
      ? (l = Qe(l))
      : ((o = ze(t) ? nn : ke.current),
        (r = t.contextTypes),
        (l = (r = r != null) ? On(e, o) : Bt)),
    (t = new t(n, l)),
    (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
    (t.updater = el),
    (e.stateNode = t),
    (t._reactInternals = e),
    r &&
      ((e = e.stateNode),
      (e.__reactInternalMemoizedUnmaskedChildContext = o),
      (e.__reactInternalMemoizedMaskedChildContext = l)),
    t
  );
}
function _u(e, t, n, r) {
  ((e = t.state),
    typeof t.componentWillReceiveProps == "function" &&
      t.componentWillReceiveProps(n, r),
    typeof t.UNSAFE_componentWillReceiveProps == "function" &&
      t.UNSAFE_componentWillReceiveProps(n, r),
    t.state !== e && el.enqueueReplaceState(t, t.state, null));
}
function ki(e, t, n, r) {
  var o = e.stateNode;
  ((o.props = n), (o.state = e.memoizedState), (o.refs = {}), fs(e));
  var l = t.contextType;
  (typeof l == "object" && l !== null
    ? (o.context = Qe(l))
    : ((l = ze(t) ? nn : ke.current), (o.context = On(e, l))),
    (o.state = e.memoizedState),
    (l = t.getDerivedStateFromProps),
    typeof l == "function" && (Si(e, t, l, n), (o.state = e.memoizedState)),
    typeof t.getDerivedStateFromProps == "function" ||
      typeof o.getSnapshotBeforeUpdate == "function" ||
      (typeof o.UNSAFE_componentWillMount != "function" &&
        typeof o.componentWillMount != "function") ||
      ((t = o.state),
      typeof o.componentWillMount == "function" && o.componentWillMount(),
      typeof o.UNSAFE_componentWillMount == "function" &&
        o.UNSAFE_componentWillMount(),
      t !== o.state && el.enqueueReplaceState(o, o.state, null),
      Io(e, n, o, r),
      (o.state = e.memoizedState)),
    typeof o.componentDidMount == "function" && (e.flags |= 4194308));
}
function $n(e, t) {
  try {
    var n = "",
      r = t;
    do ((n += yf(r)), (r = r.return));
    while (r);
    var o = n;
  } catch (l) {
    o =
      `
Error generating stack: ` +
      l.message +
      `
` +
      l.stack;
  }
  return { value: e, source: t, stack: o, digest: null };
}
function Ol(e, t, n) {
  return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function Ci(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function () {
      throw n;
    });
  }
}
var Vp = typeof WeakMap == "function" ? WeakMap : Map;
function Kc(e, t, n) {
  ((n = gt(-1, n)), (n.tag = 3), (n.payload = { element: null }));
  var r = t.value;
  return (
    (n.callback = function () {
      (Bo || ((Bo = !0), (Mi = r)), Ci(e, t));
    }),
    n
  );
}
function Yc(e, t, n) {
  ((n = gt(-1, n)), (n.tag = 3));
  var r = e.type.getDerivedStateFromError;
  if (typeof r == "function") {
    var o = t.value;
    ((n.payload = function () {
      return r(o);
    }),
      (n.callback = function () {
        Ci(e, t);
      }));
  }
  var l = e.stateNode;
  return (
    l !== null &&
      typeof l.componentDidCatch == "function" &&
      (n.callback = function () {
        (Ci(e, t),
          typeof r != "function" &&
            (At === null ? (At = new Set([this])) : At.add(this)));
        var i = t.stack;
        this.componentDidCatch(t.value, {
          componentStack: i !== null ? i : "",
        });
      }),
    n
  );
}
function Pu(e, t, n) {
  var r = e.pingCache;
  if (r === null) {
    r = e.pingCache = new Vp();
    var o = new Set();
    r.set(t, o);
  } else ((o = r.get(t)), o === void 0 && ((o = new Set()), r.set(t, o)));
  o.has(n) || (o.add(n), (e = lm.bind(null, e, t, n)), t.then(e, e));
}
function zu(e) {
  do {
    var t;
    if (
      ((t = e.tag === 13) &&
        ((t = e.memoizedState), (t = t !== null ? t.dehydrated !== null : !0)),
      t)
    )
      return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Lu(e, t, n, r, o) {
  return e.mode & 1
    ? ((e.flags |= 65536), (e.lanes = o), e)
    : (e === t
        ? (e.flags |= 65536)
        : ((e.flags |= 128),
          (n.flags |= 131072),
          (n.flags &= -52805),
          n.tag === 1 &&
            (n.alternate === null
              ? (n.tag = 17)
              : ((t = gt(-1, 1)), (t.tag = 2), Ot(n, t, 1))),
          (n.lanes |= 1)),
      e);
}
var Qp = St.ReactCurrentOwner,
  _e = !1;
function Ee(e, t, n, r) {
  t.child = e === null ? Cc(t, null, n, r) : In(t, e.child, n, r);
}
function Mu(e, t, n, r, o) {
  n = n.render;
  var l = t.ref;
  return (
    zn(t, o),
    (r = vs(e, t, n, r, l, o)),
    (n = ys()),
    e !== null && !_e
      ? ((t.updateQueue = e.updateQueue),
        (t.flags &= -2053),
        (e.lanes &= ~o),
        wt(e, t, o))
      : (ee && n && ls(t), (t.flags |= 1), Ee(e, t, r, o), t.child)
  );
}
function Ou(e, t, n, r, o) {
  if (e === null) {
    var l = n.type;
    return typeof l == "function" &&
      !Ns(l) &&
      l.defaultProps === void 0 &&
      n.compare === null &&
      n.defaultProps === void 0
      ? ((t.tag = 15), (t.type = l), Xc(e, t, l, r, o))
      : ((e = wo(n.type, null, r, t, t.mode, o)),
        (e.ref = t.ref),
        (e.return = t),
        (t.child = e));
  }
  if (((l = e.child), !(e.lanes & o))) {
    var i = l.memoizedProps;
    if (
      ((n = n.compare), (n = n !== null ? n : Er), n(i, r) && e.ref === t.ref)
    )
      return wt(e, t, o);
  }
  return (
    (t.flags |= 1),
    (e = Dt(l, r)),
    (e.ref = t.ref),
    (e.return = t),
    (t.child = e)
  );
}
function Xc(e, t, n, r, o) {
  if (e !== null) {
    var l = e.memoizedProps;
    if (Er(l, r) && e.ref === t.ref)
      if (((_e = !1), (t.pendingProps = r = l), (e.lanes & o) !== 0))
        e.flags & 131072 && (_e = !0);
      else return ((t.lanes = e.lanes), wt(e, t, o));
  }
  return Ei(e, t, n, r, o);
}
function Gc(e, t, n) {
  var r = t.pendingProps,
    o = r.children,
    l = e !== null ? e.memoizedState : null;
  if (r.mode === "hidden")
    if (!(t.mode & 1))
      ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
        X(jn, Me),
        (Me |= n));
    else {
      if (!(n & 1073741824))
        return (
          (e = l !== null ? l.baseLanes | n : n),
          (t.lanes = t.childLanes = 1073741824),
          (t.memoizedState = {
            baseLanes: e,
            cachePool: null,
            transitions: null,
          }),
          (t.updateQueue = null),
          X(jn, Me),
          (Me |= e),
          null
        );
      ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
        (r = l !== null ? l.baseLanes : n),
        X(jn, Me),
        (Me |= r));
    }
  else
    (l !== null ? ((r = l.baseLanes | n), (t.memoizedState = null)) : (r = n),
      X(jn, Me),
      (Me |= r));
  return (Ee(e, t, o, n), t.child);
}
function Zc(e, t) {
  var n = t.ref;
  ((e === null && n !== null) || (e !== null && e.ref !== n)) &&
    ((t.flags |= 512), (t.flags |= 2097152));
}
function Ei(e, t, n, r, o) {
  var l = ze(n) ? nn : ke.current;
  return (
    (l = On(t, l)),
    zn(t, o),
    (n = vs(e, t, n, r, l, o)),
    (r = ys()),
    e !== null && !_e
      ? ((t.updateQueue = e.updateQueue),
        (t.flags &= -2053),
        (e.lanes &= ~o),
        wt(e, t, o))
      : (ee && r && ls(t), (t.flags |= 1), Ee(e, t, n, o), t.child)
  );
}
function Au(e, t, n, r, o) {
  if (ze(n)) {
    var l = !0;
    zo(t);
  } else l = !1;
  if ((zn(t, o), t.stateNode === null))
    (vo(e, t), Qc(t, n, r), ki(t, n, r, o), (r = !0));
  else if (e === null) {
    var i = t.stateNode,
      s = t.memoizedProps;
    i.props = s;
    var u = i.context,
      a = n.contextType;
    typeof a == "object" && a !== null
      ? (a = Qe(a))
      : ((a = ze(n) ? nn : ke.current), (a = On(t, a)));
    var m = n.getDerivedStateFromProps,
      c =
        typeof m == "function" ||
        typeof i.getSnapshotBeforeUpdate == "function";
    (c ||
      (typeof i.UNSAFE_componentWillReceiveProps != "function" &&
        typeof i.componentWillReceiveProps != "function") ||
      ((s !== r || u !== a) && _u(t, i, r, a)),
      (jt = !1));
    var v = t.memoizedState;
    ((i.state = v),
      Io(t, r, i, o),
      (u = t.memoizedState),
      s !== r || v !== u || Pe.current || jt
        ? (typeof m == "function" && (Si(t, n, m, r), (u = t.memoizedState)),
          (s = jt || Nu(t, n, s, r, v, u, a))
            ? (c ||
                (typeof i.UNSAFE_componentWillMount != "function" &&
                  typeof i.componentWillMount != "function") ||
                (typeof i.componentWillMount == "function" &&
                  i.componentWillMount(),
                typeof i.UNSAFE_componentWillMount == "function" &&
                  i.UNSAFE_componentWillMount()),
              typeof i.componentDidMount == "function" && (t.flags |= 4194308))
            : (typeof i.componentDidMount == "function" && (t.flags |= 4194308),
              (t.memoizedProps = r),
              (t.memoizedState = u)),
          (i.props = r),
          (i.state = u),
          (i.context = a),
          (r = s))
        : (typeof i.componentDidMount == "function" && (t.flags |= 4194308),
          (r = !1)));
  } else {
    ((i = t.stateNode),
      jc(e, t),
      (s = t.memoizedProps),
      (a = t.type === t.elementType ? s : Ge(t.type, s)),
      (i.props = a),
      (c = t.pendingProps),
      (v = i.context),
      (u = n.contextType),
      typeof u == "object" && u !== null
        ? (u = Qe(u))
        : ((u = ze(n) ? nn : ke.current), (u = On(t, u))));
    var w = n.getDerivedStateFromProps;
    ((m =
      typeof w == "function" ||
      typeof i.getSnapshotBeforeUpdate == "function") ||
      (typeof i.UNSAFE_componentWillReceiveProps != "function" &&
        typeof i.componentWillReceiveProps != "function") ||
      ((s !== c || v !== u) && _u(t, i, r, u)),
      (jt = !1),
      (v = t.memoizedState),
      (i.state = v),
      Io(t, r, i, o));
    var C = t.memoizedState;
    s !== c || v !== C || Pe.current || jt
      ? (typeof w == "function" && (Si(t, n, w, r), (C = t.memoizedState)),
        (a = jt || Nu(t, n, a, r, v, C, u) || !1)
          ? (m ||
              (typeof i.UNSAFE_componentWillUpdate != "function" &&
                typeof i.componentWillUpdate != "function") ||
              (typeof i.componentWillUpdate == "function" &&
                i.componentWillUpdate(r, C, u),
              typeof i.UNSAFE_componentWillUpdate == "function" &&
                i.UNSAFE_componentWillUpdate(r, C, u)),
            typeof i.componentDidUpdate == "function" && (t.flags |= 4),
            typeof i.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024))
          : (typeof i.componentDidUpdate != "function" ||
              (s === e.memoizedProps && v === e.memoizedState) ||
              (t.flags |= 4),
            typeof i.getSnapshotBeforeUpdate != "function" ||
              (s === e.memoizedProps && v === e.memoizedState) ||
              (t.flags |= 1024),
            (t.memoizedProps = r),
            (t.memoizedState = C)),
        (i.props = r),
        (i.state = C),
        (i.context = u),
        (r = a))
      : (typeof i.componentDidUpdate != "function" ||
          (s === e.memoizedProps && v === e.memoizedState) ||
          (t.flags |= 4),
        typeof i.getSnapshotBeforeUpdate != "function" ||
          (s === e.memoizedProps && v === e.memoizedState) ||
          (t.flags |= 1024),
        (r = !1));
  }
  return ji(e, t, n, r, l, o);
}
function ji(e, t, n, r, o, l) {
  Zc(e, t);
  var i = (t.flags & 128) !== 0;
  if (!r && !i) return (o && wu(t, n, !1), wt(e, t, l));
  ((r = t.stateNode), (Qp.current = t));
  var s =
    i && typeof n.getDerivedStateFromError != "function" ? null : r.render();
  return (
    (t.flags |= 1),
    e !== null && i
      ? ((t.child = In(t, e.child, null, l)), (t.child = In(t, null, s, l)))
      : Ee(e, t, s, l),
    (t.memoizedState = r.state),
    o && wu(t, n, !0),
    t.child
  );
}
function Jc(e) {
  var t = e.stateNode;
  (t.pendingContext
    ? xu(e, t.pendingContext, t.pendingContext !== t.context)
    : t.context && xu(e, t.context, !1),
    ps(e, t.containerInfo));
}
function Iu(e, t, n, r, o) {
  return (An(), ss(o), (t.flags |= 256), Ee(e, t, n, r), t.child);
}
var Ri = { dehydrated: null, treeContext: null, retryLane: 0 };
function Ti(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function qc(e, t, n) {
  var r = t.pendingProps,
    o = re.current,
    l = !1,
    i = (t.flags & 128) !== 0,
    s;
  if (
    ((s = i) ||
      (s = e !== null && e.memoizedState === null ? !1 : (o & 2) !== 0),
    s
      ? ((l = !0), (t.flags &= -129))
      : (e === null || e.memoizedState !== null) && (o |= 1),
    X(re, o & 1),
    e === null)
  )
    return (
      xi(t),
      (e = t.memoizedState),
      e !== null && ((e = e.dehydrated), e !== null)
        ? (t.mode & 1
            ? e.data === "$!"
              ? (t.lanes = 8)
              : (t.lanes = 1073741824)
            : (t.lanes = 1),
          null)
        : ((i = r.children),
          (e = r.fallback),
          l
            ? ((r = t.mode),
              (l = t.child),
              (i = { mode: "hidden", children: i }),
              !(r & 1) && l !== null
                ? ((l.childLanes = 0), (l.pendingProps = i))
                : (l = rl(i, r, 0, null)),
              (e = tn(e, r, n, null)),
              (l.return = t),
              (e.return = t),
              (l.sibling = e),
              (t.child = l),
              (t.child.memoizedState = Ti(n)),
              (t.memoizedState = Ri),
              e)
            : Ss(t, i))
    );
  if (((o = e.memoizedState), o !== null && ((s = o.dehydrated), s !== null)))
    return Kp(e, t, i, r, s, o, n);
  if (l) {
    ((l = r.fallback), (i = t.mode), (o = e.child), (s = o.sibling));
    var u = { mode: "hidden", children: r.children };
    return (
      !(i & 1) && t.child !== o
        ? ((r = t.child),
          (r.childLanes = 0),
          (r.pendingProps = u),
          (t.deletions = null))
        : ((r = Dt(o, u)), (r.subtreeFlags = o.subtreeFlags & 14680064)),
      s !== null ? (l = Dt(s, l)) : ((l = tn(l, i, n, null)), (l.flags |= 2)),
      (l.return = t),
      (r.return = t),
      (r.sibling = l),
      (t.child = r),
      (r = l),
      (l = t.child),
      (i = e.child.memoizedState),
      (i =
        i === null
          ? Ti(n)
          : {
              baseLanes: i.baseLanes | n,
              cachePool: null,
              transitions: i.transitions,
            }),
      (l.memoizedState = i),
      (l.childLanes = e.childLanes & ~n),
      (t.memoizedState = Ri),
      r
    );
  }
  return (
    (l = e.child),
    (e = l.sibling),
    (r = Dt(l, { mode: "visible", children: r.children })),
    !(t.mode & 1) && (r.lanes = n),
    (r.return = t),
    (r.sibling = null),
    e !== null &&
      ((n = t.deletions),
      n === null ? ((t.deletions = [e]), (t.flags |= 16)) : n.push(e)),
    (t.child = r),
    (t.memoizedState = null),
    r
  );
}
function Ss(e, t) {
  return (
    (t = rl({ mode: "visible", children: t }, e.mode, 0, null)),
    (t.return = e),
    (e.child = t)
  );
}
function no(e, t, n, r) {
  return (
    r !== null && ss(r),
    In(t, e.child, null, n),
    (e = Ss(t, t.pendingProps.children)),
    (e.flags |= 2),
    (t.memoizedState = null),
    e
  );
}
function Kp(e, t, n, r, o, l, i) {
  if (n)
    return t.flags & 256
      ? ((t.flags &= -257), (r = Ol(Error(_(422)))), no(e, t, i, r))
      : t.memoizedState !== null
        ? ((t.child = e.child), (t.flags |= 128), null)
        : ((l = r.fallback),
          (o = t.mode),
          (r = rl({ mode: "visible", children: r.children }, o, 0, null)),
          (l = tn(l, o, i, null)),
          (l.flags |= 2),
          (r.return = t),
          (l.return = t),
          (r.sibling = l),
          (t.child = r),
          t.mode & 1 && In(t, e.child, null, i),
          (t.child.memoizedState = Ti(i)),
          (t.memoizedState = Ri),
          l);
  if (!(t.mode & 1)) return no(e, t, i, null);
  if (o.data === "$!") {
    if (((r = o.nextSibling && o.nextSibling.dataset), r)) var s = r.dgst;
    return (
      (r = s),
      (l = Error(_(419))),
      (r = Ol(l, r, void 0)),
      no(e, t, i, r)
    );
  }
  if (((s = (i & e.childLanes) !== 0), _e || s)) {
    if (((r = he), r !== null)) {
      switch (i & -i) {
        case 4:
          o = 2;
          break;
        case 16:
          o = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          o = 32;
          break;
        case 536870912:
          o = 268435456;
          break;
        default:
          o = 0;
      }
      ((o = o & (r.suspendedLanes | i) ? 0 : o),
        o !== 0 &&
          o !== l.retryLane &&
          ((l.retryLane = o), xt(e, o), et(r, e, o, -1)));
    }
    return (Ts(), (r = Ol(Error(_(421)))), no(e, t, i, r));
  }
  return o.data === "$?"
    ? ((t.flags |= 128),
      (t.child = e.child),
      (t = im.bind(null, e)),
      (o._reactRetry = t),
      null)
    : ((e = l.treeContext),
      (Ae = Mt(o.nextSibling)),
      (Ie = t),
      (ee = !0),
      (Je = null),
      e !== null &&
        ((Be[be++] = pt),
        (Be[be++] = mt),
        (Be[be++] = rn),
        (pt = e.id),
        (mt = e.overflow),
        (rn = t)),
      (t = Ss(t, r.children)),
      (t.flags |= 4096),
      t);
}
function Du(e, t, n) {
  e.lanes |= t;
  var r = e.alternate;
  (r !== null && (r.lanes |= t), wi(e.return, t, n));
}
function Al(e, t, n, r, o) {
  var l = e.memoizedState;
  l === null
    ? (e.memoizedState = {
        isBackwards: t,
        rendering: null,
        renderingStartTime: 0,
        last: r,
        tail: n,
        tailMode: o,
      })
    : ((l.isBackwards = t),
      (l.rendering = null),
      (l.renderingStartTime = 0),
      (l.last = r),
      (l.tail = n),
      (l.tailMode = o));
}
function ed(e, t, n) {
  var r = t.pendingProps,
    o = r.revealOrder,
    l = r.tail;
  if ((Ee(e, t, r.children, n), (r = re.current), r & 2))
    ((r = (r & 1) | 2), (t.flags |= 128));
  else {
    if (e !== null && e.flags & 128)
      e: for (e = t.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && Du(e, n, t);
        else if (e.tag === 19) Du(e, n, t);
        else if (e.child !== null) {
          ((e.child.return = e), (e = e.child));
          continue;
        }
        if (e === t) break e;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) break e;
          e = e.return;
        }
        ((e.sibling.return = e.return), (e = e.sibling));
      }
    r &= 1;
  }
  if ((X(re, r), !(t.mode & 1))) t.memoizedState = null;
  else
    switch (o) {
      case "forwards":
        for (n = t.child, o = null; n !== null; )
          ((e = n.alternate),
            e !== null && Do(e) === null && (o = n),
            (n = n.sibling));
        ((n = o),
          n === null
            ? ((o = t.child), (t.child = null))
            : ((o = n.sibling), (n.sibling = null)),
          Al(t, !1, o, n, l));
        break;
      case "backwards":
        for (n = null, o = t.child, t.child = null; o !== null; ) {
          if (((e = o.alternate), e !== null && Do(e) === null)) {
            t.child = o;
            break;
          }
          ((e = o.sibling), (o.sibling = n), (n = o), (o = e));
        }
        Al(t, !0, n, null, l);
        break;
      case "together":
        Al(t, !1, null, null, void 0);
        break;
      default:
        t.memoizedState = null;
    }
  return t.child;
}
function vo(e, t) {
  !(t.mode & 1) &&
    e !== null &&
    ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
}
function wt(e, t, n) {
  if (
    (e !== null && (t.dependencies = e.dependencies),
    (ln |= t.lanes),
    !(n & t.childLanes))
  )
    return null;
  if (e !== null && t.child !== e.child) throw Error(_(153));
  if (t.child !== null) {
    for (
      e = t.child, n = Dt(e, e.pendingProps), t.child = n, n.return = t;
      e.sibling !== null;
    )
      ((e = e.sibling),
        (n = n.sibling = Dt(e, e.pendingProps)),
        (n.return = t));
    n.sibling = null;
  }
  return t.child;
}
function Yp(e, t, n) {
  switch (t.tag) {
    case 3:
      (Jc(t), An());
      break;
    case 5:
      Rc(t);
      break;
    case 1:
      ze(t.type) && zo(t);
      break;
    case 4:
      ps(t, t.stateNode.containerInfo);
      break;
    case 10:
      var r = t.type._context,
        o = t.memoizedProps.value;
      (X(Oo, r._currentValue), (r._currentValue = o));
      break;
    case 13:
      if (((r = t.memoizedState), r !== null))
        return r.dehydrated !== null
          ? (X(re, re.current & 1), (t.flags |= 128), null)
          : n & t.child.childLanes
            ? qc(e, t, n)
            : (X(re, re.current & 1),
              (e = wt(e, t, n)),
              e !== null ? e.sibling : null);
      X(re, re.current & 1);
      break;
    case 19:
      if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
        if (r) return ed(e, t, n);
        t.flags |= 128;
      }
      if (
        ((o = t.memoizedState),
        o !== null &&
          ((o.rendering = null), (o.tail = null), (o.lastEffect = null)),
        X(re, re.current),
        r)
      )
        break;
      return null;
    case 22:
    case 23:
      return ((t.lanes = 0), Gc(e, t, n));
  }
  return wt(e, t, n);
}
var td, Ni, nd, rd;
td = function (e, t) {
  for (var n = t.child; n !== null; ) {
    if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
    else if (n.tag !== 4 && n.child !== null) {
      ((n.child.return = n), (n = n.child));
      continue;
    }
    if (n === t) break;
    for (; n.sibling === null; ) {
      if (n.return === null || n.return === t) return;
      n = n.return;
    }
    ((n.sibling.return = n.return), (n = n.sibling));
  }
};
Ni = function () {};
nd = function (e, t, n, r) {
  var o = e.memoizedProps;
  if (o !== r) {
    ((e = t.stateNode), Jt(at.current));
    var l = null;
    switch (n) {
      case "input":
        ((o = Gl(e, o)), (r = Gl(e, r)), (l = []));
        break;
      case "select":
        ((o = le({}, o, { value: void 0 })),
          (r = le({}, r, { value: void 0 })),
          (l = []));
        break;
      case "textarea":
        ((o = ql(e, o)), (r = ql(e, r)), (l = []));
        break;
      default:
        typeof o.onClick != "function" &&
          typeof r.onClick == "function" &&
          (e.onclick = _o);
    }
    ti(n, r);
    var i;
    n = null;
    for (a in o)
      if (!r.hasOwnProperty(a) && o.hasOwnProperty(a) && o[a] != null)
        if (a === "style") {
          var s = o[a];
          for (i in s) s.hasOwnProperty(i) && (n || (n = {}), (n[i] = ""));
        } else
          a !== "dangerouslySetInnerHTML" &&
            a !== "children" &&
            a !== "suppressContentEditableWarning" &&
            a !== "suppressHydrationWarning" &&
            a !== "autoFocus" &&
            (vr.hasOwnProperty(a)
              ? l || (l = [])
              : (l = l || []).push(a, null));
    for (a in r) {
      var u = r[a];
      if (
        ((s = o != null ? o[a] : void 0),
        r.hasOwnProperty(a) && u !== s && (u != null || s != null))
      )
        if (a === "style")
          if (s) {
            for (i in s)
              !s.hasOwnProperty(i) ||
                (u && u.hasOwnProperty(i)) ||
                (n || (n = {}), (n[i] = ""));
            for (i in u)
              u.hasOwnProperty(i) &&
                s[i] !== u[i] &&
                (n || (n = {}), (n[i] = u[i]));
          } else (n || (l || (l = []), l.push(a, n)), (n = u));
        else
          a === "dangerouslySetInnerHTML"
            ? ((u = u ? u.__html : void 0),
              (s = s ? s.__html : void 0),
              u != null && s !== u && (l = l || []).push(a, u))
            : a === "children"
              ? (typeof u != "string" && typeof u != "number") ||
                (l = l || []).push(a, "" + u)
              : a !== "suppressContentEditableWarning" &&
                a !== "suppressHydrationWarning" &&
                (vr.hasOwnProperty(a)
                  ? (u != null && a === "onScroll" && Z("scroll", e),
                    l || s === u || (l = []))
                  : (l = l || []).push(a, u));
    }
    n && (l = l || []).push("style", n);
    var a = l;
    (t.updateQueue = a) && (t.flags |= 4);
  }
};
rd = function (e, t, n, r) {
  n !== r && (t.flags |= 4);
};
function qn(e, t) {
  if (!ee)
    switch (e.tailMode) {
      case "hidden":
        t = e.tail;
        for (var n = null; t !== null; )
          (t.alternate !== null && (n = t), (t = t.sibling));
        n === null ? (e.tail = null) : (n.sibling = null);
        break;
      case "collapsed":
        n = e.tail;
        for (var r = null; n !== null; )
          (n.alternate !== null && (r = n), (n = n.sibling));
        r === null
          ? t || e.tail === null
            ? (e.tail = null)
            : (e.tail.sibling = null)
          : (r.sibling = null);
    }
}
function we(e) {
  var t = e.alternate !== null && e.alternate.child === e.child,
    n = 0,
    r = 0;
  if (t)
    for (var o = e.child; o !== null; )
      ((n |= o.lanes | o.childLanes),
        (r |= o.subtreeFlags & 14680064),
        (r |= o.flags & 14680064),
        (o.return = e),
        (o = o.sibling));
  else
    for (o = e.child; o !== null; )
      ((n |= o.lanes | o.childLanes),
        (r |= o.subtreeFlags),
        (r |= o.flags),
        (o.return = e),
        (o = o.sibling));
  return ((e.subtreeFlags |= r), (e.childLanes = n), t);
}
function Xp(e, t, n) {
  var r = t.pendingProps;
  switch ((is(t), t.tag)) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return (we(t), null);
    case 1:
      return (ze(t.type) && Po(), we(t), null);
    case 3:
      return (
        (r = t.stateNode),
        Dn(),
        J(Pe),
        J(ke),
        hs(),
        r.pendingContext &&
          ((r.context = r.pendingContext), (r.pendingContext = null)),
        (e === null || e.child === null) &&
          (eo(t)
            ? (t.flags |= 4)
            : e === null ||
              (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
              ((t.flags |= 1024), Je !== null && (Ii(Je), (Je = null)))),
        Ni(e, t),
        we(t),
        null
      );
    case 5:
      ms(t);
      var o = Jt(_r.current);
      if (((n = t.type), e !== null && t.stateNode != null))
        (nd(e, t, n, r, o),
          e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152)));
      else {
        if (!r) {
          if (t.stateNode === null) throw Error(_(166));
          return (we(t), null);
        }
        if (((e = Jt(at.current)), eo(t))) {
          ((r = t.stateNode), (n = t.type));
          var l = t.memoizedProps;
          switch (((r[st] = t), (r[Tr] = l), (e = (t.mode & 1) !== 0), n)) {
            case "dialog":
              (Z("cancel", r), Z("close", r));
              break;
            case "iframe":
            case "object":
            case "embed":
              Z("load", r);
              break;
            case "video":
            case "audio":
              for (o = 0; o < lr.length; o++) Z(lr[o], r);
              break;
            case "source":
              Z("error", r);
              break;
            case "img":
            case "image":
            case "link":
              (Z("error", r), Z("load", r));
              break;
            case "details":
              Z("toggle", r);
              break;
            case "input":
              (Qs(r, l), Z("invalid", r));
              break;
            case "select":
              ((r._wrapperState = { wasMultiple: !!l.multiple }),
                Z("invalid", r));
              break;
            case "textarea":
              (Ys(r, l), Z("invalid", r));
          }
          (ti(n, l), (o = null));
          for (var i in l)
            if (l.hasOwnProperty(i)) {
              var s = l[i];
              i === "children"
                ? typeof s == "string"
                  ? r.textContent !== s &&
                    (l.suppressHydrationWarning !== !0 &&
                      qr(r.textContent, s, e),
                    (o = ["children", s]))
                  : typeof s == "number" &&
                    r.textContent !== "" + s &&
                    (l.suppressHydrationWarning !== !0 &&
                      qr(r.textContent, s, e),
                    (o = ["children", "" + s]))
                : vr.hasOwnProperty(i) &&
                  s != null &&
                  i === "onScroll" &&
                  Z("scroll", r);
            }
          switch (n) {
            case "input":
              (Vr(r), Ks(r, l, !0));
              break;
            case "textarea":
              (Vr(r), Xs(r));
              break;
            case "select":
            case "option":
              break;
            default:
              typeof l.onClick == "function" && (r.onclick = _o);
          }
          ((r = o), (t.updateQueue = r), r !== null && (t.flags |= 4));
        } else {
          ((i = o.nodeType === 9 ? o : o.ownerDocument),
            e === "http://www.w3.org/1999/xhtml" && (e = za(n)),
            e === "http://www.w3.org/1999/xhtml"
              ? n === "script"
                ? ((e = i.createElement("div")),
                  (e.innerHTML = "<script><\/script>"),
                  (e = e.removeChild(e.firstChild)))
                : typeof r.is == "string"
                  ? (e = i.createElement(n, { is: r.is }))
                  : ((e = i.createElement(n)),
                    n === "select" &&
                      ((i = e),
                      r.multiple
                        ? (i.multiple = !0)
                        : r.size && (i.size = r.size)))
              : (e = i.createElementNS(e, n)),
            (e[st] = t),
            (e[Tr] = r),
            td(e, t, !1, !1),
            (t.stateNode = e));
          e: {
            switch (((i = ni(n, r)), n)) {
              case "dialog":
                (Z("cancel", e), Z("close", e), (o = r));
                break;
              case "iframe":
              case "object":
              case "embed":
                (Z("load", e), (o = r));
                break;
              case "video":
              case "audio":
                for (o = 0; o < lr.length; o++) Z(lr[o], e);
                o = r;
                break;
              case "source":
                (Z("error", e), (o = r));
                break;
              case "img":
              case "image":
              case "link":
                (Z("error", e), Z("load", e), (o = r));
                break;
              case "details":
                (Z("toggle", e), (o = r));
                break;
              case "input":
                (Qs(e, r), (o = Gl(e, r)), Z("invalid", e));
                break;
              case "option":
                o = r;
                break;
              case "select":
                ((e._wrapperState = { wasMultiple: !!r.multiple }),
                  (o = le({}, r, { value: void 0 })),
                  Z("invalid", e));
                break;
              case "textarea":
                (Ys(e, r), (o = ql(e, r)), Z("invalid", e));
                break;
              default:
                o = r;
            }
            (ti(n, o), (s = o));
            for (l in s)
              if (s.hasOwnProperty(l)) {
                var u = s[l];
                l === "style"
                  ? Oa(e, u)
                  : l === "dangerouslySetInnerHTML"
                    ? ((u = u ? u.__html : void 0), u != null && La(e, u))
                    : l === "children"
                      ? typeof u == "string"
                        ? (n !== "textarea" || u !== "") && yr(e, u)
                        : typeof u == "number" && yr(e, "" + u)
                      : l !== "suppressContentEditableWarning" &&
                        l !== "suppressHydrationWarning" &&
                        l !== "autoFocus" &&
                        (vr.hasOwnProperty(l)
                          ? u != null && l === "onScroll" && Z("scroll", e)
                          : u != null && Vi(e, l, u, i));
              }
            switch (n) {
              case "input":
                (Vr(e), Ks(e, r, !1));
                break;
              case "textarea":
                (Vr(e), Xs(e));
                break;
              case "option":
                r.value != null && e.setAttribute("value", "" + Ut(r.value));
                break;
              case "select":
                ((e.multiple = !!r.multiple),
                  (l = r.value),
                  l != null
                    ? Tn(e, !!r.multiple, l, !1)
                    : r.defaultValue != null &&
                      Tn(e, !!r.multiple, r.defaultValue, !0));
                break;
              default:
                typeof o.onClick == "function" && (e.onclick = _o);
            }
            switch (n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                r = !!r.autoFocus;
                break e;
              case "img":
                r = !0;
                break e;
              default:
                r = !1;
            }
          }
          r && (t.flags |= 4);
        }
        t.ref !== null && ((t.flags |= 512), (t.flags |= 2097152));
      }
      return (we(t), null);
    case 6:
      if (e && t.stateNode != null) rd(e, t, e.memoizedProps, r);
      else {
        if (typeof r != "string" && t.stateNode === null) throw Error(_(166));
        if (((n = Jt(_r.current)), Jt(at.current), eo(t))) {
          if (
            ((r = t.stateNode),
            (n = t.memoizedProps),
            (r[st] = t),
            (l = r.nodeValue !== n) && ((e = Ie), e !== null))
          )
            switch (e.tag) {
              case 3:
                qr(r.nodeValue, n, (e.mode & 1) !== 0);
                break;
              case 5:
                e.memoizedProps.suppressHydrationWarning !== !0 &&
                  qr(r.nodeValue, n, (e.mode & 1) !== 0);
            }
          l && (t.flags |= 4);
        } else
          ((r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r)),
            (r[st] = t),
            (t.stateNode = r));
      }
      return (we(t), null);
    case 13:
      if (
        (J(re),
        (r = t.memoizedState),
        e === null ||
          (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
      ) {
        if (ee && Ae !== null && t.mode & 1 && !(t.flags & 128))
          (Sc(), An(), (t.flags |= 98560), (l = !1));
        else if (((l = eo(t)), r !== null && r.dehydrated !== null)) {
          if (e === null) {
            if (!l) throw Error(_(318));
            if (
              ((l = t.memoizedState),
              (l = l !== null ? l.dehydrated : null),
              !l)
            )
              throw Error(_(317));
            l[st] = t;
          } else
            (An(),
              !(t.flags & 128) && (t.memoizedState = null),
              (t.flags |= 4));
          (we(t), (l = !1));
        } else (Je !== null && (Ii(Je), (Je = null)), (l = !0));
        if (!l) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128
        ? ((t.lanes = n), t)
        : ((r = r !== null),
          r !== (e !== null && e.memoizedState !== null) &&
            r &&
            ((t.child.flags |= 8192),
            t.mode & 1 &&
              (e === null || re.current & 1 ? pe === 0 && (pe = 3) : Ts())),
          t.updateQueue !== null && (t.flags |= 4),
          we(t),
          null);
    case 4:
      return (
        Dn(),
        Ni(e, t),
        e === null && jr(t.stateNode.containerInfo),
        we(t),
        null
      );
    case 10:
      return (cs(t.type._context), we(t), null);
    case 17:
      return (ze(t.type) && Po(), we(t), null);
    case 19:
      if ((J(re), (l = t.memoizedState), l === null)) return (we(t), null);
      if (((r = (t.flags & 128) !== 0), (i = l.rendering), i === null))
        if (r) qn(l, !1);
        else {
          if (pe !== 0 || (e !== null && e.flags & 128))
            for (e = t.child; e !== null; ) {
              if (((i = Do(e)), i !== null)) {
                for (
                  t.flags |= 128,
                    qn(l, !1),
                    r = i.updateQueue,
                    r !== null && ((t.updateQueue = r), (t.flags |= 4)),
                    t.subtreeFlags = 0,
                    r = n,
                    n = t.child;
                  n !== null;
                )
                  ((l = n),
                    (e = r),
                    (l.flags &= 14680066),
                    (i = l.alternate),
                    i === null
                      ? ((l.childLanes = 0),
                        (l.lanes = e),
                        (l.child = null),
                        (l.subtreeFlags = 0),
                        (l.memoizedProps = null),
                        (l.memoizedState = null),
                        (l.updateQueue = null),
                        (l.dependencies = null),
                        (l.stateNode = null))
                      : ((l.childLanes = i.childLanes),
                        (l.lanes = i.lanes),
                        (l.child = i.child),
                        (l.subtreeFlags = 0),
                        (l.deletions = null),
                        (l.memoizedProps = i.memoizedProps),
                        (l.memoizedState = i.memoizedState),
                        (l.updateQueue = i.updateQueue),
                        (l.type = i.type),
                        (e = i.dependencies),
                        (l.dependencies =
                          e === null
                            ? null
                            : {
                                lanes: e.lanes,
                                firstContext: e.firstContext,
                              })),
                    (n = n.sibling));
                return (X(re, (re.current & 1) | 2), t.child);
              }
              e = e.sibling;
            }
          l.tail !== null &&
            se() > Fn &&
            ((t.flags |= 128), (r = !0), qn(l, !1), (t.lanes = 4194304));
        }
      else {
        if (!r)
          if (((e = Do(i)), e !== null)) {
            if (
              ((t.flags |= 128),
              (r = !0),
              (n = e.updateQueue),
              n !== null && ((t.updateQueue = n), (t.flags |= 4)),
              qn(l, !0),
              l.tail === null && l.tailMode === "hidden" && !i.alternate && !ee)
            )
              return (we(t), null);
          } else
            2 * se() - l.renderingStartTime > Fn &&
              n !== 1073741824 &&
              ((t.flags |= 128), (r = !0), qn(l, !1), (t.lanes = 4194304));
        l.isBackwards
          ? ((i.sibling = t.child), (t.child = i))
          : ((n = l.last),
            n !== null ? (n.sibling = i) : (t.child = i),
            (l.last = i));
      }
      return l.tail !== null
        ? ((t = l.tail),
          (l.rendering = t),
          (l.tail = t.sibling),
          (l.renderingStartTime = se()),
          (t.sibling = null),
          (n = re.current),
          X(re, r ? (n & 1) | 2 : n & 1),
          t)
        : (we(t), null);
    case 22:
    case 23:
      return (
        Rs(),
        (r = t.memoizedState !== null),
        e !== null && (e.memoizedState !== null) !== r && (t.flags |= 8192),
        r && t.mode & 1
          ? Me & 1073741824 && (we(t), t.subtreeFlags & 6 && (t.flags |= 8192))
          : we(t),
        null
      );
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(_(156, t.tag));
}
function Gp(e, t) {
  switch ((is(t), t.tag)) {
    case 1:
      return (
        ze(t.type) && Po(),
        (e = t.flags),
        e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
      );
    case 3:
      return (
        Dn(),
        J(Pe),
        J(ke),
        hs(),
        (e = t.flags),
        e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
      );
    case 5:
      return (ms(t), null);
    case 13:
      if ((J(re), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
        if (t.alternate === null) throw Error(_(340));
        An();
      }
      return (
        (e = t.flags),
        e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
      );
    case 19:
      return (J(re), null);
    case 4:
      return (Dn(), null);
    case 10:
      return (cs(t.type._context), null);
    case 22:
    case 23:
      return (Rs(), null);
    case 24:
      return null;
    default:
      return null;
  }
}
var ro = !1,
  Se = !1,
  Zp = typeof WeakSet == "function" ? WeakSet : Set,
  M = null;
function En(e, t) {
  var n = e.ref;
  if (n !== null)
    if (typeof n == "function")
      try {
        n(null);
      } catch (r) {
        ie(e, t, r);
      }
    else n.current = null;
}
function _i(e, t, n) {
  try {
    n();
  } catch (r) {
    ie(e, t, r);
  }
}
var $u = !1;
function Jp(e, t) {
  if (((fi = Ro), (e = uc()), os(e))) {
    if ("selectionStart" in e)
      var n = { start: e.selectionStart, end: e.selectionEnd };
    else
      e: {
        n = ((n = e.ownerDocument) && n.defaultView) || window;
        var r = n.getSelection && n.getSelection();
        if (r && r.rangeCount !== 0) {
          n = r.anchorNode;
          var o = r.anchorOffset,
            l = r.focusNode;
          r = r.focusOffset;
          try {
            (n.nodeType, l.nodeType);
          } catch {
            n = null;
            break e;
          }
          var i = 0,
            s = -1,
            u = -1,
            a = 0,
            m = 0,
            c = e,
            v = null;
          t: for (;;) {
            for (
              var w;
              c !== n || (o !== 0 && c.nodeType !== 3) || (s = i + o),
                c !== l || (r !== 0 && c.nodeType !== 3) || (u = i + r),
                c.nodeType === 3 && (i += c.nodeValue.length),
                (w = c.firstChild) !== null;
            )
              ((v = c), (c = w));
            for (;;) {
              if (c === e) break t;
              if (
                (v === n && ++a === o && (s = i),
                v === l && ++m === r && (u = i),
                (w = c.nextSibling) !== null)
              )
                break;
              ((c = v), (v = c.parentNode));
            }
            c = w;
          }
          n = s === -1 || u === -1 ? null : { start: s, end: u };
        } else n = null;
      }
    n = n || { start: 0, end: 0 };
  } else n = null;
  for (pi = { focusedElem: e, selectionRange: n }, Ro = !1, M = t; M !== null; )
    if (((t = M), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null))
      ((e.return = t), (M = e));
    else
      for (; M !== null; ) {
        t = M;
        try {
          var C = t.alternate;
          if (t.flags & 1024)
            switch (t.tag) {
              case 0:
              case 11:
              case 15:
                break;
              case 1:
                if (C !== null) {
                  var y = C.memoizedProps,
                    N = C.memoizedState,
                    p = t.stateNode,
                    d = p.getSnapshotBeforeUpdate(
                      t.elementType === t.type ? y : Ge(t.type, y),
                      N,
                    );
                  p.__reactInternalSnapshotBeforeUpdate = d;
                }
                break;
              case 3:
                var h = t.stateNode.containerInfo;
                h.nodeType === 1
                  ? (h.textContent = "")
                  : h.nodeType === 9 &&
                    h.documentElement &&
                    h.removeChild(h.documentElement);
                break;
              case 5:
              case 6:
              case 4:
              case 17:
                break;
              default:
                throw Error(_(163));
            }
        } catch (g) {
          ie(t, t.return, g);
        }
        if (((e = t.sibling), e !== null)) {
          ((e.return = t.return), (M = e));
          break;
        }
        M = t.return;
      }
  return ((C = $u), ($u = !1), C);
}
function pr(e, t, n) {
  var r = t.updateQueue;
  if (((r = r !== null ? r.lastEffect : null), r !== null)) {
    var o = (r = r.next);
    do {
      if ((o.tag & e) === e) {
        var l = o.destroy;
        ((o.destroy = void 0), l !== void 0 && _i(t, n, l));
      }
      o = o.next;
    } while (o !== r);
  }
}
function tl(e, t) {
  if (
    ((t = t.updateQueue), (t = t !== null ? t.lastEffect : null), t !== null)
  ) {
    var n = (t = t.next);
    do {
      if ((n.tag & e) === e) {
        var r = n.create;
        n.destroy = r();
      }
      n = n.next;
    } while (n !== t);
  }
}
function Pi(e) {
  var t = e.ref;
  if (t !== null) {
    var n = e.stateNode;
    switch (e.tag) {
      case 5:
        e = n;
        break;
      default:
        e = n;
    }
    typeof t == "function" ? t(e) : (t.current = e);
  }
}
function od(e) {
  var t = e.alternate;
  (t !== null && ((e.alternate = null), od(t)),
    (e.child = null),
    (e.deletions = null),
    (e.sibling = null),
    e.tag === 5 &&
      ((t = e.stateNode),
      t !== null &&
        (delete t[st], delete t[Tr], delete t[gi], delete t[Op], delete t[Ap])),
    (e.stateNode = null),
    (e.return = null),
    (e.dependencies = null),
    (e.memoizedProps = null),
    (e.memoizedState = null),
    (e.pendingProps = null),
    (e.stateNode = null),
    (e.updateQueue = null));
}
function ld(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Fu(e) {
  e: for (;;) {
    for (; e.sibling === null; ) {
      if (e.return === null || ld(e.return)) return null;
      e = e.return;
    }
    for (
      e.sibling.return = e.return, e = e.sibling;
      e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
    ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      ((e.child.return = e), (e = e.child));
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function zi(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6)
    ((e = e.stateNode),
      t
        ? n.nodeType === 8
          ? n.parentNode.insertBefore(e, t)
          : n.insertBefore(e, t)
        : (n.nodeType === 8
            ? ((t = n.parentNode), t.insertBefore(e, n))
            : ((t = n), t.appendChild(e)),
          (n = n._reactRootContainer),
          n != null || t.onclick !== null || (t.onclick = _o)));
  else if (r !== 4 && ((e = e.child), e !== null))
    for (zi(e, t, n), e = e.sibling; e !== null; )
      (zi(e, t, n), (e = e.sibling));
}
function Li(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6)
    ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
  else if (r !== 4 && ((e = e.child), e !== null))
    for (Li(e, t, n), e = e.sibling; e !== null; )
      (Li(e, t, n), (e = e.sibling));
}
var ge = null,
  Ze = !1;
function Ct(e, t, n) {
  for (n = n.child; n !== null; ) (id(e, t, n), (n = n.sibling));
}
function id(e, t, n) {
  if (ut && typeof ut.onCommitFiberUnmount == "function")
    try {
      ut.onCommitFiberUnmount(Ko, n);
    } catch {}
  switch (n.tag) {
    case 5:
      Se || En(n, t);
    case 6:
      var r = ge,
        o = Ze;
      ((ge = null),
        Ct(e, t, n),
        (ge = r),
        (Ze = o),
        ge !== null &&
          (Ze
            ? ((e = ge),
              (n = n.stateNode),
              e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n))
            : ge.removeChild(n.stateNode)));
      break;
    case 18:
      ge !== null &&
        (Ze
          ? ((e = ge),
            (n = n.stateNode),
            e.nodeType === 8
              ? Nl(e.parentNode, n)
              : e.nodeType === 1 && Nl(e, n),
            kr(e))
          : Nl(ge, n.stateNode));
      break;
    case 4:
      ((r = ge),
        (o = Ze),
        (ge = n.stateNode.containerInfo),
        (Ze = !0),
        Ct(e, t, n),
        (ge = r),
        (Ze = o));
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (
        !Se &&
        ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))
      ) {
        o = r = r.next;
        do {
          var l = o,
            i = l.destroy;
          ((l = l.tag),
            i !== void 0 && (l & 2 || l & 4) && _i(n, t, i),
            (o = o.next));
        } while (o !== r);
      }
      Ct(e, t, n);
      break;
    case 1:
      if (
        !Se &&
        (En(n, t),
        (r = n.stateNode),
        typeof r.componentWillUnmount == "function")
      )
        try {
          ((r.props = n.memoizedProps),
            (r.state = n.memoizedState),
            r.componentWillUnmount());
        } catch (s) {
          ie(n, t, s);
        }
      Ct(e, t, n);
      break;
    case 21:
      Ct(e, t, n);
      break;
    case 22:
      n.mode & 1
        ? ((Se = (r = Se) || n.memoizedState !== null), Ct(e, t, n), (Se = r))
        : Ct(e, t, n);
      break;
    default:
      Ct(e, t, n);
  }
}
function Uu(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    (n === null && (n = e.stateNode = new Zp()),
      t.forEach(function (r) {
        var o = sm.bind(null, e, r);
        n.has(r) || (n.add(r), r.then(o, o));
      }));
  }
}
function Xe(e, t) {
  var n = t.deletions;
  if (n !== null)
    for (var r = 0; r < n.length; r++) {
      var o = n[r];
      try {
        var l = e,
          i = t,
          s = i;
        e: for (; s !== null; ) {
          switch (s.tag) {
            case 5:
              ((ge = s.stateNode), (Ze = !1));
              break e;
            case 3:
              ((ge = s.stateNode.containerInfo), (Ze = !0));
              break e;
            case 4:
              ((ge = s.stateNode.containerInfo), (Ze = !0));
              break e;
          }
          s = s.return;
        }
        if (ge === null) throw Error(_(160));
        (id(l, i, o), (ge = null), (Ze = !1));
        var u = o.alternate;
        (u !== null && (u.return = null), (o.return = null));
      } catch (a) {
        ie(o, t, a);
      }
    }
  if (t.subtreeFlags & 12854)
    for (t = t.child; t !== null; ) (sd(t, e), (t = t.sibling));
}
function sd(e, t) {
  var n = e.alternate,
    r = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if ((Xe(t, e), ot(e), r & 4)) {
        try {
          (pr(3, e, e.return), tl(3, e));
        } catch (y) {
          ie(e, e.return, y);
        }
        try {
          pr(5, e, e.return);
        } catch (y) {
          ie(e, e.return, y);
        }
      }
      break;
    case 1:
      (Xe(t, e), ot(e), r & 512 && n !== null && En(n, n.return));
      break;
    case 5:
      if (
        (Xe(t, e),
        ot(e),
        r & 512 && n !== null && En(n, n.return),
        e.flags & 32)
      ) {
        var o = e.stateNode;
        try {
          yr(o, "");
        } catch (y) {
          ie(e, e.return, y);
        }
      }
      if (r & 4 && ((o = e.stateNode), o != null)) {
        var l = e.memoizedProps,
          i = n !== null ? n.memoizedProps : l,
          s = e.type,
          u = e.updateQueue;
        if (((e.updateQueue = null), u !== null))
          try {
            (s === "input" && l.type === "radio" && l.name != null && _a(o, l),
              ni(s, i));
            var a = ni(s, l);
            for (i = 0; i < u.length; i += 2) {
              var m = u[i],
                c = u[i + 1];
              m === "style"
                ? Oa(o, c)
                : m === "dangerouslySetInnerHTML"
                  ? La(o, c)
                  : m === "children"
                    ? yr(o, c)
                    : Vi(o, m, c, a);
            }
            switch (s) {
              case "input":
                Zl(o, l);
                break;
              case "textarea":
                Pa(o, l);
                break;
              case "select":
                var v = o._wrapperState.wasMultiple;
                o._wrapperState.wasMultiple = !!l.multiple;
                var w = l.value;
                w != null
                  ? Tn(o, !!l.multiple, w, !1)
                  : v !== !!l.multiple &&
                    (l.defaultValue != null
                      ? Tn(o, !!l.multiple, l.defaultValue, !0)
                      : Tn(o, !!l.multiple, l.multiple ? [] : "", !1));
            }
            o[Tr] = l;
          } catch (y) {
            ie(e, e.return, y);
          }
      }
      break;
    case 6:
      if ((Xe(t, e), ot(e), r & 4)) {
        if (e.stateNode === null) throw Error(_(162));
        ((o = e.stateNode), (l = e.memoizedProps));
        try {
          o.nodeValue = l;
        } catch (y) {
          ie(e, e.return, y);
        }
      }
      break;
    case 3:
      if (
        (Xe(t, e), ot(e), r & 4 && n !== null && n.memoizedState.isDehydrated)
      )
        try {
          kr(t.containerInfo);
        } catch (y) {
          ie(e, e.return, y);
        }
      break;
    case 4:
      (Xe(t, e), ot(e));
      break;
    case 13:
      (Xe(t, e),
        ot(e),
        (o = e.child),
        o.flags & 8192 &&
          ((l = o.memoizedState !== null),
          (o.stateNode.isHidden = l),
          !l ||
            (o.alternate !== null && o.alternate.memoizedState !== null) ||
            (Es = se())),
        r & 4 && Uu(e));
      break;
    case 22:
      if (
        ((m = n !== null && n.memoizedState !== null),
        e.mode & 1 ? ((Se = (a = Se) || m), Xe(t, e), (Se = a)) : Xe(t, e),
        ot(e),
        r & 8192)
      ) {
        if (
          ((a = e.memoizedState !== null),
          (e.stateNode.isHidden = a) && !m && e.mode & 1)
        )
          for (M = e, m = e.child; m !== null; ) {
            for (c = M = m; M !== null; ) {
              switch (((v = M), (w = v.child), v.tag)) {
                case 0:
                case 11:
                case 14:
                case 15:
                  pr(4, v, v.return);
                  break;
                case 1:
                  En(v, v.return);
                  var C = v.stateNode;
                  if (typeof C.componentWillUnmount == "function") {
                    ((r = v), (n = v.return));
                    try {
                      ((t = r),
                        (C.props = t.memoizedProps),
                        (C.state = t.memoizedState),
                        C.componentWillUnmount());
                    } catch (y) {
                      ie(r, n, y);
                    }
                  }
                  break;
                case 5:
                  En(v, v.return);
                  break;
                case 22:
                  if (v.memoizedState !== null) {
                    bu(c);
                    continue;
                  }
              }
              w !== null ? ((w.return = v), (M = w)) : bu(c);
            }
            m = m.sibling;
          }
        e: for (m = null, c = e; ; ) {
          if (c.tag === 5) {
            if (m === null) {
              m = c;
              try {
                ((o = c.stateNode),
                  a
                    ? ((l = o.style),
                      typeof l.setProperty == "function"
                        ? l.setProperty("display", "none", "important")
                        : (l.display = "none"))
                    : ((s = c.stateNode),
                      (u = c.memoizedProps.style),
                      (i =
                        u != null && u.hasOwnProperty("display")
                          ? u.display
                          : null),
                      (s.style.display = Ma("display", i))));
              } catch (y) {
                ie(e, e.return, y);
              }
            }
          } else if (c.tag === 6) {
            if (m === null)
              try {
                c.stateNode.nodeValue = a ? "" : c.memoizedProps;
              } catch (y) {
                ie(e, e.return, y);
              }
          } else if (
            ((c.tag !== 22 && c.tag !== 23) ||
              c.memoizedState === null ||
              c === e) &&
            c.child !== null
          ) {
            ((c.child.return = c), (c = c.child));
            continue;
          }
          if (c === e) break e;
          for (; c.sibling === null; ) {
            if (c.return === null || c.return === e) break e;
            (m === c && (m = null), (c = c.return));
          }
          (m === c && (m = null),
            (c.sibling.return = c.return),
            (c = c.sibling));
        }
      }
      break;
    case 19:
      (Xe(t, e), ot(e), r & 4 && Uu(e));
      break;
    case 21:
      break;
    default:
      (Xe(t, e), ot(e));
  }
}
function ot(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (ld(n)) {
            var r = n;
            break e;
          }
          n = n.return;
        }
        throw Error(_(160));
      }
      switch (r.tag) {
        case 5:
          var o = r.stateNode;
          r.flags & 32 && (yr(o, ""), (r.flags &= -33));
          var l = Fu(e);
          Li(e, l, o);
          break;
        case 3:
        case 4:
          var i = r.stateNode.containerInfo,
            s = Fu(e);
          zi(e, s, i);
          break;
        default:
          throw Error(_(161));
      }
    } catch (u) {
      ie(e, e.return, u);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function qp(e, t, n) {
  ((M = e), ud(e));
}
function ud(e, t, n) {
  for (var r = (e.mode & 1) !== 0; M !== null; ) {
    var o = M,
      l = o.child;
    if (o.tag === 22 && r) {
      var i = o.memoizedState !== null || ro;
      if (!i) {
        var s = o.alternate,
          u = (s !== null && s.memoizedState !== null) || Se;
        s = ro;
        var a = Se;
        if (((ro = i), (Se = u) && !a))
          for (M = o; M !== null; )
            ((i = M),
              (u = i.child),
              i.tag === 22 && i.memoizedState !== null
                ? Wu(o)
                : u !== null
                  ? ((u.return = i), (M = u))
                  : Wu(o));
        for (; l !== null; ) ((M = l), ud(l), (l = l.sibling));
        ((M = o), (ro = s), (Se = a));
      }
      Bu(e);
    } else
      o.subtreeFlags & 8772 && l !== null ? ((l.return = o), (M = l)) : Bu(e);
  }
}
function Bu(e) {
  for (; M !== null; ) {
    var t = M;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772)
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
              Se || tl(5, t);
              break;
            case 1:
              var r = t.stateNode;
              if (t.flags & 4 && !Se)
                if (n === null) r.componentDidMount();
                else {
                  var o =
                    t.elementType === t.type
                      ? n.memoizedProps
                      : Ge(t.type, n.memoizedProps);
                  r.componentDidUpdate(
                    o,
                    n.memoizedState,
                    r.__reactInternalSnapshotBeforeUpdate,
                  );
                }
              var l = t.updateQueue;
              l !== null && ju(t, l, r);
              break;
            case 3:
              var i = t.updateQueue;
              if (i !== null) {
                if (((n = null), t.child !== null))
                  switch (t.child.tag) {
                    case 5:
                      n = t.child.stateNode;
                      break;
                    case 1:
                      n = t.child.stateNode;
                  }
                ju(t, i, n);
              }
              break;
            case 5:
              var s = t.stateNode;
              if (n === null && t.flags & 4) {
                n = s;
                var u = t.memoizedProps;
                switch (t.type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    u.autoFocus && n.focus();
                    break;
                  case "img":
                    u.src && (n.src = u.src);
                }
              }
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (t.memoizedState === null) {
                var a = t.alternate;
                if (a !== null) {
                  var m = a.memoizedState;
                  if (m !== null) {
                    var c = m.dehydrated;
                    c !== null && kr(c);
                  }
                }
              }
              break;
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
            case 25:
              break;
            default:
              throw Error(_(163));
          }
        Se || (t.flags & 512 && Pi(t));
      } catch (v) {
        ie(t, t.return, v);
      }
    }
    if (t === e) {
      M = null;
      break;
    }
    if (((n = t.sibling), n !== null)) {
      ((n.return = t.return), (M = n));
      break;
    }
    M = t.return;
  }
}
function bu(e) {
  for (; M !== null; ) {
    var t = M;
    if (t === e) {
      M = null;
      break;
    }
    var n = t.sibling;
    if (n !== null) {
      ((n.return = t.return), (M = n));
      break;
    }
    M = t.return;
  }
}
function Wu(e) {
  for (; M !== null; ) {
    var t = M;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            tl(4, t);
          } catch (u) {
            ie(t, n, u);
          }
          break;
        case 1:
          var r = t.stateNode;
          if (typeof r.componentDidMount == "function") {
            var o = t.return;
            try {
              r.componentDidMount();
            } catch (u) {
              ie(t, o, u);
            }
          }
          var l = t.return;
          try {
            Pi(t);
          } catch (u) {
            ie(t, l, u);
          }
          break;
        case 5:
          var i = t.return;
          try {
            Pi(t);
          } catch (u) {
            ie(t, i, u);
          }
      }
    } catch (u) {
      ie(t, t.return, u);
    }
    if (t === e) {
      M = null;
      break;
    }
    var s = t.sibling;
    if (s !== null) {
      ((s.return = t.return), (M = s));
      break;
    }
    M = t.return;
  }
}
var em = Math.ceil,
  Uo = St.ReactCurrentDispatcher,
  ks = St.ReactCurrentOwner,
  Ve = St.ReactCurrentBatchConfig,
  W = 0,
  he = null,
  ce = null,
  ve = 0,
  Me = 0,
  jn = Wt(0),
  pe = 0,
  Mr = null,
  ln = 0,
  nl = 0,
  Cs = 0,
  mr = null,
  Ne = null,
  Es = 0,
  Fn = 1 / 0,
  dt = null,
  Bo = !1,
  Mi = null,
  At = null,
  oo = !1,
  _t = null,
  bo = 0,
  hr = 0,
  Oi = null,
  yo = -1,
  xo = 0;
function je() {
  return W & 6 ? se() : yo !== -1 ? yo : (yo = se());
}
function It(e) {
  return e.mode & 1
    ? W & 2 && ve !== 0
      ? ve & -ve
      : Dp.transition !== null
        ? (xo === 0 && (xo = Qa()), xo)
        : ((e = H),
          e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : qa(e.type))),
          e)
    : 1;
}
function et(e, t, n, r) {
  if (50 < hr) throw ((hr = 0), (Oi = null), Error(_(185)));
  (Dr(e, n, r),
    (!(W & 2) || e !== he) &&
      (e === he && (!(W & 2) && (nl |= n), pe === 4 && Tt(e, ve)),
      Le(e, r),
      n === 1 && W === 0 && !(t.mode & 1) && ((Fn = se() + 500), Jo && Ht())));
}
function Le(e, t) {
  var n = e.callbackNode;
  Df(e, t);
  var r = jo(e, e === he ? ve : 0);
  if (r === 0)
    (n !== null && Js(n), (e.callbackNode = null), (e.callbackPriority = 0));
  else if (((t = r & -r), e.callbackPriority !== t)) {
    if ((n != null && Js(n), t === 1))
      (e.tag === 0 ? Ip(Hu.bind(null, e)) : yc(Hu.bind(null, e)),
        Lp(function () {
          !(W & 6) && Ht();
        }),
        (n = null));
    else {
      switch (Ka(r)) {
        case 1:
          n = Gi;
          break;
        case 4:
          n = Ha;
          break;
        case 16:
          n = Eo;
          break;
        case 536870912:
          n = Va;
          break;
        default:
          n = Eo;
      }
      n = gd(n, ad.bind(null, e));
    }
    ((e.callbackPriority = t), (e.callbackNode = n));
  }
}
function ad(e, t) {
  if (((yo = -1), (xo = 0), W & 6)) throw Error(_(327));
  var n = e.callbackNode;
  if (Ln() && e.callbackNode !== n) return null;
  var r = jo(e, e === he ? ve : 0);
  if (r === 0) return null;
  if (r & 30 || r & e.expiredLanes || t) t = Wo(e, r);
  else {
    t = r;
    var o = W;
    W |= 2;
    var l = dd();
    (he !== e || ve !== t) && ((dt = null), (Fn = se() + 500), en(e, t));
    do
      try {
        rm();
        break;
      } catch (s) {
        cd(e, s);
      }
    while (!0);
    (as(),
      (Uo.current = l),
      (W = o),
      ce !== null ? (t = 0) : ((he = null), (ve = 0), (t = pe)));
  }
  if (t !== 0) {
    if (
      (t === 2 && ((o = si(e)), o !== 0 && ((r = o), (t = Ai(e, o)))), t === 1)
    )
      throw ((n = Mr), en(e, 0), Tt(e, r), Le(e, se()), n);
    if (t === 6) Tt(e, r);
    else {
      if (
        ((o = e.current.alternate),
        !(r & 30) &&
          !tm(o) &&
          ((t = Wo(e, r)),
          t === 2 && ((l = si(e)), l !== 0 && ((r = l), (t = Ai(e, l)))),
          t === 1))
      )
        throw ((n = Mr), en(e, 0), Tt(e, r), Le(e, se()), n);
      switch (((e.finishedWork = o), (e.finishedLanes = r), t)) {
        case 0:
        case 1:
          throw Error(_(345));
        case 2:
          Xt(e, Ne, dt);
          break;
        case 3:
          if (
            (Tt(e, r), (r & 130023424) === r && ((t = Es + 500 - se()), 10 < t))
          ) {
            if (jo(e, 0) !== 0) break;
            if (((o = e.suspendedLanes), (o & r) !== r)) {
              (je(), (e.pingedLanes |= e.suspendedLanes & o));
              break;
            }
            e.timeoutHandle = hi(Xt.bind(null, e, Ne, dt), t);
            break;
          }
          Xt(e, Ne, dt);
          break;
        case 4:
          if ((Tt(e, r), (r & 4194240) === r)) break;
          for (t = e.eventTimes, o = -1; 0 < r; ) {
            var i = 31 - qe(r);
            ((l = 1 << i), (i = t[i]), i > o && (o = i), (r &= ~l));
          }
          if (
            ((r = o),
            (r = se() - r),
            (r =
              (120 > r
                ? 120
                : 480 > r
                  ? 480
                  : 1080 > r
                    ? 1080
                    : 1920 > r
                      ? 1920
                      : 3e3 > r
                        ? 3e3
                        : 4320 > r
                          ? 4320
                          : 1960 * em(r / 1960)) - r),
            10 < r)
          ) {
            e.timeoutHandle = hi(Xt.bind(null, e, Ne, dt), r);
            break;
          }
          Xt(e, Ne, dt);
          break;
        case 5:
          Xt(e, Ne, dt);
          break;
        default:
          throw Error(_(329));
      }
    }
  }
  return (Le(e, se()), e.callbackNode === n ? ad.bind(null, e) : null);
}
function Ai(e, t) {
  var n = mr;
  return (
    e.current.memoizedState.isDehydrated && (en(e, t).flags |= 256),
    (e = Wo(e, t)),
    e !== 2 && ((t = Ne), (Ne = n), t !== null && Ii(t)),
    e
  );
}
function Ii(e) {
  Ne === null ? (Ne = e) : Ne.push.apply(Ne, e);
}
function tm(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && ((n = n.stores), n !== null))
        for (var r = 0; r < n.length; r++) {
          var o = n[r],
            l = o.getSnapshot;
          o = o.value;
          try {
            if (!tt(l(), o)) return !1;
          } catch {
            return !1;
          }
        }
    }
    if (((n = t.child), t.subtreeFlags & 16384 && n !== null))
      ((n.return = t), (t = n));
    else {
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return !0;
        t = t.return;
      }
      ((t.sibling.return = t.return), (t = t.sibling));
    }
  }
  return !0;
}
function Tt(e, t) {
  for (
    t &= ~Cs,
      t &= ~nl,
      e.suspendedLanes |= t,
      e.pingedLanes &= ~t,
      e = e.expirationTimes;
    0 < t;
  ) {
    var n = 31 - qe(t),
      r = 1 << n;
    ((e[n] = -1), (t &= ~r));
  }
}
function Hu(e) {
  if (W & 6) throw Error(_(327));
  Ln();
  var t = jo(e, 0);
  if (!(t & 1)) return (Le(e, se()), null);
  var n = Wo(e, t);
  if (e.tag !== 0 && n === 2) {
    var r = si(e);
    r !== 0 && ((t = r), (n = Ai(e, r)));
  }
  if (n === 1) throw ((n = Mr), en(e, 0), Tt(e, t), Le(e, se()), n);
  if (n === 6) throw Error(_(345));
  return (
    (e.finishedWork = e.current.alternate),
    (e.finishedLanes = t),
    Xt(e, Ne, dt),
    Le(e, se()),
    null
  );
}
function js(e, t) {
  var n = W;
  W |= 1;
  try {
    return e(t);
  } finally {
    ((W = n), W === 0 && ((Fn = se() + 500), Jo && Ht()));
  }
}
function sn(e) {
  _t !== null && _t.tag === 0 && !(W & 6) && Ln();
  var t = W;
  W |= 1;
  var n = Ve.transition,
    r = H;
  try {
    if (((Ve.transition = null), (H = 1), e)) return e();
  } finally {
    ((H = r), (Ve.transition = n), (W = t), !(W & 6) && Ht());
  }
}
function Rs() {
  ((Me = jn.current), J(jn));
}
function en(e, t) {
  ((e.finishedWork = null), (e.finishedLanes = 0));
  var n = e.timeoutHandle;
  if ((n !== -1 && ((e.timeoutHandle = -1), zp(n)), ce !== null))
    for (n = ce.return; n !== null; ) {
      var r = n;
      switch ((is(r), r.tag)) {
        case 1:
          ((r = r.type.childContextTypes), r != null && Po());
          break;
        case 3:
          (Dn(), J(Pe), J(ke), hs());
          break;
        case 5:
          ms(r);
          break;
        case 4:
          Dn();
          break;
        case 13:
          J(re);
          break;
        case 19:
          J(re);
          break;
        case 10:
          cs(r.type._context);
          break;
        case 22:
        case 23:
          Rs();
      }
      n = n.return;
    }
  if (
    ((he = e),
    (ce = e = Dt(e.current, null)),
    (ve = Me = t),
    (pe = 0),
    (Mr = null),
    (Cs = nl = ln = 0),
    (Ne = mr = null),
    Zt !== null)
  ) {
    for (t = 0; t < Zt.length; t++)
      if (((n = Zt[t]), (r = n.interleaved), r !== null)) {
        n.interleaved = null;
        var o = r.next,
          l = n.pending;
        if (l !== null) {
          var i = l.next;
          ((l.next = o), (r.next = i));
        }
        n.pending = r;
      }
    Zt = null;
  }
  return e;
}
function cd(e, t) {
  do {
    var n = ce;
    try {
      if ((as(), (ho.current = Fo), $o)) {
        for (var r = oe.memoizedState; r !== null; ) {
          var o = r.queue;
          (o !== null && (o.pending = null), (r = r.next));
        }
        $o = !1;
      }
      if (
        ((on = 0),
        (me = fe = oe = null),
        (fr = !1),
        (Pr = 0),
        (ks.current = null),
        n === null || n.return === null)
      ) {
        ((pe = 1), (Mr = t), (ce = null));
        break;
      }
      e: {
        var l = e,
          i = n.return,
          s = n,
          u = t;
        if (
          ((t = ve),
          (s.flags |= 32768),
          u !== null && typeof u == "object" && typeof u.then == "function")
        ) {
          var a = u,
            m = s,
            c = m.tag;
          if (!(m.mode & 1) && (c === 0 || c === 11 || c === 15)) {
            var v = m.alternate;
            v
              ? ((m.updateQueue = v.updateQueue),
                (m.memoizedState = v.memoizedState),
                (m.lanes = v.lanes))
              : ((m.updateQueue = null), (m.memoizedState = null));
          }
          var w = zu(i);
          if (w !== null) {
            ((w.flags &= -257),
              Lu(w, i, s, l, t),
              w.mode & 1 && Pu(l, a, t),
              (t = w),
              (u = a));
            var C = t.updateQueue;
            if (C === null) {
              var y = new Set();
              (y.add(u), (t.updateQueue = y));
            } else C.add(u);
            break e;
          } else {
            if (!(t & 1)) {
              (Pu(l, a, t), Ts());
              break e;
            }
            u = Error(_(426));
          }
        } else if (ee && s.mode & 1) {
          var N = zu(i);
          if (N !== null) {
            (!(N.flags & 65536) && (N.flags |= 256),
              Lu(N, i, s, l, t),
              ss($n(u, s)));
            break e;
          }
        }
        ((l = u = $n(u, s)),
          pe !== 4 && (pe = 2),
          mr === null ? (mr = [l]) : mr.push(l),
          (l = i));
        do {
          switch (l.tag) {
            case 3:
              ((l.flags |= 65536), (t &= -t), (l.lanes |= t));
              var p = Kc(l, u, t);
              Eu(l, p);
              break e;
            case 1:
              s = u;
              var d = l.type,
                h = l.stateNode;
              if (
                !(l.flags & 128) &&
                (typeof d.getDerivedStateFromError == "function" ||
                  (h !== null &&
                    typeof h.componentDidCatch == "function" &&
                    (At === null || !At.has(h))))
              ) {
                ((l.flags |= 65536), (t &= -t), (l.lanes |= t));
                var g = Yc(l, s, t);
                Eu(l, g);
                break e;
              }
          }
          l = l.return;
        } while (l !== null);
      }
      pd(n);
    } catch (S) {
      ((t = S), ce === n && n !== null && (ce = n = n.return));
      continue;
    }
    break;
  } while (!0);
}
function dd() {
  var e = Uo.current;
  return ((Uo.current = Fo), e === null ? Fo : e);
}
function Ts() {
  ((pe === 0 || pe === 3 || pe === 2) && (pe = 4),
    he === null || (!(ln & 268435455) && !(nl & 268435455)) || Tt(he, ve));
}
function Wo(e, t) {
  var n = W;
  W |= 2;
  var r = dd();
  (he !== e || ve !== t) && ((dt = null), en(e, t));
  do
    try {
      nm();
      break;
    } catch (o) {
      cd(e, o);
    }
  while (!0);
  if ((as(), (W = n), (Uo.current = r), ce !== null)) throw Error(_(261));
  return ((he = null), (ve = 0), pe);
}
function nm() {
  for (; ce !== null; ) fd(ce);
}
function rm() {
  for (; ce !== null && !Nf(); ) fd(ce);
}
function fd(e) {
  var t = hd(e.alternate, e, Me);
  ((e.memoizedProps = e.pendingProps),
    t === null ? pd(e) : (ce = t),
    (ks.current = null));
}
function pd(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (((e = t.return), t.flags & 32768)) {
      if (((n = Gp(n, t)), n !== null)) {
        ((n.flags &= 32767), (ce = n));
        return;
      }
      if (e !== null)
        ((e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null));
      else {
        ((pe = 6), (ce = null));
        return;
      }
    } else if (((n = Xp(n, t, Me)), n !== null)) {
      ce = n;
      return;
    }
    if (((t = t.sibling), t !== null)) {
      ce = t;
      return;
    }
    ce = t = e;
  } while (t !== null);
  pe === 0 && (pe = 5);
}
function Xt(e, t, n) {
  var r = H,
    o = Ve.transition;
  try {
    ((Ve.transition = null), (H = 1), om(e, t, n, r));
  } finally {
    ((Ve.transition = o), (H = r));
  }
  return null;
}
function om(e, t, n, r) {
  do Ln();
  while (_t !== null);
  if (W & 6) throw Error(_(327));
  n = e.finishedWork;
  var o = e.finishedLanes;
  if (n === null) return null;
  if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current))
    throw Error(_(177));
  ((e.callbackNode = null), (e.callbackPriority = 0));
  var l = n.lanes | n.childLanes;
  if (
    ($f(e, l),
    e === he && ((ce = he = null), (ve = 0)),
    (!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
      oo ||
      ((oo = !0),
      gd(Eo, function () {
        return (Ln(), null);
      })),
    (l = (n.flags & 15990) !== 0),
    n.subtreeFlags & 15990 || l)
  ) {
    ((l = Ve.transition), (Ve.transition = null));
    var i = H;
    H = 1;
    var s = W;
    ((W |= 4),
      (ks.current = null),
      Jp(e, n),
      sd(n, e),
      Ep(pi),
      (Ro = !!fi),
      (pi = fi = null),
      (e.current = n),
      qp(n),
      _f(),
      (W = s),
      (H = i),
      (Ve.transition = l));
  } else e.current = n;
  if (
    (oo && ((oo = !1), (_t = e), (bo = o)),
    (l = e.pendingLanes),
    l === 0 && (At = null),
    Lf(n.stateNode),
    Le(e, se()),
    t !== null)
  )
    for (r = e.onRecoverableError, n = 0; n < t.length; n++)
      ((o = t[n]), r(o.value, { componentStack: o.stack, digest: o.digest }));
  if (Bo) throw ((Bo = !1), (e = Mi), (Mi = null), e);
  return (
    bo & 1 && e.tag !== 0 && Ln(),
    (l = e.pendingLanes),
    l & 1 ? (e === Oi ? hr++ : ((hr = 0), (Oi = e))) : (hr = 0),
    Ht(),
    null
  );
}
function Ln() {
  if (_t !== null) {
    var e = Ka(bo),
      t = Ve.transition,
      n = H;
    try {
      if (((Ve.transition = null), (H = 16 > e ? 16 : e), _t === null))
        var r = !1;
      else {
        if (((e = _t), (_t = null), (bo = 0), W & 6)) throw Error(_(331));
        var o = W;
        for (W |= 4, M = e.current; M !== null; ) {
          var l = M,
            i = l.child;
          if (M.flags & 16) {
            var s = l.deletions;
            if (s !== null) {
              for (var u = 0; u < s.length; u++) {
                var a = s[u];
                for (M = a; M !== null; ) {
                  var m = M;
                  switch (m.tag) {
                    case 0:
                    case 11:
                    case 15:
                      pr(8, m, l);
                  }
                  var c = m.child;
                  if (c !== null) ((c.return = m), (M = c));
                  else
                    for (; M !== null; ) {
                      m = M;
                      var v = m.sibling,
                        w = m.return;
                      if ((od(m), m === a)) {
                        M = null;
                        break;
                      }
                      if (v !== null) {
                        ((v.return = w), (M = v));
                        break;
                      }
                      M = w;
                    }
                }
              }
              var C = l.alternate;
              if (C !== null) {
                var y = C.child;
                if (y !== null) {
                  C.child = null;
                  do {
                    var N = y.sibling;
                    ((y.sibling = null), (y = N));
                  } while (y !== null);
                }
              }
              M = l;
            }
          }
          if (l.subtreeFlags & 2064 && i !== null) ((i.return = l), (M = i));
          else
            e: for (; M !== null; ) {
              if (((l = M), l.flags & 2048))
                switch (l.tag) {
                  case 0:
                  case 11:
                  case 15:
                    pr(9, l, l.return);
                }
              var p = l.sibling;
              if (p !== null) {
                ((p.return = l.return), (M = p));
                break e;
              }
              M = l.return;
            }
        }
        var d = e.current;
        for (M = d; M !== null; ) {
          i = M;
          var h = i.child;
          if (i.subtreeFlags & 2064 && h !== null) ((h.return = i), (M = h));
          else
            e: for (i = d; M !== null; ) {
              if (((s = M), s.flags & 2048))
                try {
                  switch (s.tag) {
                    case 0:
                    case 11:
                    case 15:
                      tl(9, s);
                  }
                } catch (S) {
                  ie(s, s.return, S);
                }
              if (s === i) {
                M = null;
                break e;
              }
              var g = s.sibling;
              if (g !== null) {
                ((g.return = s.return), (M = g));
                break e;
              }
              M = s.return;
            }
        }
        if (
          ((W = o), Ht(), ut && typeof ut.onPostCommitFiberRoot == "function")
        )
          try {
            ut.onPostCommitFiberRoot(Ko, e);
          } catch {}
        r = !0;
      }
      return r;
    } finally {
      ((H = n), (Ve.transition = t));
    }
  }
  return !1;
}
function Vu(e, t, n) {
  ((t = $n(n, t)),
    (t = Kc(e, t, 1)),
    (e = Ot(e, t, 1)),
    (t = je()),
    e !== null && (Dr(e, 1, t), Le(e, t)));
}
function ie(e, t, n) {
  if (e.tag === 3) Vu(e, e, n);
  else
    for (; t !== null; ) {
      if (t.tag === 3) {
        Vu(t, e, n);
        break;
      } else if (t.tag === 1) {
        var r = t.stateNode;
        if (
          typeof t.type.getDerivedStateFromError == "function" ||
          (typeof r.componentDidCatch == "function" &&
            (At === null || !At.has(r)))
        ) {
          ((e = $n(n, e)),
            (e = Yc(t, e, 1)),
            (t = Ot(t, e, 1)),
            (e = je()),
            t !== null && (Dr(t, 1, e), Le(t, e)));
          break;
        }
      }
      t = t.return;
    }
}
function lm(e, t, n) {
  var r = e.pingCache;
  (r !== null && r.delete(t),
    (t = je()),
    (e.pingedLanes |= e.suspendedLanes & n),
    he === e &&
      (ve & n) === n &&
      (pe === 4 || (pe === 3 && (ve & 130023424) === ve && 500 > se() - Es)
        ? en(e, 0)
        : (Cs |= n)),
    Le(e, t));
}
function md(e, t) {
  t === 0 &&
    (e.mode & 1
      ? ((t = Yr), (Yr <<= 1), !(Yr & 130023424) && (Yr = 4194304))
      : (t = 1));
  var n = je();
  ((e = xt(e, t)), e !== null && (Dr(e, t, n), Le(e, n)));
}
function im(e) {
  var t = e.memoizedState,
    n = 0;
  (t !== null && (n = t.retryLane), md(e, n));
}
function sm(e, t) {
  var n = 0;
  switch (e.tag) {
    case 13:
      var r = e.stateNode,
        o = e.memoizedState;
      o !== null && (n = o.retryLane);
      break;
    case 19:
      r = e.stateNode;
      break;
    default:
      throw Error(_(314));
  }
  (r !== null && r.delete(t), md(e, n));
}
var hd;
hd = function (e, t, n) {
  if (e !== null)
    if (e.memoizedProps !== t.pendingProps || Pe.current) _e = !0;
    else {
      if (!(e.lanes & n) && !(t.flags & 128)) return ((_e = !1), Yp(e, t, n));
      _e = !!(e.flags & 131072);
    }
  else ((_e = !1), ee && t.flags & 1048576 && xc(t, Mo, t.index));
  switch (((t.lanes = 0), t.tag)) {
    case 2:
      var r = t.type;
      (vo(e, t), (e = t.pendingProps));
      var o = On(t, ke.current);
      (zn(t, n), (o = vs(null, t, r, e, o, n)));
      var l = ys();
      return (
        (t.flags |= 1),
        typeof o == "object" &&
        o !== null &&
        typeof o.render == "function" &&
        o.$$typeof === void 0
          ? ((t.tag = 1),
            (t.memoizedState = null),
            (t.updateQueue = null),
            ze(r) ? ((l = !0), zo(t)) : (l = !1),
            (t.memoizedState =
              o.state !== null && o.state !== void 0 ? o.state : null),
            fs(t),
            (o.updater = el),
            (t.stateNode = o),
            (o._reactInternals = t),
            ki(t, r, e, n),
            (t = ji(null, t, r, !0, l, n)))
          : ((t.tag = 0), ee && l && ls(t), Ee(null, t, o, n), (t = t.child)),
        t
      );
    case 16:
      r = t.elementType;
      e: {
        switch (
          (vo(e, t),
          (e = t.pendingProps),
          (o = r._init),
          (r = o(r._payload)),
          (t.type = r),
          (o = t.tag = am(r)),
          (e = Ge(r, e)),
          o)
        ) {
          case 0:
            t = Ei(null, t, r, e, n);
            break e;
          case 1:
            t = Au(null, t, r, e, n);
            break e;
          case 11:
            t = Mu(null, t, r, e, n);
            break e;
          case 14:
            t = Ou(null, t, r, Ge(r.type, e), n);
            break e;
        }
        throw Error(_(306, r, ""));
      }
      return t;
    case 0:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : Ge(r, o)),
        Ei(e, t, r, o, n)
      );
    case 1:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : Ge(r, o)),
        Au(e, t, r, o, n)
      );
    case 3:
      e: {
        if ((Jc(t), e === null)) throw Error(_(387));
        ((r = t.pendingProps),
          (l = t.memoizedState),
          (o = l.element),
          jc(e, t),
          Io(t, r, null, n));
        var i = t.memoizedState;
        if (((r = i.element), l.isDehydrated))
          if (
            ((l = {
              element: r,
              isDehydrated: !1,
              cache: i.cache,
              pendingSuspenseBoundaries: i.pendingSuspenseBoundaries,
              transitions: i.transitions,
            }),
            (t.updateQueue.baseState = l),
            (t.memoizedState = l),
            t.flags & 256)
          ) {
            ((o = $n(Error(_(423)), t)), (t = Iu(e, t, r, n, o)));
            break e;
          } else if (r !== o) {
            ((o = $n(Error(_(424)), t)), (t = Iu(e, t, r, n, o)));
            break e;
          } else
            for (
              Ae = Mt(t.stateNode.containerInfo.firstChild),
                Ie = t,
                ee = !0,
                Je = null,
                n = Cc(t, null, r, n),
                t.child = n;
              n;
            )
              ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
        else {
          if ((An(), r === o)) {
            t = wt(e, t, n);
            break e;
          }
          Ee(e, t, r, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return (
        Rc(t),
        e === null && xi(t),
        (r = t.type),
        (o = t.pendingProps),
        (l = e !== null ? e.memoizedProps : null),
        (i = o.children),
        mi(r, o) ? (i = null) : l !== null && mi(r, l) && (t.flags |= 32),
        Zc(e, t),
        Ee(e, t, i, n),
        t.child
      );
    case 6:
      return (e === null && xi(t), null);
    case 13:
      return qc(e, t, n);
    case 4:
      return (
        ps(t, t.stateNode.containerInfo),
        (r = t.pendingProps),
        e === null ? (t.child = In(t, null, r, n)) : Ee(e, t, r, n),
        t.child
      );
    case 11:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : Ge(r, o)),
        Mu(e, t, r, o, n)
      );
    case 7:
      return (Ee(e, t, t.pendingProps, n), t.child);
    case 8:
      return (Ee(e, t, t.pendingProps.children, n), t.child);
    case 12:
      return (Ee(e, t, t.pendingProps.children, n), t.child);
    case 10:
      e: {
        if (
          ((r = t.type._context),
          (o = t.pendingProps),
          (l = t.memoizedProps),
          (i = o.value),
          X(Oo, r._currentValue),
          (r._currentValue = i),
          l !== null)
        )
          if (tt(l.value, i)) {
            if (l.children === o.children && !Pe.current) {
              t = wt(e, t, n);
              break e;
            }
          } else
            for (l = t.child, l !== null && (l.return = t); l !== null; ) {
              var s = l.dependencies;
              if (s !== null) {
                i = l.child;
                for (var u = s.firstContext; u !== null; ) {
                  if (u.context === r) {
                    if (l.tag === 1) {
                      ((u = gt(-1, n & -n)), (u.tag = 2));
                      var a = l.updateQueue;
                      if (a !== null) {
                        a = a.shared;
                        var m = a.pending;
                        (m === null
                          ? (u.next = u)
                          : ((u.next = m.next), (m.next = u)),
                          (a.pending = u));
                      }
                    }
                    ((l.lanes |= n),
                      (u = l.alternate),
                      u !== null && (u.lanes |= n),
                      wi(l.return, n, t),
                      (s.lanes |= n));
                    break;
                  }
                  u = u.next;
                }
              } else if (l.tag === 10) i = l.type === t.type ? null : l.child;
              else if (l.tag === 18) {
                if (((i = l.return), i === null)) throw Error(_(341));
                ((i.lanes |= n),
                  (s = i.alternate),
                  s !== null && (s.lanes |= n),
                  wi(i, n, t),
                  (i = l.sibling));
              } else i = l.child;
              if (i !== null) i.return = l;
              else
                for (i = l; i !== null; ) {
                  if (i === t) {
                    i = null;
                    break;
                  }
                  if (((l = i.sibling), l !== null)) {
                    ((l.return = i.return), (i = l));
                    break;
                  }
                  i = i.return;
                }
              l = i;
            }
        (Ee(e, t, o.children, n), (t = t.child));
      }
      return t;
    case 9:
      return (
        (o = t.type),
        (r = t.pendingProps.children),
        zn(t, n),
        (o = Qe(o)),
        (r = r(o)),
        (t.flags |= 1),
        Ee(e, t, r, n),
        t.child
      );
    case 14:
      return (
        (r = t.type),
        (o = Ge(r, t.pendingProps)),
        (o = Ge(r.type, o)),
        Ou(e, t, r, o, n)
      );
    case 15:
      return Xc(e, t, t.type, t.pendingProps, n);
    case 17:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : Ge(r, o)),
        vo(e, t),
        (t.tag = 1),
        ze(r) ? ((e = !0), zo(t)) : (e = !1),
        zn(t, n),
        Qc(t, r, o),
        ki(t, r, o, n),
        ji(null, t, r, !0, e, n)
      );
    case 19:
      return ed(e, t, n);
    case 22:
      return Gc(e, t, n);
  }
  throw Error(_(156, t.tag));
};
function gd(e, t) {
  return Wa(e, t);
}
function um(e, t, n, r) {
  ((this.tag = e),
    (this.key = n),
    (this.sibling =
      this.child =
      this.return =
      this.stateNode =
      this.type =
      this.elementType =
        null),
    (this.index = 0),
    (this.ref = null),
    (this.pendingProps = t),
    (this.dependencies =
      this.memoizedState =
      this.updateQueue =
      this.memoizedProps =
        null),
    (this.mode = r),
    (this.subtreeFlags = this.flags = 0),
    (this.deletions = null),
    (this.childLanes = this.lanes = 0),
    (this.alternate = null));
}
function He(e, t, n, r) {
  return new um(e, t, n, r);
}
function Ns(e) {
  return ((e = e.prototype), !(!e || !e.isReactComponent));
}
function am(e) {
  if (typeof e == "function") return Ns(e) ? 1 : 0;
  if (e != null) {
    if (((e = e.$$typeof), e === Ki)) return 11;
    if (e === Yi) return 14;
  }
  return 2;
}
function Dt(e, t) {
  var n = e.alternate;
  return (
    n === null
      ? ((n = He(e.tag, t, e.key, e.mode)),
        (n.elementType = e.elementType),
        (n.type = e.type),
        (n.stateNode = e.stateNode),
        (n.alternate = e),
        (e.alternate = n))
      : ((n.pendingProps = t),
        (n.type = e.type),
        (n.flags = 0),
        (n.subtreeFlags = 0),
        (n.deletions = null)),
    (n.flags = e.flags & 14680064),
    (n.childLanes = e.childLanes),
    (n.lanes = e.lanes),
    (n.child = e.child),
    (n.memoizedProps = e.memoizedProps),
    (n.memoizedState = e.memoizedState),
    (n.updateQueue = e.updateQueue),
    (t = e.dependencies),
    (n.dependencies =
      t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
    (n.sibling = e.sibling),
    (n.index = e.index),
    (n.ref = e.ref),
    n
  );
}
function wo(e, t, n, r, o, l) {
  var i = 2;
  if (((r = e), typeof e == "function")) Ns(e) && (i = 1);
  else if (typeof e == "string") i = 5;
  else
    e: switch (e) {
      case hn:
        return tn(n.children, o, l, t);
      case Qi:
        ((i = 8), (o |= 8));
        break;
      case Ql:
        return (
          (e = He(12, n, t, o | 2)),
          (e.elementType = Ql),
          (e.lanes = l),
          e
        );
      case Kl:
        return ((e = He(13, n, t, o)), (e.elementType = Kl), (e.lanes = l), e);
      case Yl:
        return ((e = He(19, n, t, o)), (e.elementType = Yl), (e.lanes = l), e);
      case Ra:
        return rl(n, o, l, t);
      default:
        if (typeof e == "object" && e !== null)
          switch (e.$$typeof) {
            case Ea:
              i = 10;
              break e;
            case ja:
              i = 9;
              break e;
            case Ki:
              i = 11;
              break e;
            case Yi:
              i = 14;
              break e;
            case Et:
              ((i = 16), (r = null));
              break e;
          }
        throw Error(_(130, e == null ? e : typeof e, ""));
    }
  return (
    (t = He(i, n, t, o)),
    (t.elementType = e),
    (t.type = r),
    (t.lanes = l),
    t
  );
}
function tn(e, t, n, r) {
  return ((e = He(7, e, r, t)), (e.lanes = n), e);
}
function rl(e, t, n, r) {
  return (
    (e = He(22, e, r, t)),
    (e.elementType = Ra),
    (e.lanes = n),
    (e.stateNode = { isHidden: !1 }),
    e
  );
}
function Il(e, t, n) {
  return ((e = He(6, e, null, t)), (e.lanes = n), e);
}
function Dl(e, t, n) {
  return (
    (t = He(4, e.children !== null ? e.children : [], e.key, t)),
    (t.lanes = n),
    (t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation,
    }),
    t
  );
}
function cm(e, t, n, r, o) {
  ((this.tag = t),
    (this.containerInfo = e),
    (this.finishedWork =
      this.pingCache =
      this.current =
      this.pendingChildren =
        null),
    (this.timeoutHandle = -1),
    (this.callbackNode = this.pendingContext = this.context = null),
    (this.callbackPriority = 0),
    (this.eventTimes = vl(0)),
    (this.expirationTimes = vl(-1)),
    (this.entangledLanes =
      this.finishedLanes =
      this.mutableReadLanes =
      this.expiredLanes =
      this.pingedLanes =
      this.suspendedLanes =
      this.pendingLanes =
        0),
    (this.entanglements = vl(0)),
    (this.identifierPrefix = r),
    (this.onRecoverableError = o),
    (this.mutableSourceEagerHydrationData = null));
}
function _s(e, t, n, r, o, l, i, s, u) {
  return (
    (e = new cm(e, t, n, s, u)),
    t === 1 ? ((t = 1), l === !0 && (t |= 8)) : (t = 0),
    (l = He(3, null, null, t)),
    (e.current = l),
    (l.stateNode = e),
    (l.memoizedState = {
      element: r,
      isDehydrated: n,
      cache: null,
      transitions: null,
      pendingSuspenseBoundaries: null,
    }),
    fs(l),
    e
  );
}
function dm(e, t, n) {
  var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return {
    $$typeof: mn,
    key: r == null ? null : "" + r,
    children: e,
    containerInfo: t,
    implementation: n,
  };
}
function vd(e) {
  if (!e) return Bt;
  e = e._reactInternals;
  e: {
    if (an(e) !== e || e.tag !== 1) throw Error(_(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (ze(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(_(171));
  }
  if (e.tag === 1) {
    var n = e.type;
    if (ze(n)) return vc(e, n, t);
  }
  return t;
}
function yd(e, t, n, r, o, l, i, s, u) {
  return (
    (e = _s(n, r, !0, e, o, l, i, s, u)),
    (e.context = vd(null)),
    (n = e.current),
    (r = je()),
    (o = It(n)),
    (l = gt(r, o)),
    (l.callback = t ?? null),
    Ot(n, l, o),
    (e.current.lanes = o),
    Dr(e, o, r),
    Le(e, r),
    e
  );
}
function ol(e, t, n, r) {
  var o = t.current,
    l = je(),
    i = It(o);
  return (
    (n = vd(n)),
    t.context === null ? (t.context = n) : (t.pendingContext = n),
    (t = gt(l, i)),
    (t.payload = { element: e }),
    (r = r === void 0 ? null : r),
    r !== null && (t.callback = r),
    (e = Ot(o, t, i)),
    e !== null && (et(e, o, i, l), mo(e, o, i)),
    i
  );
}
function Ho(e) {
  if (((e = e.current), !e.child)) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function Qu(e, t) {
  if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function Ps(e, t) {
  (Qu(e, t), (e = e.alternate) && Qu(e, t));
}
function fm() {
  return null;
}
var xd =
  typeof reportError == "function"
    ? reportError
    : function (e) {
        console.error(e);
      };
function zs(e) {
  this._internalRoot = e;
}
ll.prototype.render = zs.prototype.render = function (e) {
  var t = this._internalRoot;
  if (t === null) throw Error(_(409));
  ol(e, t, null, null);
};
ll.prototype.unmount = zs.prototype.unmount = function () {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    (sn(function () {
      ol(null, e, null, null);
    }),
      (t[yt] = null));
  }
};
function ll(e) {
  this._internalRoot = e;
}
ll.prototype.unstable_scheduleHydration = function (e) {
  if (e) {
    var t = Ga();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < Rt.length && t !== 0 && t < Rt[n].priority; n++);
    (Rt.splice(n, 0, e), n === 0 && Ja(e));
  }
};
function Ls(e) {
  return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
}
function il(e) {
  return !(
    !e ||
    (e.nodeType !== 1 &&
      e.nodeType !== 9 &&
      e.nodeType !== 11 &&
      (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "))
  );
}
function Ku() {}
function pm(e, t, n, r, o) {
  if (o) {
    if (typeof r == "function") {
      var l = r;
      r = function () {
        var a = Ho(i);
        l.call(a);
      };
    }
    var i = yd(t, r, e, 0, null, !1, !1, "", Ku);
    return (
      (e._reactRootContainer = i),
      (e[yt] = i.current),
      jr(e.nodeType === 8 ? e.parentNode : e),
      sn(),
      i
    );
  }
  for (; (o = e.lastChild); ) e.removeChild(o);
  if (typeof r == "function") {
    var s = r;
    r = function () {
      var a = Ho(u);
      s.call(a);
    };
  }
  var u = _s(e, 0, !1, null, null, !1, !1, "", Ku);
  return (
    (e._reactRootContainer = u),
    (e[yt] = u.current),
    jr(e.nodeType === 8 ? e.parentNode : e),
    sn(function () {
      ol(t, u, n, r);
    }),
    u
  );
}
function sl(e, t, n, r, o) {
  var l = n._reactRootContainer;
  if (l) {
    var i = l;
    if (typeof o == "function") {
      var s = o;
      o = function () {
        var u = Ho(i);
        s.call(u);
      };
    }
    ol(t, i, e, o);
  } else i = pm(n, t, e, o, r);
  return Ho(i);
}
Ya = function (e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = or(t.pendingLanes);
        n !== 0 &&
          (Zi(t, n | 1), Le(t, se()), !(W & 6) && ((Fn = se() + 500), Ht()));
      }
      break;
    case 13:
      (sn(function () {
        var r = xt(e, 1);
        if (r !== null) {
          var o = je();
          et(r, e, 1, o);
        }
      }),
        Ps(e, 1));
  }
};
Ji = function (e) {
  if (e.tag === 13) {
    var t = xt(e, 134217728);
    if (t !== null) {
      var n = je();
      et(t, e, 134217728, n);
    }
    Ps(e, 134217728);
  }
};
Xa = function (e) {
  if (e.tag === 13) {
    var t = It(e),
      n = xt(e, t);
    if (n !== null) {
      var r = je();
      et(n, e, t, r);
    }
    Ps(e, t);
  }
};
Ga = function () {
  return H;
};
Za = function (e, t) {
  var n = H;
  try {
    return ((H = e), t());
  } finally {
    H = n;
  }
};
oi = function (e, t, n) {
  switch (t) {
    case "input":
      if ((Zl(e, n), (t = n.name), n.type === "radio" && t != null)) {
        for (n = e; n.parentNode; ) n = n.parentNode;
        for (
          n = n.querySelectorAll(
            "input[name=" + JSON.stringify("" + t) + '][type="radio"]',
          ),
            t = 0;
          t < n.length;
          t++
        ) {
          var r = n[t];
          if (r !== e && r.form === e.form) {
            var o = Zo(r);
            if (!o) throw Error(_(90));
            (Na(r), Zl(r, o));
          }
        }
      }
      break;
    case "textarea":
      Pa(e, n);
      break;
    case "select":
      ((t = n.value), t != null && Tn(e, !!n.multiple, t, !1));
  }
};
Da = js;
$a = sn;
var mm = { usingClientEntryPoint: !1, Events: [Fr, xn, Zo, Aa, Ia, js] },
  er = {
    findFiberByHostInstance: Gt,
    bundleType: 0,
    version: "18.3.1",
    rendererPackageName: "react-dom",
  },
  hm = {
    bundleType: er.bundleType,
    version: er.version,
    rendererPackageName: er.rendererPackageName,
    rendererConfig: er.rendererConfig,
    overrideHookState: null,
    overrideHookStateDeletePath: null,
    overrideHookStateRenamePath: null,
    overrideProps: null,
    overridePropsDeletePath: null,
    overridePropsRenamePath: null,
    setErrorHandler: null,
    setSuspenseHandler: null,
    scheduleUpdate: null,
    currentDispatcherRef: St.ReactCurrentDispatcher,
    findHostInstanceByFiber: function (e) {
      return ((e = Ba(e)), e === null ? null : e.stateNode);
    },
    findFiberByHostInstance: er.findFiberByHostInstance || fm,
    findHostInstancesForRefresh: null,
    scheduleRefresh: null,
    scheduleRoot: null,
    setRefreshHandler: null,
    getCurrentFiber: null,
    reconcilerVersion: "18.3.1-next-f1338f8080-20240426",
  };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var lo = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!lo.isDisabled && lo.supportsFiber)
    try {
      ((Ko = lo.inject(hm)), (ut = lo));
    } catch {}
}
$e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = mm;
$e.createPortal = function (e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!Ls(t)) throw Error(_(200));
  return dm(e, t, null, n);
};
$e.createRoot = function (e, t) {
  if (!Ls(e)) throw Error(_(299));
  var n = !1,
    r = "",
    o = xd;
  return (
    t != null &&
      (t.unstable_strictMode === !0 && (n = !0),
      t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
      t.onRecoverableError !== void 0 && (o = t.onRecoverableError)),
    (t = _s(e, 1, !1, null, null, n, !1, r, o)),
    (e[yt] = t.current),
    jr(e.nodeType === 8 ? e.parentNode : e),
    new zs(t)
  );
};
$e.findDOMNode = function (e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function"
      ? Error(_(188))
      : ((e = Object.keys(e).join(",")), Error(_(268, e)));
  return ((e = Ba(t)), (e = e === null ? null : e.stateNode), e);
};
$e.flushSync = function (e) {
  return sn(e);
};
$e.hydrate = function (e, t, n) {
  if (!il(t)) throw Error(_(200));
  return sl(null, e, t, !0, n);
};
$e.hydrateRoot = function (e, t, n) {
  if (!Ls(e)) throw Error(_(405));
  var r = (n != null && n.hydratedSources) || null,
    o = !1,
    l = "",
    i = xd;
  if (
    (n != null &&
      (n.unstable_strictMode === !0 && (o = !0),
      n.identifierPrefix !== void 0 && (l = n.identifierPrefix),
      n.onRecoverableError !== void 0 && (i = n.onRecoverableError)),
    (t = yd(t, null, e, 1, n ?? null, o, !1, l, i)),
    (e[yt] = t.current),
    jr(e),
    r)
  )
    for (e = 0; e < r.length; e++)
      ((n = r[e]),
        (o = n._getVersion),
        (o = o(n._source)),
        t.mutableSourceEagerHydrationData == null
          ? (t.mutableSourceEagerHydrationData = [n, o])
          : t.mutableSourceEagerHydrationData.push(n, o));
  return new ll(t);
};
$e.render = function (e, t, n) {
  if (!il(t)) throw Error(_(200));
  return sl(null, e, t, !1, n);
};
$e.unmountComponentAtNode = function (e) {
  if (!il(e)) throw Error(_(40));
  return e._reactRootContainer
    ? (sn(function () {
        sl(null, null, e, !1, function () {
          ((e._reactRootContainer = null), (e[yt] = null));
        });
      }),
      !0)
    : !1;
};
$e.unstable_batchedUpdates = js;
$e.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
  if (!il(n)) throw Error(_(200));
  if (e == null || e._reactInternals === void 0) throw Error(_(38));
  return sl(e, t, n, !1, r);
};
$e.version = "18.3.1-next-f1338f8080-20240426";
function wd() {
  if (
    !(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"
    )
  )
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(wd);
    } catch (e) {
      console.error(e);
    }
}
(wd(), (wa.exports = $e));
var gm = wa.exports,
  Yu = gm;
((Hl.createRoot = Yu.createRoot), (Hl.hydrateRoot = Yu.hydrateRoot));
const Sd = ["shift", "alt", "meta", "mod", "ctrl", "control"],
  vm = {
    esc: "escape",
    return: "enter",
    left: "arrowleft",
    right: "arrowright",
    up: "arrowup",
    down: "arrowdown",
    ShiftLeft: "shift",
    ShiftRight: "shift",
    AltLeft: "alt",
    AltRight: "alt",
    MetaLeft: "meta",
    MetaRight: "meta",
    OSLeft: "meta",
    OSRight: "meta",
    ControlLeft: "ctrl",
    ControlRight: "ctrl",
  };
function $t(e) {
  return (vm[e.trim()] || e.trim())
    .toLowerCase()
    .replace(/key|digit|numpad/, "");
}
function kd(e) {
  return Sd.includes(e);
}
function $l(e, t = ",") {
  return e.toLowerCase().split(t);
}
function Fl(e, t = "+", n = ">", r = !1, o) {
  let l = [],
    i = !1;
  ((e = e.trim()),
    e.includes(n)
      ? ((i = !0),
        (l = e
          .toLocaleLowerCase()
          .split(n)
          .map((a) => $t(a))))
      : (l = e
          .toLocaleLowerCase()
          .split(t)
          .map((a) => $t(a))));
  const s = {
      alt: l.includes("alt"),
      ctrl: l.includes("ctrl") || l.includes("control"),
      shift: l.includes("shift"),
      meta: l.includes("meta"),
      mod: l.includes("mod"),
      useKey: r,
    },
    u = l.filter((a) => !Sd.includes(a));
  return { ...s, keys: u, description: o, isSequence: i, hotkey: e };
}
(typeof document < "u" &&
  (document.addEventListener("keydown", (e) => {
    e.code !== void 0 && Cd([$t(e.code)]);
  }),
  document.addEventListener("keyup", (e) => {
    e.code !== void 0 && Ed([$t(e.code)]);
  })),
  typeof window < "u" &&
    (window.addEventListener("blur", () => {
      ht.clear();
    }),
    window.addEventListener("contextmenu", () => {
      setTimeout(() => {
        ht.clear();
      }, 0);
    })));
const ht = new Set();
function Ms(e) {
  return Array.isArray(e);
}
function ym(e, t = ",") {
  return (Ms(e) ? e : e.split(t)).every((n) => ht.has(n.trim().toLowerCase()));
}
function Cd(e) {
  const t = Array.isArray(e) ? e : [e];
  (ht.has("meta") && ht.forEach((n) => !kd(n) && ht.delete(n.toLowerCase())),
    t.forEach((n) => ht.add(n.toLowerCase())));
}
function Ed(e) {
  const t = Array.isArray(e) ? e : [e];
  e === "meta" ? ht.clear() : t.forEach((n) => ht.delete(n.toLowerCase()));
}
function xm(e, t, n) {
  ((typeof n == "function" && n(e, t)) || n === !0) && e.preventDefault();
}
function wm(e, t, n) {
  return typeof n == "function" ? n(e, t) : n === !0 || n === void 0;
}
const Sm = [
  "input",
  "textarea",
  "select",
  "searchbox",
  "slider",
  "spinbutton",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "textbox",
];
function km(e) {
  return jd(e, Sm);
}
function jd(e, t = !1) {
  const { target: n, composed: r } = e;
  let o, l;
  return (
    Cm(n) && r
      ? ((o = e.composedPath()[0] && e.composedPath()[0].tagName),
        (l = e.composedPath()[0] && e.composedPath()[0].role))
      : ((o = n && n.tagName), (l = n && n.role)),
    Ms(t)
      ? !!(
          o &&
          t &&
          t.some((i) => i.toLowerCase() === o.toLowerCase() || i === l)
        )
      : !!(o && t && t)
  );
}
function Cm(e) {
  return !!e.tagName && !e.tagName.startsWith("-") && e.tagName.includes("-");
}
function Em(e, t) {
  return e.length === 0 && t
    ? (console.warn(
        'A hotkey has the "scopes" option set, however no active scopes were found. If you want to use the global scopes feature, you need to wrap your app in a <HotkeysProvider>',
      ),
      !0)
    : t
      ? e.some((n) => t.includes(n)) || e.includes("*")
      : !0;
}
const jm = (e, t, n = !1) => {
    const {
        alt: r,
        meta: o,
        mod: l,
        shift: i,
        ctrl: s,
        keys: u,
        useKey: a,
      } = t,
      { code: m, key: c, ctrlKey: v, metaKey: w, shiftKey: C, altKey: y } = e,
      N = $t(m);
    if (a && (u == null ? void 0 : u.length) === 1 && u.includes(c)) return !0;
    if (
      !(u != null && u.includes(N)) &&
      !["ctrl", "control", "unknown", "meta", "alt", "shift", "os"].includes(N)
    )
      return !1;
    if (!n) {
      if ((r !== y && N !== "alt") || (i !== C && N !== "shift")) return !1;
      if (l) {
        if (!w && !v) return !1;
      } else if (
        (o !== w && N !== "meta" && N !== "os") ||
        (s !== v && N !== "ctrl" && N !== "control")
      )
        return !1;
    }
    return u && u.length === 1 && u.includes(N) ? !0 : u ? ym(u) : !u;
  },
  Rm = E.createContext(void 0),
  Tm = () => E.useContext(Rm);
function Rd(e, t) {
  return e && t && typeof e == "object" && typeof t == "object"
    ? Object.keys(e).length === Object.keys(t).length &&
        Object.keys(e).reduce((n, r) => n && Rd(e[r], t[r]), !0)
    : e === t;
}
const Nm = E.createContext({
    hotkeys: [],
    activeScopes: [],
    toggleScope: () => {},
    enableScope: () => {},
    disableScope: () => {},
  }),
  _m = () => E.useContext(Nm);
function Pm(e) {
  const t = E.useRef(void 0);
  return (Rd(t.current, e) || (t.current = e), t.current);
}
const Xu = (e) => {
    (e.stopPropagation(), e.preventDefault(), e.stopImmediatePropagation());
  },
  zm = typeof window < "u" ? E.useLayoutEffect : E.useEffect;
function Qt(e, t, n, r) {
  const o = E.useRef(null),
    l = E.useRef(!1),
    i = Array.isArray(n) ? (Array.isArray(r) ? void 0 : r) : n,
    s = Ms(e) ? e.join(i == null ? void 0 : i.delimiter) : e,
    u = Array.isArray(n) ? n : Array.isArray(r) ? r : void 0,
    a = E.useCallback(t, u ?? []),
    m = E.useRef(a);
  u ? (m.current = a) : (m.current = t);
  const c = Pm(i),
    { activeScopes: v } = _m(),
    w = Tm();
  return (
    zm(() => {
      if (
        (c == null ? void 0 : c.enabled) === !1 ||
        !Em(v, c == null ? void 0 : c.scopes)
      )
        return;
      let C = [],
        y;
      const N = (g, S = !1) => {
          var x;
          if (!(km(g) && !jd(g, c == null ? void 0 : c.enableOnFormTags))) {
            if (o.current !== null) {
              const k = o.current.getRootNode();
              if (
                (k instanceof Document || k instanceof ShadowRoot) &&
                k.activeElement !== o.current &&
                !o.current.contains(k.activeElement)
              ) {
                Xu(g);
                return;
              }
            }
            ((x = g.target) != null &&
              x.isContentEditable &&
              !(c != null && c.enableOnContentEditable)) ||
              $l(s, c == null ? void 0 : c.delimiter).forEach((k) => {
                var O, R, F, te;
                if (
                  k.includes((c == null ? void 0 : c.splitKey) ?? "+") &&
                  k.includes((c == null ? void 0 : c.sequenceSplitKey) ?? ">")
                ) {
                  console.warn(
                    `Hotkey ${k} contains both ${(c == null ? void 0 : c.splitKey) ?? "+"} and ${(c == null ? void 0 : c.sequenceSplitKey) ?? ">"} which is not supported.`,
                  );
                  return;
                }
                const j = Fl(
                  k,
                  c == null ? void 0 : c.splitKey,
                  c == null ? void 0 : c.sequenceSplitKey,
                  c == null ? void 0 : c.useKey,
                  c == null ? void 0 : c.description,
                );
                if (j.isSequence) {
                  y = setTimeout(
                    () => {
                      C = [];
                    },
                    (c == null ? void 0 : c.sequenceTimeoutMs) ?? 1e3,
                  );
                  const G = j.useKey ? g.key : $t(g.code);
                  if (kd(G.toLowerCase())) return;
                  C.push(G);
                  const Ce = (O = j.keys) == null ? void 0 : O[C.length - 1];
                  if (G !== Ce) {
                    ((C = []), y && clearTimeout(y));
                    return;
                  }
                  C.length === ((R = j.keys) == null ? void 0 : R.length) &&
                    (m.current(g, j), y && clearTimeout(y), (C = []));
                } else if (
                  jm(g, j, c == null ? void 0 : c.ignoreModifiers) ||
                  ((F = j.keys) != null && F.includes("*"))
                ) {
                  if (
                    ((te = c == null ? void 0 : c.ignoreEventWhen) != null &&
                      te.call(c, g)) ||
                    (S && l.current)
                  )
                    return;
                  if (
                    (xm(g, j, c == null ? void 0 : c.preventDefault),
                    !wm(g, j, c == null ? void 0 : c.enabled))
                  ) {
                    Xu(g);
                    return;
                  }
                  (m.current(g, j), S || (l.current = !0));
                }
              });
          }
        },
        p = (g) => {
          g.code !== void 0 &&
            (Cd($t(g.code)),
            (((c == null ? void 0 : c.keydown) === void 0 &&
              (c == null ? void 0 : c.keyup) !== !0) ||
              (c != null && c.keydown)) &&
              N(g));
        },
        d = (g) => {
          g.code !== void 0 &&
            (Ed($t(g.code)),
            (l.current = !1),
            c != null && c.keyup && N(g, !0));
        },
        h = o.current || (i == null ? void 0 : i.document) || document;
      return (
        h.addEventListener(
          "keyup",
          d,
          i == null ? void 0 : i.eventListenerOptions,
        ),
        h.addEventListener(
          "keydown",
          p,
          i == null ? void 0 : i.eventListenerOptions,
        ),
        w &&
          $l(s, c == null ? void 0 : c.delimiter).forEach((g) =>
            w.addHotkey(
              Fl(
                g,
                c == null ? void 0 : c.splitKey,
                c == null ? void 0 : c.sequenceSplitKey,
                c == null ? void 0 : c.useKey,
                c == null ? void 0 : c.description,
              ),
            ),
          ),
        () => {
          (h.removeEventListener(
            "keyup",
            d,
            i == null ? void 0 : i.eventListenerOptions,
          ),
            h.removeEventListener(
              "keydown",
              p,
              i == null ? void 0 : i.eventListenerOptions,
            ),
            w &&
              $l(s, c == null ? void 0 : c.delimiter).forEach((g) =>
                w.removeHotkey(
                  Fl(
                    g,
                    c == null ? void 0 : c.splitKey,
                    c == null ? void 0 : c.sequenceSplitKey,
                    c == null ? void 0 : c.useKey,
                    c == null ? void 0 : c.description,
                  ),
                ),
              ),
            (C = []),
            y && clearTimeout(y));
        }
      );
    }, [s, c, v]),
    o
  );
}
function Gu(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function Lm(e) {
  if (Array.isArray(e)) return e;
}
function Mm(e, t, n) {
  return (
    (t = Um(t)) in e
      ? Object.defineProperty(e, t, {
          value: n,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (e[t] = n),
    e
  );
}
function Om(e, t) {
  var n =
    e == null
      ? null
      : (typeof Symbol < "u" && e[Symbol.iterator]) || e["@@iterator"];
  if (n != null) {
    var r,
      o,
      l,
      i,
      s = [],
      u = !0,
      a = !1;
    try {
      if (((l = (n = n.call(e)).next), t !== 0))
        for (
          ;
          !(u = (r = l.call(n)).done) && (s.push(r.value), s.length !== t);
          u = !0
        );
    } catch (m) {
      ((a = !0), (o = m));
    } finally {
      try {
        if (!u && n.return != null && ((i = n.return()), Object(i) !== i))
          return;
      } finally {
        if (a) throw o;
      }
    }
    return s;
  }
}
function Am() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Zu(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    (t &&
      (r = r.filter(function (o) {
        return Object.getOwnPropertyDescriptor(e, o).enumerable;
      })),
      n.push.apply(n, r));
  }
  return n;
}
function Ju(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2
      ? Zu(Object(n), !0).forEach(function (r) {
          Mm(e, r, n[r]);
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n))
        : Zu(Object(n)).forEach(function (r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
          });
  }
  return e;
}
function Im(e, t) {
  if (e == null) return {};
  var n,
    r,
    o = Dm(e, t);
  if (Object.getOwnPropertySymbols) {
    var l = Object.getOwnPropertySymbols(e);
    for (r = 0; r < l.length; r++)
      ((n = l[r]),
        t.indexOf(n) === -1 &&
          {}.propertyIsEnumerable.call(e, n) &&
          (o[n] = e[n]));
  }
  return o;
}
function Dm(e, t) {
  if (e == null) return {};
  var n = {};
  for (var r in e)
    if ({}.hasOwnProperty.call(e, r)) {
      if (t.indexOf(r) !== -1) continue;
      n[r] = e[r];
    }
  return n;
}
function $m(e, t) {
  return Lm(e) || Om(e, t) || Bm(e, t) || Am();
}
function Fm(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Um(e) {
  var t = Fm(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
function Bm(e, t) {
  if (e) {
    if (typeof e == "string") return Gu(e, t);
    var n = {}.toString.call(e).slice(8, -1);
    return (
      n === "Object" && e.constructor && (n = e.constructor.name),
      n === "Map" || n === "Set"
        ? Array.from(e)
        : n === "Arguments" ||
            /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
          ? Gu(e, t)
          : void 0
    );
  }
}
function bm(e, t, n) {
  return (
    t in e
      ? Object.defineProperty(e, t, {
          value: n,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (e[t] = n),
    e
  );
}
function qu(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    (t &&
      (r = r.filter(function (o) {
        return Object.getOwnPropertyDescriptor(e, o).enumerable;
      })),
      n.push.apply(n, r));
  }
  return n;
}
function ea(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2
      ? qu(Object(n), !0).forEach(function (r) {
          bm(e, r, n[r]);
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n))
        : qu(Object(n)).forEach(function (r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
          });
  }
  return e;
}
function Wm() {
  for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
    t[n] = arguments[n];
  return function (r) {
    return t.reduceRight(function (o, l) {
      return l(o);
    }, r);
  };
}
function ir(e) {
  return function t() {
    for (
      var n = this, r = arguments.length, o = new Array(r), l = 0;
      l < r;
      l++
    )
      o[l] = arguments[l];
    return o.length >= e.length
      ? e.apply(this, o)
      : function () {
          for (var i = arguments.length, s = new Array(i), u = 0; u < i; u++)
            s[u] = arguments[u];
          return t.apply(n, [].concat(o, s));
        };
  };
}
function Vo(e) {
  return {}.toString.call(e).includes("Object");
}
function Hm(e) {
  return !Object.keys(e).length;
}
function Or(e) {
  return typeof e == "function";
}
function Vm(e, t) {
  return Object.prototype.hasOwnProperty.call(e, t);
}
function Qm(e, t) {
  return (
    Vo(t) || Ft("changeType"),
    Object.keys(t).some(function (n) {
      return !Vm(e, n);
    }) && Ft("changeField"),
    t
  );
}
function Km(e) {
  Or(e) || Ft("selectorType");
}
function Ym(e) {
  (Or(e) || Vo(e) || Ft("handlerType"),
    Vo(e) &&
      Object.values(e).some(function (t) {
        return !Or(t);
      }) &&
      Ft("handlersType"));
}
function Xm(e) {
  (e || Ft("initialIsRequired"),
    Vo(e) || Ft("initialType"),
    Hm(e) && Ft("initialContent"));
}
function Gm(e, t) {
  throw new Error(e[t] || e.default);
}
var Zm = {
    initialIsRequired: "initial state is required",
    initialType: "initial state should be an object",
    initialContent: "initial state shouldn't be an empty object",
    handlerType: "handler should be an object or a function",
    handlersType: "all handlers should be a functions",
    selectorType: "selector should be a function",
    changeType: "provided value of changes should be an object",
    changeField:
      'it seams you want to change a field in the state which is not specified in the "initial" state',
    default: "an unknown error accured in `state-local` package",
  },
  Ft = ir(Gm)(Zm),
  io = { changes: Qm, selector: Km, handler: Ym, initial: Xm };
function Jm(e) {
  var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  (io.initial(e), io.handler(t));
  var n = { current: e },
    r = ir(th)(n, t),
    o = ir(eh)(n),
    l = ir(io.changes)(e),
    i = ir(qm)(n);
  function s() {
    var a =
      arguments.length > 0 && arguments[0] !== void 0
        ? arguments[0]
        : function (m) {
            return m;
          };
    return (io.selector(a), a(n.current));
  }
  function u(a) {
    Wm(r, o, l, i)(a);
  }
  return [s, u];
}
function qm(e, t) {
  return Or(t) ? t(e.current) : t;
}
function eh(e, t) {
  return ((e.current = ea(ea({}, e.current), t)), t);
}
function th(e, t, n) {
  return (
    Or(t)
      ? t(e.current)
      : Object.keys(n).forEach(function (r) {
          var o;
          return (o = t[r]) === null || o === void 0
            ? void 0
            : o.call(t, e.current[r]);
        }),
    n
  );
}
var nh = { create: Jm },
  rh = {
    paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs" },
  };
function oh(e) {
  return function t() {
    for (
      var n = this, r = arguments.length, o = new Array(r), l = 0;
      l < r;
      l++
    )
      o[l] = arguments[l];
    return o.length >= e.length
      ? e.apply(this, o)
      : function () {
          for (var i = arguments.length, s = new Array(i), u = 0; u < i; u++)
            s[u] = arguments[u];
          return t.apply(n, [].concat(o, s));
        };
  };
}
function lh(e) {
  return {}.toString.call(e).includes("Object");
}
function ih(e) {
  return (
    e || ta("configIsRequired"),
    lh(e) || ta("configType"),
    e.urls ? (sh(), { paths: { vs: e.urls.monacoBase } }) : e
  );
}
function sh() {
  console.warn(Td.deprecation);
}
function uh(e, t) {
  throw new Error(e[t] || e.default);
}
var Td = {
    configIsRequired: "the configuration object is required",
    configType: "the configuration object should be an object",
    default: "an unknown error accured in `@monaco-editor/loader` package",
    deprecation: `Deprecation warning!
    You are using deprecated way of configuration.

    Instead of using
      monaco.config({ urls: { monacoBase: '...' } })
    use
      monaco.config({ paths: { vs: '...' } })

    For more please check the link https://github.com/suren-atoyan/monaco-loader#config
  `,
  },
  ta = oh(uh)(Td),
  ah = { config: ih },
  ch = function () {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    return function (o) {
      return n.reduceRight(function (l, i) {
        return i(l);
      }, o);
    };
  };
function Nd(e, t) {
  return (
    Object.keys(t).forEach(function (n) {
      t[n] instanceof Object && e[n] && Object.assign(t[n], Nd(e[n], t[n]));
    }),
    Ju(Ju({}, e), t)
  );
}
var dh = { type: "cancelation", msg: "operation is manually canceled" };
function Ul(e) {
  var t = !1,
    n = new Promise(function (r, o) {
      (e.then(function (l) {
        return t ? o(dh) : r(l);
      }),
        e.catch(o));
    });
  return (
    (n.cancel = function () {
      return (t = !0);
    }),
    n
  );
}
var fh = ["monaco"],
  ph = nh.create({
    config: rh,
    isInitialized: !1,
    resolve: null,
    reject: null,
    monaco: null,
  }),
  _d = $m(ph, 2),
  Br = _d[0],
  ul = _d[1];
function mh(e) {
  var t = ah.config(e),
    n = t.monaco,
    r = Im(t, fh);
  ul(function (o) {
    return { config: Nd(o.config, r), monaco: n };
  });
}
function hh() {
  var e = Br(function (t) {
    var n = t.monaco,
      r = t.isInitialized,
      o = t.resolve;
    return { monaco: n, isInitialized: r, resolve: o };
  });
  if (!e.isInitialized) {
    if ((ul({ isInitialized: !0 }), e.monaco))
      return (e.resolve(e.monaco), Ul(Bl));
    if (window.monaco && window.monaco.editor)
      return (Pd(window.monaco), e.resolve(window.monaco), Ul(Bl));
    ch(gh, yh)(xh);
  }
  return Ul(Bl);
}
function gh(e) {
  return document.body.appendChild(e);
}
function vh(e) {
  var t = document.createElement("script");
  return (e && (t.src = e), t);
}
function yh(e) {
  var t = Br(function (r) {
      var o = r.config,
        l = r.reject;
      return { config: o, reject: l };
    }),
    n = vh("".concat(t.config.paths.vs, "/loader.js"));
  return (
    (n.onload = function () {
      return e();
    }),
    (n.onerror = t.reject),
    n
  );
}
function xh() {
  var e = Br(function (n) {
      var r = n.config,
        o = n.resolve,
        l = n.reject;
      return { config: r, resolve: o, reject: l };
    }),
    t = window.require;
  (t.config(e.config),
    t(
      ["vs/editor/editor.main"],
      function (n) {
        var r = n.m || n;
        (Pd(r), e.resolve(r));
      },
      function (n) {
        e.reject(n);
      },
    ));
}
function Pd(e) {
  Br().monaco || ul({ monaco: e });
}
function wh() {
  return Br(function (e) {
    var t = e.monaco;
    return t;
  });
}
var Bl = new Promise(function (e, t) {
    return ul({ resolve: e, reject: t });
  }),
  zd = { config: mh, init: hh, __getMonacoInstance: wh },
  Sh = {
    wrapper: { display: "flex", position: "relative", textAlign: "initial" },
    fullWidth: { width: "100%" },
    hide: { display: "none" },
  },
  bl = Sh,
  kh = {
    container: {
      display: "flex",
      height: "100%",
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
  },
  Ch = kh;
function Eh({ children: e }) {
  return We.createElement("div", { style: Ch.container }, e);
}
var jh = Eh,
  Rh = jh;
function Th({
  width: e,
  height: t,
  isEditorReady: n,
  loading: r,
  _ref: o,
  className: l,
  wrapperProps: i,
}) {
  return We.createElement(
    "section",
    { style: { ...bl.wrapper, width: e, height: t }, ...i },
    !n && We.createElement(Rh, null, r),
    We.createElement("div", {
      ref: o,
      style: { ...bl.fullWidth, ...(!n && bl.hide) },
      className: l,
    }),
  );
}
var Nh = Th,
  Ld = E.memo(Nh);
function _h(e) {
  E.useEffect(e, []);
}
var Md = _h;
function Ph(e, t, n = !0) {
  let r = E.useRef(!0);
  E.useEffect(
    r.current || !n
      ? () => {
          r.current = !1;
        }
      : e,
    t,
  );
}
var Oe = Ph;
function gr() {}
function Rn(e, t, n, r) {
  return zh(e, r) || Lh(e, t, n, r);
}
function zh(e, t) {
  return e.editor.getModel(Od(e, t));
}
function Lh(e, t, n, r) {
  return e.editor.createModel(t, n, r ? Od(e, r) : void 0);
}
function Od(e, t) {
  return e.Uri.parse(t);
}
function Mh({
  original: e,
  modified: t,
  language: n,
  originalLanguage: r,
  modifiedLanguage: o,
  originalModelPath: l,
  modifiedModelPath: i,
  keepCurrentOriginalModel: s = !1,
  keepCurrentModifiedModel: u = !1,
  theme: a = "light",
  loading: m = "Loading...",
  options: c = {},
  height: v = "100%",
  width: w = "100%",
  className: C,
  wrapperProps: y = {},
  beforeMount: N = gr,
  onMount: p = gr,
}) {
  let [d, h] = E.useState(!1),
    [g, S] = E.useState(!0),
    x = E.useRef(null),
    k = E.useRef(null),
    j = E.useRef(null),
    O = E.useRef(p),
    R = E.useRef(N),
    F = E.useRef(!1);
  (Md(() => {
    let $ = zd.init();
    return (
      $.then((B) => (k.current = B) && S(!1)).catch(
        (B) =>
          (B == null ? void 0 : B.type) !== "cancelation" &&
          console.error("Monaco initialization: error:", B),
      ),
      () => (x.current ? Ce() : $.cancel())
    );
  }),
    Oe(
      () => {
        if (x.current && k.current) {
          let $ = x.current.getOriginalEditor(),
            B = Rn(k.current, e || "", r || n || "text", l || "");
          B !== $.getModel() && $.setModel(B);
        }
      },
      [l],
      d,
    ),
    Oe(
      () => {
        if (x.current && k.current) {
          let $ = x.current.getModifiedEditor(),
            B = Rn(k.current, t || "", o || n || "text", i || "");
          B !== $.getModel() && $.setModel(B);
        }
      },
      [i],
      d,
    ),
    Oe(
      () => {
        let $ = x.current.getModifiedEditor();
        $.getOption(k.current.editor.EditorOption.readOnly)
          ? $.setValue(t || "")
          : t !== $.getValue() &&
            ($.executeEdits("", [
              {
                range: $.getModel().getFullModelRange(),
                text: t || "",
                forceMoveMarkers: !0,
              },
            ]),
            $.pushUndoStop());
      },
      [t],
      d,
    ),
    Oe(
      () => {
        var $, B;
        (B = ($ = x.current) == null ? void 0 : $.getModel()) == null ||
          B.original.setValue(e || "");
      },
      [e],
      d,
    ),
    Oe(
      () => {
        let { original: $, modified: B } = x.current.getModel();
        (k.current.editor.setModelLanguage($, r || n || "text"),
          k.current.editor.setModelLanguage(B, o || n || "text"));
      },
      [n, r, o],
      d,
    ),
    Oe(
      () => {
        var $;
        ($ = k.current) == null || $.editor.setTheme(a);
      },
      [a],
      d,
    ),
    Oe(
      () => {
        var $;
        ($ = x.current) == null || $.updateOptions(c);
      },
      [c],
      d,
    ));
  let te = E.useCallback(() => {
      var ue;
      if (!k.current) return;
      R.current(k.current);
      let $ = Rn(k.current, e || "", r || n || "text", l || ""),
        B = Rn(k.current, t || "", o || n || "text", i || "");
      (ue = x.current) == null || ue.setModel({ original: $, modified: B });
    }, [n, t, o, e, r, l, i]),
    G = E.useCallback(() => {
      var $;
      !F.current &&
        j.current &&
        ((x.current = k.current.editor.createDiffEditor(j.current, {
          automaticLayout: !0,
          ...c,
        })),
        te(),
        ($ = k.current) == null || $.editor.setTheme(a),
        h(!0),
        (F.current = !0));
    }, [c, a, te]);
  (E.useEffect(() => {
    d && O.current(x.current, k.current);
  }, [d]),
    E.useEffect(() => {
      !g && !d && G();
    }, [g, d, G]));
  function Ce() {
    var B, ue, P, D;
    let $ = (B = x.current) == null ? void 0 : B.getModel();
    (s || (ue = $ == null ? void 0 : $.original) == null || ue.dispose(),
      u || (P = $ == null ? void 0 : $.modified) == null || P.dispose(),
      (D = x.current) == null || D.dispose());
  }
  return We.createElement(Ld, {
    width: w,
    height: v,
    isEditorReady: d,
    loading: m,
    _ref: j,
    className: C,
    wrapperProps: y,
  });
}
var Oh = Mh;
E.memo(Oh);
function Ah(e) {
  let t = E.useRef();
  return (
    E.useEffect(() => {
      t.current = e;
    }, [e]),
    t.current
  );
}
var Ih = Ah,
  so = new Map();
function Dh({
  defaultValue: e,
  defaultLanguage: t,
  defaultPath: n,
  value: r,
  language: o,
  path: l,
  theme: i = "light",
  line: s,
  loading: u = "Loading...",
  options: a = {},
  overrideServices: m = {},
  saveViewState: c = !0,
  keepCurrentModel: v = !1,
  width: w = "100%",
  height: C = "100%",
  className: y,
  wrapperProps: N = {},
  beforeMount: p = gr,
  onMount: d = gr,
  onChange: h,
  onValidate: g = gr,
}) {
  let [S, x] = E.useState(!1),
    [k, j] = E.useState(!0),
    O = E.useRef(null),
    R = E.useRef(null),
    F = E.useRef(null),
    te = E.useRef(d),
    G = E.useRef(p),
    Ce = E.useRef(),
    $ = E.useRef(r),
    B = Ih(l),
    ue = E.useRef(!1),
    P = E.useRef(!1);
  (Md(() => {
    let A = zd.init();
    return (
      A.then((I) => (O.current = I) && j(!1)).catch(
        (I) =>
          (I == null ? void 0 : I.type) !== "cancelation" &&
          console.error("Monaco initialization: error:", I),
      ),
      () => (R.current ? U() : A.cancel())
    );
  }),
    Oe(
      () => {
        var I, Q, K, de;
        let A = Rn(O.current, e || r || "", t || o || "", l || n || "");
        A !== ((I = R.current) == null ? void 0 : I.getModel()) &&
          (c && so.set(B, (Q = R.current) == null ? void 0 : Q.saveViewState()),
          (K = R.current) == null || K.setModel(A),
          c && ((de = R.current) == null || de.restoreViewState(so.get(l))));
      },
      [l],
      S,
    ),
    Oe(
      () => {
        var A;
        (A = R.current) == null || A.updateOptions(a);
      },
      [a],
      S,
    ),
    Oe(
      () => {
        !R.current ||
          r === void 0 ||
          (R.current.getOption(O.current.editor.EditorOption.readOnly)
            ? R.current.setValue(r)
            : r !== R.current.getValue() &&
              ((P.current = !0),
              R.current.executeEdits("", [
                {
                  range: R.current.getModel().getFullModelRange(),
                  text: r,
                  forceMoveMarkers: !0,
                },
              ]),
              R.current.pushUndoStop(),
              (P.current = !1)));
      },
      [r],
      S,
    ),
    Oe(
      () => {
        var I, Q;
        let A = (I = R.current) == null ? void 0 : I.getModel();
        A && o && ((Q = O.current) == null || Q.editor.setModelLanguage(A, o));
      },
      [o],
      S,
    ),
    Oe(
      () => {
        var A;
        s !== void 0 && ((A = R.current) == null || A.revealLine(s));
      },
      [s],
      S,
    ),
    Oe(
      () => {
        var A;
        (A = O.current) == null || A.editor.setTheme(i);
      },
      [i],
      S,
    ));
  let D = E.useCallback(() => {
    var A;
    if (!(!F.current || !O.current) && !ue.current) {
      G.current(O.current);
      let I = l || n,
        Q = Rn(O.current, r || e || "", t || o || "", I || "");
      ((R.current =
        (A = O.current) == null
          ? void 0
          : A.editor.create(
              F.current,
              { model: Q, automaticLayout: !0, ...a },
              m,
            )),
        c && R.current.restoreViewState(so.get(I)),
        O.current.editor.setTheme(i),
        s !== void 0 && R.current.revealLine(s),
        x(!0),
        (ue.current = !0));
    }
  }, [e, t, n, r, o, l, a, m, c, i, s]);
  (E.useEffect(() => {
    S && te.current(R.current, O.current);
  }, [S]),
    E.useEffect(() => {
      !k && !S && D();
    }, [k, S, D]),
    ($.current = r),
    E.useEffect(() => {
      var A, I;
      S &&
        h &&
        ((A = Ce.current) == null || A.dispose(),
        (Ce.current =
          (I = R.current) == null
            ? void 0
            : I.onDidChangeModelContent((Q) => {
                P.current || h(R.current.getValue(), Q);
              })));
    }, [S, h]),
    E.useEffect(() => {
      if (S) {
        let A = O.current.editor.onDidChangeMarkers((I) => {
          var K;
          let Q = (K = R.current.getModel()) == null ? void 0 : K.uri;
          if (Q && I.find((de) => de.path === Q.path)) {
            let de = O.current.editor.getModelMarkers({ resource: Q });
            g == null || g(de);
          }
        });
        return () => {
          A == null || A.dispose();
        };
      }
      return () => {};
    }, [S, g]));
  function U() {
    var A, I;
    ((A = Ce.current) == null || A.dispose(),
      v
        ? c && so.set(l, R.current.saveViewState())
        : (I = R.current.getModel()) == null || I.dispose(),
      R.current.dispose());
  }
  return We.createElement(Ld, {
    width: w,
    height: C,
    isEditorReady: S,
    loading: u,
    _ref: F,
    className: y,
    wrapperProps: N,
  });
}
var $h = Dh,
  Fh = E.memo($h),
  Uh = Fh;
const na = (e) => {
    let t;
    const n = new Set(),
      r = (a, m) => {
        const c = typeof a == "function" ? a(t) : a;
        if (!Object.is(c, t)) {
          const v = t;
          ((t =
            (m ?? (typeof c != "object" || c === null))
              ? c
              : Object.assign({}, t, c)),
            n.forEach((w) => w(t, v)));
        }
      },
      o = () => t,
      s = {
        setState: r,
        getState: o,
        getInitialState: () => u,
        subscribe: (a) => (n.add(a), () => n.delete(a)),
      },
      u = (t = e(r, o, s));
    return s;
  },
  Bh = (e) => (e ? na(e) : na),
  bh = (e) => e;
function Wh(e, t = bh) {
  const n = We.useSyncExternalStore(
    e.subscribe,
    We.useCallback(() => t(e.getState()), [e, t]),
    We.useCallback(() => t(e.getInitialState()), [e, t]),
  );
  return (We.useDebugValue(n), n);
}
const ra = (e) => {
    const t = Bh(e),
      n = (r) => Wh(t, r);
    return (Object.assign(n, t), n);
  },
  Hh = (e) => (e ? ra(e) : ra),
  Os = "incremental-coding-game-state",
  qt = {
    resources: { A: 0, B: 0, C: 0 },
    tech: {
      whileUnlocked: !1,
      convertAToBUnlocked: !1,
      varsUnlocked: !1,
      mathFunctionsUnlocked: !1,
      resourceCUnlocked: !1,
      ifStatementsUnlocked: !1,
      userFunctionsUnlocked: !1,
      processingSpeed1Unlocked: !1,
    },
    virtualTime: 0,
  };
function oa() {
  try {
    const e = localStorage.getItem(Os);
    if (e) {
      const t = JSON.parse(e);
      return {
        resources: { ...qt.resources, ...t.resources },
        tech: { ...qt.tech, ...t.tech },
        virtualTime: t.virtualTime ?? qt.virtualTime,
      };
    }
  } catch (e) {
    console.warn("Failed to load game state from localStorage", e);
  }
  return { ...qt };
}
function Kt(e) {
  try {
    localStorage.setItem(Os, JSON.stringify(e));
  } catch (t) {
    console.warn("Failed to save game state to localStorage", t);
  }
}
const q = Hh((e, t) => {
  const n = oa();
  return {
    resources: n.resources,
    tech: n.tech,
    virtualTime: n.virtualTime,
    setResources: (r) => {
      const l = { ...t(), resources: r };
      (Kt(l), e({ resources: r }));
    },
    setTech: (r) => {
      const l = { ...t(), tech: r };
      (Kt(l), e({ tech: r }));
    },
    addResource: (r, o) => {
      const l = t(),
        i = { ...l.resources };
      i[r] += o;
      const s = { ...l, resources: i };
      (Kt(s), e({ resources: i }));
    },
    consumeResource: (r, o) => {
      const l = t();
      if (l.resources[r] >= o) {
        const i = { ...l.resources };
        i[r] -= o;
        const s = { ...l, resources: i };
        return (Kt(s), e({ resources: i }), !0);
      }
      return !1;
    },
    consumeResources: (r) => {
      const o = t();
      for (const s of r) if (o.resources[s.resource] < s.amount) return !1;
      const l = { ...o.resources };
      for (const s of r) l[s.resource] -= s.amount;
      const i = { ...o, resources: l };
      return (Kt(i), e({ resources: l }), !0);
    },
    unlockTech: (r) => {
      const o = t(),
        l = { ...o.tech };
      l[r] = !0;
      const i = { ...o, tech: l };
      (Kt(i), e({ tech: l }));
    },
    addVirtualTime: (r) => {
      const o = t(),
        l = o.virtualTime + r,
        i = { ...o, virtualTime: l };
      (Kt(i), e({ virtualTime: l }));
    },
    syncFromLocalStorage: () => {
      const r = oa();
      e({ resources: r.resources, tech: r.tech, virtualTime: r.virtualTime });
    },
    resetGameState: () => {
      (localStorage.removeItem(Os),
        e({
          resources: qt.resources,
          tech: qt.tech,
          virtualTime: qt.virtualTime,
        }));
    },
  };
});
function Vh() {
  if (typeof import.meta < "u" && import.meta.vitest) return !0;
  try {
    const e = globalThis.process;
    if (e && e.env && e.env.NODE_ENV === "test") return !0;
  } catch {}
  return typeof globalThis < "u" && "vitest" in globalThis;
}
const Qh = Vh();
function Kh(e) {
  return typeof window > "u"
    ? null
    : new URLSearchParams(window.location.search).get(e);
}
function Yh() {
  const e = Kh("speed");
  if (e) {
    const t = parseFloat(e);
    if (!isNaN(t) && t >= 0 && t <= 1) return t;
  }
  try {
    const t = globalThis.process;
    if (t && t.env && t.env.VITE_API_SPEED) {
      const n = parseFloat(t.env.VITE_API_SPEED);
      if (!isNaN(n) && n >= 0 && n <= 1) return n;
    }
  } catch {}
  return Qh ? 0.001 : null;
}
function Xh() {
  return Yh();
}
const Gh = [
  "produceResourceA",
  "convertAToB",
  "getResourceCount",
  "log",
  "makeResourceC",
];
function Zh() {
  const e = Xh();
  if (e !== null) return e;
  const t = q.getState().tech;
  let n = 1;
  return (t.processingSpeed1Unlocked && (n *= 0.8), n);
}
async function tr(e, t, n) {
  var c, v, w, C, y, N, p, d, h, g;
  (c = t.throwIfCancelled) == null || c.call(t);
  const r = Zh(),
    o = Math.max(0, e * r),
    l = Date.now(),
    i = t.lineNumber || 0,
    s = t.functionName;
  ((v = t.isCancelled) != null && v.call(t)) ||
    (w = t.onStart) == null ||
    w.call(t, i, s, o);
  let u = null,
    a = null,
    m = null;
  try {
    if ((C = t.isCancelled) != null && C.call(t)) return;
    ((u = setInterval(() => {
      var k, j;
      try {
        (k = t.throwIfCancelled) == null || k.call(t);
      } catch {
        u && (clearInterval(u), (u = null));
        return;
      }
      const S = Date.now() - l,
        x = Math.min((S / o) * 100, 100);
      (j = t.onProgress) == null || j.call(t, i, x);
    }, 16)),
      await new Promise((S, x) => {
        var k;
        try {
          (k = t.throwIfCancelled) == null || k.call(t);
        } catch (j) {
          x(j);
          return;
        }
        ((a = setTimeout(() => {
          S();
        }, o)),
          (m = setInterval(() => {
            var j;
            try {
              (j = t.throwIfCancelled) == null || j.call(t);
            } catch (O) {
              (m && (clearInterval(m), (m = null)),
                a && (clearTimeout(a), (a = null)),
                x(O));
            }
          }, 16)));
      }),
      (y = t.throwIfCancelled) == null || y.call(t),
      await n(),
      (N = t.throwIfCancelled) == null || N.call(t));
  } catch (S) {
    if (
      (S instanceof Error && S.name === "CancellationError") ||
      !((p = t.isCancelled) != null && p.call(t))
    )
      throw S;
  } finally {
    (u && clearInterval(u),
      m && clearInterval(m),
      a && clearTimeout(a),
      ((d = t.isCancelled) != null && d.call(t)) ||
        ((h = t.onProgress) == null || h.call(t, i, 100),
        (g = t.onComplete) == null || g.call(t, i, s, o)));
  }
}
function Jh(e) {
  return {
    async produceResourceA() {
      var r;
      const n = {
        ...e,
        functionName: "produceResourceA",
        lineNumber: e.lineNumber,
      };
      return (
        await tr(2e3, n, () => {
          var o;
          ((o = n.isCancelled) != null && o.call(n)) ||
            (q.getState().addResource("A", 1), q.getState().addVirtualTime(2));
        }),
        (r = n.isCancelled) != null && r.call(n) ? 0 : 1
      );
    },
    async convertAToB() {
      var o;
      const n = { ...e, functionName: "convertAToB", lineNumber: e.lineNumber };
      let r = !1;
      return (
        await tr(3e3, n, () => {
          var i, s;
          if ((i = n.isCancelled) != null && i.call(n)) return;
          const l = q.getState();
          if (l.consumeResource("A", 2))
            (l.addResource("B", 1), l.addVirtualTime(3), (r = !0));
          else {
            const u = l.resources.A,
              a = n.lineNumber !== void 0 ? ` (line ${n.lineNumber})` : "";
            (s = e.onLog) == null ||
              s.call(
                e,
                `⚠️ Warning: convertAToB() failed${a} - insufficient resources. Required: 2 A, Available: ${u} A`,
              );
          }
        }),
        (o = n.isCancelled) != null && o.call(n) ? 0 : r ? 1 : 0
      );
    },
    async getResourceCount(n) {
      var l;
      const r = {
        ...e,
        functionName: "getResourceCount",
        lineNumber: e.lineNumber,
      };
      let o = 0;
      return (
        await tr(1e3, r, () => {
          var s;
          if ((s = r.isCancelled) != null && s.call(r)) return;
          const i = q.getState().resources;
          (n === "A"
            ? (o = i.A)
            : n === "B"
              ? (o = i.B)
              : n === "C" && (o = i.C),
            q.getState().addVirtualTime(1));
        }),
        (l = r.isCancelled) != null && l.call(r) ? 0 : o
      );
    },
    async log(n) {
      const r = { ...e, functionName: "log", lineNumber: e.lineNumber };
      await tr(500, r, () => {
        var o;
        (q.getState().addVirtualTime(0.5),
          (o = e.onLog) == null || o.call(e, n));
      });
    },
    async makeResourceC() {
      var o;
      const n = {
        ...e,
        functionName: "makeResourceC",
        lineNumber: e.lineNumber,
      };
      let r = 0;
      return (
        await tr(3e3, n, () => {
          var i, s;
          if ((i = n.isCancelled) != null && i.call(n)) return;
          const l = q.getState();
          if (
            l.consumeResources([
              { resource: "A", amount: 3 },
              { resource: "B", amount: 1 },
            ])
          )
            (l.addResource("C", 1), l.addVirtualTime(3), (r = 1));
          else {
            const u = l.resources.A,
              a = l.resources.B,
              m = n.lineNumber !== void 0 ? ` (line ${n.lineNumber})` : "";
            ((s = e.onLog) == null ||
              s.call(
                e,
                `⚠️ Warning: makeResourceC() failed${m} - insufficient resources. Required: 3 A, 1 B. Available: ${u} A, ${a} B`,
              ),
              (r = 0));
          }
        }),
        (o = n.isCancelled) != null && o.call(n) ? 0 : r
      );
    },
  };
}
const it = [
  {
    id: "whileUnlocked",
    name: "While Loops",
    description: "You can now use while loops to automate your code",
    threshold: (e) => e.A >= 5,
    cost: [{ resource: "A", amount: 5 }],
    unlocked: !1,
    validationRegex: /\bwhile\s*\(/,
    validationErrorMessage:
      "While loops are not unlocked yet. Produce 5 A to unlock them.",
    icon: "∞",
    dependencies: [],
    position: { row: 0, col: 0 },
  },
  {
    id: "convertAToBUnlocked",
    name: "Resource Conversion",
    description: "Unlock convertAToB() to convert 2 A into 1 B",
    threshold: (e) => e.A >= 15,
    cost: [{ resource: "A", amount: 15 }],
    unlocked: !1,
    validationRegex: /\bconvertAToB\s*\(/,
    validationErrorMessage:
      "convertAToB() is not unlocked yet. Produce 15 A to unlock it.",
    icon: "🟪",
    dependencies: ["whileUnlocked"],
    position: { row: 0, col: 1 },
  },
  {
    id: "varsUnlocked",
    name: "Variables",
    description:
      "Functions return values. Try using variables to store results",
    threshold: (e) => e.B >= 5,
    cost: [{ resource: "B", amount: 5 }],
    unlocked: !1,
    validationRegex: /^\s*(let|const|var)\s+/,
    validationErrorMessage:
      "Variables are not unlocked yet. Produce 5 B to unlock them.",
    icon: "x",
    dependencies: ["convertAToBUnlocked"],
    position: { row: 1, col: 1 },
  },
  {
    id: "mathFunctionsUnlocked",
    name: "Math Operators",
    description:
      "Unlock basic math operators: +, -, *, /, %, +=, -=, *=, /=, %=, ++, --",
    threshold: (e) => e.B >= 10,
    cost: [{ resource: "B", amount: 10 }],
    unlocked: !1,
    validationRegex:
      /[+\-*/%]=|\+\+|--|[+\*/%]|[a-zA-Z0-9_\)\]\}]\s*-\s*[a-zA-Z0-9_\(\[\{]/,
    validationErrorMessage:
      "Math operators are not unlocked yet. Produce 10 B to unlock them.",
    icon: "±",
    dependencies: ["varsUnlocked"],
    position: { row: 2, col: 1 },
  },
  {
    id: "resourceCUnlocked",
    name: "Resource Conversion 2",
    description: "Unlock  makeResourceC()",
    threshold: (e) => e.B >= 10,
    cost: [
      { resource: "A", amount: 20 },
      { resource: "B", amount: 10 },
    ],
    unlocked: !1,
    validationRegex: /\b(makeResourceC)\s*\(/,
    validationErrorMessage:
      "Resource C is not unlocked yet. Produce 10 B to unlock it.",
    icon: "🟧",
    dependencies: ["convertAToBUnlocked"],
    position: { row: 1, col: 2 },
  },
  {
    id: "ifStatementsUnlocked",
    name: "If Statements",
    description: "Use conditional logic with if/else statements",
    threshold: (e) => e.C >= 5,
    cost: [{ resource: "C", amount: 5 }],
    unlocked: !1,
    validationRegex: /\bif\s*\(/,
    validationErrorMessage:
      "If statements are not unlocked yet. Produce 5 C to unlock them.",
    icon: "?",
    dependencies: ["resourceCUnlocked"],
    position: { row: 2, col: 2 },
  },
  {
    id: "userFunctionsUnlocked",
    name: "User Functions",
    description: "Define your own functions to organize and reuse code",
    threshold: (e) => e.C >= 10,
    cost: [{ resource: "C", amount: 10 }],
    unlocked: !1,
    validationRegex:
      /\bfunction\s+\w+\s*\(|=\s*(async\s+)?(\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/,
    validationErrorMessage:
      "User functions are not unlocked yet. Produce 10 C to unlock them.",
    icon: "ƒ",
    dependencies: ["ifStatementsUnlocked"],
    position: { row: 3, col: 2 },
  },
  {
    id: "processingSpeed1Unlocked",
    name: "Processing Speed I",
    description: "Reduce all function execution times by 20%",
    threshold: (e) => e.B >= 20,
    cost: [{ resource: "B", amount: 20 }],
    unlocked: !1,
    icon: "⚡",
    dependencies: ["mathFunctionsUnlocked"],
    position: { row: 3, col: 1 },
  },
];
function Di(e, t) {
  const n = e ?? q.getState().resources,
    r = t ?? q.getState().tech,
    o = [];
  return (
    it.forEach((l) => {
      const i = r[l.id],
        s = l.threshold(n),
        u = !l.dependencies || l.dependencies.every((a) => r[a]);
      s && !i && u && o.push(l);
    }),
    o
  );
}
function $i() {
  const e = q.getState().tech,
    t = ["produceResourceA", "getResourceCount", "log"];
  return (
    e.convertAToBUnlocked && t.push("convertAToB"),
    e.resourceCUnlocked && t.push("makeResourceC"),
    t
  );
}
function Ar(e) {
  const t = q.getState().tech,
    n = [];
  return (
    e.split(/\r?\n/).forEach((o, l) => {
      const i = l + 1,
        s = o.trim();
      !s ||
        s.startsWith("//") ||
        it.forEach((u) => {
          if (t[u.id] || !u.validationRegex || !u.validationErrorMessage)
            return;
          new RegExp(u.validationRegex.source, u.validationRegex.flags).test(
            o,
          ) &&
            n.push({
              lineNumber: i,
              message: u.validationErrorMessage,
              feature: u.id,
            });
        });
    }),
    n
  );
}
const qh = We.forwardRef(
  (
    {
      code: e,
      onCodeChange: t,
      executionEvents: n,
      onOpenTechTree: r,
      scrollToLineNumber: o,
    },
    l,
  ) => {
    const i = E.useRef(null),
      s = E.useRef(null),
      u = E.useRef([]),
      a = E.useRef([]),
      m = E.useRef(r),
      c = E.useRef([]);
    (E.useImperativeHandle(l, () => ({
      scrollToLine: (w) => {
        i.current &&
          (i.current.revealLineInCenter(w),
          i.current.setPosition({ lineNumber: w, column: 1 }));
      },
    })),
      E.useEffect(() => {
        if (o != null && i.current) {
          const w = i.current;
          (w
            .getVisibleRanges()
            .some((N) => o >= N.startLineNumber && o <= N.endLineNumber) ||
            w.revealLineInCenter(o),
            w.setPosition({ lineNumber: o, column: 1 }));
        }
      }, [o]),
      E.useEffect(() => {
        m.current = r;
      }, [r]),
      E.useEffect(() => {
        if (!i.current) return;
        const w = i.current;
        if (!w.getModel()) return;
        u.current = w.deltaDecorations(u.current, []);
        let y = null,
          N = [];
        n.forEach((p) => {
          if (p.type === "lineChange")
            (y !== null &&
              ((u.current = w.deltaDecorations(u.current, [])), (N = [])),
              (y = p.lineNumber),
              (u.current = w.deltaDecorations(u.current, [
                {
                  range: {
                    startLineNumber: p.lineNumber,
                    startColumn: 1,
                    endLineNumber: p.lineNumber,
                    endColumn: 1,
                  },
                  options: { isWholeLine: !0, className: "executing-line" },
                },
              ])));
          else if (p.type === "functionProgress" && y === p.lineNumber) {
            const d = p.progress,
              h = document.querySelector(".executing-line");
            (h && h.style.setProperty("--progress", `${d}%`),
              (u.current = w.deltaDecorations(u.current, [
                {
                  range: {
                    startLineNumber: p.lineNumber,
                    startColumn: 1,
                    endLineNumber: p.lineNumber,
                    endColumn: 1,
                  },
                  options: {
                    isWholeLine: !0,
                    className: "executing-line",
                    after: {
                      content: ` ${Math.round(d)}%`,
                      inlineClassName: "progress-text",
                    },
                  },
                },
              ])));
          } else
            (p.type === "functionComplete" || p.type === "complete") &&
              ((u.current = w.deltaDecorations(u.current, [])),
              (N = w.deltaDecorations(N, [])),
              (y = null));
        });
      }, [n]));
    const v = (w, C) => {
      ((i.current = w),
        (s.current = C),
        C.languages.register({ id: "game-script" }),
        C.languages.setLanguageConfiguration("game-script", {
          comments: { lineComment: "//", blockComment: ["/*", "*/"] },
          brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"],
          ],
          autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: "`", close: "`" },
          ],
          surroundingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: "`", close: "`" },
          ],
        }));
      const y = Gh.join("|"),
        N = new RegExp(`\\b(${y})\\b`);
      C.languages.setMonarchTokensProvider("game-script", {
        tokenizer: {
          root: [
            [/\/\/.*$/, "comment"],
            [/\/\*[\s\S]*?\*\//, "comment"],
            [/"([^"\\]|\\.)*$/, "string.invalid"],
            [/'([^'\\]|\\.)*$/, "string.invalid"],
            [/"/, "string", "@string_double"],
            [/'/, "string", "@string_single"],
            [/`/, "string", "@string_backtick"],
            [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
            [/0[xX][0-9a-fA-F]+/, "number.hex"],
            [/\d+/, "number"],
            [/[;,.]/, "delimiter"],
            [/[{}()\[\]]/, "@brackets"],
            [N, "api-function"],
            [
              /[a-z_$][\w$]*/,
              { cases: { "@keywords": "keyword", "@default": "identifier" } },
            ],
            [/[A-Z][\w\$]*/, "type.identifier"],
          ],
          string_double: [
            [/[^\\"]+/, "string"],
            [/"/, "string", "@pop"],
          ],
          string_single: [
            [/[^\\']+/, "string"],
            [/'/, "string", "@pop"],
          ],
          string_backtick: [
            [/[^\\`]+/, "string"],
            [/`/, "string", "@pop"],
          ],
        },
        keywords: [
          "while",
          "if",
          "else",
          "let",
          "const",
          "var",
          "function",
          "async",
          "await",
          "return",
          "switch",
          "case",
          "break",
          "true",
          "false",
          "null",
          "undefined",
        ],
      });
      const p = {
        provideCompletionItems: (h, g) => {
          const S = $i(),
            x = h.getWordUntilPosition(g),
            k = {
              startLineNumber: g.lineNumber,
              startColumn: x.startColumn,
              endLineNumber: g.lineNumber,
              endColumn: x.endColumn,
            },
            j = {
              produceResourceA: {
                signature: "produceResourceA(): Promise<number>",
                description: "Produces 1 unit of resource A. Takes 2 seconds.",
              },
              convertAToB: {
                signature: "convertAToB(): Promise<number>",
                description:
                  "Converts 2 A into 1 B. Takes 3 seconds. Returns 1 if successful, 0 if not enough A.",
              },
              getResourceCount: {
                signature: "getResourceCount(name: string): Promise<number>",
                description:
                  "Gets the current count of a resource. Pass 'A' or 'B' as the name. Takes 1 second.",
              },
              log: {
                signature: "log(msg: string): Promise<void>",
                description:
                  "Logs a message to the console. Takes 0.5 seconds.",
              },
            };
          return {
            suggestions: S.map((R) => {
              const F = j[R];
              return {
                label: R,
                kind: C.languages.CompletionItemKind.Function,
                documentation: (F == null ? void 0 : F.description) || "",
                insertText: R + "()",
                detail: (F == null ? void 0 : F.signature) || R + "()",
                range: k,
              };
            }),
          };
        },
        triggerCharacters: [],
      };
      (C.languages.registerCompletionItemProvider("game-script", p),
        C.languages.registerCodeActionProvider("game-script", {
          provideCodeActions: (h, g, S) => {
            const x = [];
            return (
              S.markers.forEach((k) => {
                if (
                  k.source === "Validation" &&
                  k.message.includes("not unlocked yet")
                ) {
                  const j = c.current.find(
                      (R) => R.lineNumber === k.startLineNumber,
                    ),
                    O = (j == null ? void 0 : j.feature) || "";
                  x.push({
                    title: "🔓 Open Tech Tree to unlock",
                    diagnostics: [k],
                    kind: "quickfix",
                    isPreferred: !0,
                    edit: {
                      edits: [
                        {
                          resource: h.uri,
                          versionId: h.getVersionId(),
                          textEdit: {
                            range: {
                              startLineNumber: 1,
                              startColumn: 1,
                              endLineNumber: 1,
                              endColumn: 1,
                            },
                            text: `/* __OPEN_TECH_TREE__:${O} */`,
                          },
                        },
                      ],
                    },
                  });
                }
              }),
              { actions: x, dispose: () => {} }
            );
          },
        }),
        w.onDidChangeModelContent((h) => {
          const g = w.getModel();
          g &&
            h.changes.forEach((S) => {
              S.text.includes("__OPEN_TECH_TREE__") &&
                setTimeout(() => {
                  const x = g.getValue(),
                    k = /\/\* __OPEN_TECH_TREE__:(\w+) \*\//,
                    j = x.match(k);
                  if (j) {
                    const O = j[1];
                    (g.setValue(x.replace(k, "")), m.current && m.current(O));
                  }
                }, 0);
            });
        }),
        C.editor.defineTheme("game-script-theme", {
          base: "vs-dark",
          inherit: !0,
          rules: [
            { token: "api-function", foreground: "4ec9b0", fontStyle: "bold" },
          ],
          colors: {},
        }));
      const d = w.getModel();
      d &&
        (C.editor.setModelLanguage(d, "game-script"),
        C.editor.setTheme("game-script-theme"),
        setTimeout(() => {
          const h = Ar(e);
          c.current = h.map((S) => ({
            lineNumber: S.lineNumber,
            feature: S.feature,
          }));
          const g = h.map((S) => {
            const x = d.getLineContent(S.lineNumber).length;
            return {
              severity: C.MarkerSeverity.Error,
              startLineNumber: S.lineNumber,
              startColumn: 1,
              endLineNumber: S.lineNumber,
              endColumn: Math.max(1, x + 1),
              message: S.message,
              source: "Validation",
            };
          });
          (C.editor.setModelMarkers(d, "validation", g), (a.current = g));
        }, 200));
    };
    return (
      E.useEffect(() => {
        if (!i.current || !s.current) return;
        const w = i.current.getModel();
        if (!w) return;
        const y = setTimeout(() => {
          const N = Ar(e);
          c.current = N.map((d) => ({
            lineNumber: d.lineNumber,
            feature: d.feature,
          }));
          const p = N.map((d) => {
            const h = w.getLineContent(d.lineNumber).length;
            return {
              severity: s.current.MarkerSeverity.Error,
              startLineNumber: d.lineNumber,
              startColumn: 1,
              endLineNumber: d.lineNumber,
              endColumn: Math.max(1, h + 1),
              message: d.message,
              source: "Validation",
            };
          });
          (s.current.editor.setModelMarkers(w, "validation", p),
            (a.current = p));
        }, 100);
        return () => clearTimeout(y);
      }, [e]),
      f.jsxs("div", {
        style: { height: "100%", display: "flex", flexDirection: "column" },
        children: [
          f.jsx(Uh, {
            height: "100%",
            defaultLanguage: "game-script",
            value: e,
            onChange: (w) => t(w || ""),
            onMount: v,
            theme: "game-script-theme",
            options: {
              minimap: { enabled: !1 },
              fontSize: 14,
              wordWrap: "on",
              hover: { enabled: !0, delay: 200 },
              quickSuggestions: !0,
              suggestOnTriggerCharacters: !0,
              wordBasedSuggestions: "matchingDocuments",
              renderValidationDecorations: "on",
              "editor.hover.enabled": !0,
              "editor.hover.delay": 200,
              fixedOverflowWidgets: !0,
            },
          }),
          f.jsx("style", {
            children: `
        .executing-line {
          width: calc(100% - 24px) !important;
          background-color: rgba(255, 255, 0, 0.2) !important;
          border: 1px solid rgba(255, 255, 0, 0.5) !important;
          position: relative;
        }
        .executing-line::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: var(--progress, 0%);
          background-color: rgba(0, 128, 0, 0.4);
          transition: width 0.0016s linear;
          pointer-events: none;
        }
        .progress-text {
          color: #28a745;
          font-weight: bold;
        }
      `,
          }),
        ],
      })
    );
  },
);
function eg({ stats: e }) {
  const [t, n] = E.useState(!1);
  return f.jsxs("div", {
    style: {
      position: "fixed",
      right: "16px",
      top: "56px",
      width: "280px",
      backgroundColor: "rgba(30, 30, 30, 0.95)",
      border: "1px solid #3c3c3c",
      borderRadius: "4px",
      padding: "16px",
      zIndex: 9999,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
    },
    children: [
      f.jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        },
        children: [
          f.jsx("h3", {
            style: {
              margin: 0,
              color: "#cccccc",
              fontSize: "14px",
              fontWeight: 600,
            },
            children: "CPU",
          }),
          f.jsx("button", {
            onClick: () => n(!t),
            style: {
              padding: "4px 8px",
              fontSize: "11px",
              backgroundColor: "transparent",
              color: "#888",
              border: "1px solid #3c3c3c",
              borderRadius: "3px",
              cursor: "pointer",
            },
            children: t ? "Collapse" : "Expand",
          }),
        ],
      }),
      f.jsxs("div", {
        style: { display: "flex", flexDirection: "column", gap: "8px" },
        children: [
          f.jsxs("div", {
            children: [
              f.jsx("div", {
                style: { color: "#888", fontSize: "11px", marginBottom: "4px" },
                children: "Total Time",
              }),
              f.jsxs("div", {
                style: {
                  color: "#cccccc",
                  fontSize: "13px",
                  fontFamily: "monospace",
                },
                children: [e.totalTime.toFixed(2), " ms"],
              }),
            ],
          }),
          Object.keys(e.functionTimes).length > 0 &&
            f.jsxs("div", {
              children: [
                f.jsx("div", {
                  style: {
                    color: "#888",
                    fontSize: "11px",
                    marginBottom: "4px",
                  },
                  children: "Function Times",
                }),
                f.jsx("div", {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  },
                  children: Object.entries(e.functionTimes).map(([r, o]) =>
                    f.jsxs(
                      "div",
                      {
                        style: {
                          display: "flex",
                          justifyContent: "space-between",
                        },
                        children: [
                          f.jsxs("span", {
                            style: { color: "#cccccc", fontSize: "12px" },
                            children: [r, ":"],
                          }),
                          f.jsxs("span", {
                            style: {
                              color: "#888",
                              fontSize: "12px",
                              fontFamily: "monospace",
                            },
                            children: [o.toFixed(2), " ms"],
                          }),
                        ],
                      },
                      r,
                    ),
                  ),
                }),
              ],
            }),
          t &&
            f.jsx("div", {
              style: {
                marginTop: "8px",
                paddingTop: "8px",
                borderTop: "1px solid #3c3c3c",
              },
              children: f.jsx("div", {
                style: { color: "#888", fontSize: "11px" },
                children: "Detailed profiling coming soon...",
              }),
            }),
        ],
      }),
    ],
  });
}
function tg({ isOpen: e, onClose: t, scrollToSection: n }) {
  const r = q((s) => s.tech),
    [o, l] = E.useState($i()),
    i = E.useRef(null);
  return (
    E.useEffect(() => {
      e && l($i());
    }, [e, r]),
    E.useEffect(() => {
      if (e && n && i.current) {
        const s = i.current.querySelector(`[data-section-id="${n}"]`);
        s &&
          setTimeout(() => {
            (s.scrollIntoView({ behavior: "smooth", block: "start" }),
              (s.style.backgroundColor = "rgba(74, 158, 255, 0.2)"),
              setTimeout(() => {
                s.style.backgroundColor = "";
              }, 2e3));
          }, 100);
      }
    }, [e, n]),
    e
      ? f.jsx(f.Fragment, {
          children: f.jsx("div", {
            style: {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              zIndex: 1e4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
            onClick: t,
            children: f.jsxs("div", {
              style: {
                backgroundColor: "#1e1e1e",
                border: "2px solid #4a9eff",
                borderRadius: "8px",
                maxWidth: "800px",
                maxHeight: "80vh",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
                width: "90%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              },
              onClick: (s) => s.stopPropagation(),
              children: [
                f.jsxs("div", {
                  style: {
                    backgroundColor: "#2d2d2d",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #3c3c3c",
                    flexShrink: 0,
                  },
                  children: [
                    f.jsx("h2", {
                      style: {
                        margin: 0,
                        color: "#cccccc",
                        fontSize: "20px",
                        fontWeight: 500,
                      },
                      children: "Documentation",
                    }),
                    f.jsx("button", {
                      onClick: t,
                      style: {
                        padding: "2px 8px",
                        fontSize: "16px",
                        backgroundColor: "transparent",
                        color: "#cccccc",
                        border: "none",
                        cursor: "pointer",
                        lineHeight: "1",
                      },
                      children: "×",
                    }),
                  ],
                }),
                f.jsx("div", {
                  ref: i,
                  style: { flex: 1, overflowY: "auto", padding: "24px" },
                  children: f.jsxs("div", {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    },
                    children: [
                      f.jsxs("section", {
                        children: [
                          f.jsx("h3", {
                            style: {
                              color: "#4a9eff",
                              fontSize: "18px",
                              marginBottom: "12px",
                            },
                            children: "Basic Syntax",
                          }),
                          f.jsxs("div", {
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px",
                            },
                            children: [
                              f.jsxs("div", {
                                style: {
                                  padding: "12px",
                                  backgroundColor: "#2d2d2d",
                                  border: "1px solid #3c3c3c",
                                  borderRadius: "4px",
                                },
                                children: [
                                  f.jsxs("div", {
                                    style: {
                                      color: "#cccccc",
                                      fontSize: "13px",
                                      marginBottom: "8px",
                                    },
                                    children: [
                                      f.jsx("strong", {
                                        children: "Calling Functions:",
                                      }),
                                      " Type the function name followed by parentheses. If the function needs information, put it inside the parentheses.",
                                    ],
                                  }),
                                  f.jsx("div", {
                                    style: { marginTop: "8px" },
                                    children: f.jsxs("code", {
                                      style: {
                                        color: "#9d4edd",
                                        fontFamily: "monospace",
                                        fontSize: "12px",
                                        backgroundColor: "#1e1e1e",
                                        padding: "4px 8px",
                                        borderRadius: "3px",
                                        display: "block",
                                      },
                                      children: [
                                        "// Produce 1 A",
                                        f.jsx("br", {}),
                                        "produceResourceA()",
                                        f.jsx("br", {}),
                                        "getResourceCount('A')",
                                      ],
                                    }),
                                  }),
                                ],
                              }),
                              r.whileUnlocked &&
                                f.jsxs("div", {
                                  "data-section-id": "while-loops",
                                  style: {
                                    padding: "12px",
                                    backgroundColor: "#2d2d2d",
                                    border: "1px solid #3c3c3c",
                                    borderRadius: "4px",
                                    transition: "background-color 0.3s",
                                  },
                                  children: [
                                    f.jsxs("div", {
                                      style: {
                                        color: "#cccccc",
                                        fontSize: "13px",
                                        marginBottom: "8px",
                                      },
                                      children: [
                                        f.jsx("strong", {
                                          children: "While Loops:",
                                        }),
                                        " Repeat code while a condition is true. Use",
                                        " ",
                                        f.jsx("code", {
                                          style: {
                                            color: "#4a9eff",
                                            fontFamily: "monospace",
                                          },
                                          children: "while(true)",
                                        }),
                                        " ",
                                        "to loop forever (until you click Stop).",
                                      ],
                                    }),
                                    f.jsx("div", {
                                      style: { marginTop: "8px" },
                                      children: f.jsxs("code", {
                                        style: {
                                          color: "#9d4edd",
                                          fontFamily: "monospace",
                                          fontSize: "12px",
                                          backgroundColor: "#1e1e1e",
                                          padding: "4px 8px",
                                          borderRadius: "3px",
                                          display: "block",
                                        },
                                        children: [
                                          "// Loop forever to produce A",
                                          f.jsx("br", {}),
                                          "while (true) ",
                                          "{",
                                          f.jsx("br", {}),
                                          "  produceResourceA()",
                                          f.jsx("br", {}),
                                          "}",
                                        ],
                                      }),
                                    }),
                                  ],
                                }),
                              r.convertAToBUnlocked &&
                                f.jsxs("div", {
                                  "data-section-id": "resource-conversion",
                                  style: {
                                    padding: "12px",
                                    backgroundColor: "#2d2d2d",
                                    border: "1px solid #3c3c3c",
                                    borderRadius: "4px",
                                    marginBottom: "12px",
                                    transition: "background-color 0.3s",
                                  },
                                  children: [
                                    f.jsx("div", {
                                      style: {
                                        color: "#4a9eff",
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                        marginBottom: "8px",
                                      },
                                      children: "Resource Conversion",
                                    }),
                                    f.jsxs("div", {
                                      style: {
                                        color: "#cccccc",
                                        fontSize: "13px",
                                      },
                                      children: [
                                        "You can now convert resources using",
                                        " ",
                                        f.jsx("code", {
                                          style: {
                                            color: "#4a9eff",
                                            fontFamily: "monospace",
                                          },
                                          children: "convertAToB()",
                                        }),
                                        ".",
                                      ],
                                    }),
                                    f.jsx("div", {
                                      style: { marginTop: "8px" },
                                      children: f.jsxs("code", {
                                        style: {
                                          color: "#9d4edd",
                                          fontFamily: "monospace",
                                          fontSize: "12px",
                                          backgroundColor: "#1e1e1e",
                                          padding: "4px 8px",
                                          borderRadius: "3px",
                                          display: "block",
                                        },
                                        children: [
                                          "// Convert 2 A into 1 B ",
                                          f.jsx("br", {}),
                                          " convertAToB()",
                                        ],
                                      }),
                                    }),
                                  ],
                                }),
                              r.varsUnlocked &&
                                f.jsxs("div", {
                                  "data-section-id": "variables",
                                  style: {
                                    padding: "12px",
                                    backgroundColor: "#2d2d2d",
                                    border: "1px solid #3c3c3c",
                                    borderRadius: "4px",
                                    transition: "background-color 0.3s",
                                  },
                                  children: [
                                    f.jsxs("div", {
                                      style: {
                                        color: "#cccccc",
                                        fontSize: "13px",
                                        marginBottom: "8px",
                                      },
                                      children: [
                                        f.jsx("strong", {
                                          children: "Variables:",
                                        }),
                                        " Store values using",
                                        " ",
                                        f.jsx("code", {
                                          style: {
                                            color: "#4a9eff",
                                            fontFamily: "monospace",
                                          },
                                          children: "let",
                                        }),
                                        " ",
                                        "or",
                                        " ",
                                        f.jsx("code", {
                                          style: {
                                            color: "#4a9eff",
                                            fontFamily: "monospace",
                                          },
                                          children: "const",
                                        }),
                                        ". Functions return values that you can store.",
                                        f.jsx("br", {}),
                                        f.jsx("code", {
                                          style: {
                                            color: "#4a9eff",
                                            fontFamily: "monospace",
                                          },
                                          children: "let",
                                        }),
                                        " ",
                                        "is used to declare a variable that can be changed.",
                                        f.jsx("br", {}),
                                        f.jsx("code", {
                                          style: {
                                            color: "#4a9eff",
                                            fontFamily: "monospace",
                                          },
                                          children: "const",
                                        }),
                                        " ",
                                        "is used to declare a variable that cannot be changed.",
                                      ],
                                    }),
                                    f.jsx("div", {
                                      style: { marginTop: "8px" },
                                      children: f.jsxs("code", {
                                        style: {
                                          color: "#9d4edd",
                                          fontFamily: "monospace",
                                          fontSize: "12px",
                                          backgroundColor: "#1e1e1e",
                                          padding: "4px 8px",
                                          borderRadius: "3px",
                                          display: "block",
                                        },
                                        children: [
                                          "// Store the amount produced in a variable",
                                          f.jsx("br", {}),
                                          "let amount = produceResourceA()",
                                          f.jsx("br", {}),
                                          "// Store the total count of A",
                                          f.jsx("br", {}),
                                          "const count = getResourceCount('A')",
                                        ],
                                      }),
                                    }),
                                  ],
                                }),
                              r.mathFunctionsUnlocked &&
                                f.jsxs("div", {
                                  "data-section-id": "math-operators",
                                  style: {
                                    padding: "12px",
                                    backgroundColor: "#2d2d2d",
                                    border: "1px solid #3c3c3c",
                                    borderRadius: "4px",
                                    transition: "background-color 0.3s",
                                  },
                                  children: [
                                    f.jsxs("div", {
                                      style: {
                                        color: "#cccccc",
                                        fontSize: "13px",
                                        marginBottom: "8px",
                                      },
                                      children: [
                                        f.jsx("strong", {
                                          children: "Math Operators:",
                                        }),
                                        " Perform calculations using standard operators.",
                                      ],
                                    }),
                                    f.jsx("div", {
                                      style: { marginTop: "8px" },
                                      children: f.jsxs("code", {
                                        style: {
                                          color: "#9d4edd",
                                          fontFamily: "monospace",
                                          fontSize: "12px",
                                          backgroundColor: "#1e1e1e",
                                          padding: "4px 8px",
                                          borderRadius: "3px",
                                          display: "block",
                                        },
                                        children: [
                                          "// Basic operators: +, -, *, /, %",
                                          f.jsx("br", {}),
                                          "let sum = 5 + 3",
                                          f.jsx("br", {}),
                                          "let diff = 10 - 2",
                                          f.jsx("br", {}),
                                          "let product = 4 * 5",
                                          f.jsx("br", {}),
                                          "let quotient = 20 / 4",
                                          f.jsx("br", {}),
                                          "let remainder = 10 % 3",
                                          f.jsx("br", {}),
                                          f.jsx("br", {}),
                                          "// Compound assignment: +=, -=, *=, /=, %=",
                                          f.jsx("br", {}),
                                          "let count = 0",
                                          f.jsx("br", {}),
                                          "count += produceResourceA()",
                                          f.jsx("br", {}),
                                          f.jsx("br", {}),
                                          "// Increment/decrement: ++, --",
                                          f.jsx("br", {}),
                                          "let i = 0",
                                          f.jsx("br", {}),
                                          "i++",
                                          f.jsx("br", {}),
                                          "i--",
                                        ],
                                      }),
                                    }),
                                  ],
                                }),
                              r.ifStatementsUnlocked &&
                                f.jsxs("div", {
                                  "data-section-id": "if-statements",
                                  style: {
                                    padding: "12px",
                                    backgroundColor: "#2d2d2d",
                                    border: "1px solid #3c3c3c",
                                    borderRadius: "4px",
                                    transition: "background-color 0.3s",
                                  },
                                  children: [
                                    f.jsxs("div", {
                                      style: {
                                        color: "#cccccc",
                                        fontSize: "13px",
                                        marginBottom: "8px",
                                      },
                                      children: [
                                        f.jsx("strong", {
                                          children: "If Statements:",
                                        }),
                                        " Make decisions in your code. Execute code only when a condition is true.",
                                      ],
                                    }),
                                    f.jsx("div", {
                                      style: { marginTop: "8px" },
                                      children: f.jsxs("code", {
                                        style: {
                                          color: "#9d4edd",
                                          fontFamily: "monospace",
                                          fontSize: "12px",
                                          backgroundColor: "#1e1e1e",
                                          padding: "4px 8px",
                                          borderRadius: "3px",
                                          display: "block",
                                        },
                                        children: [
                                          "// Only convert if we have enough A",
                                          f.jsx("br", {}),
                                          "let a = getResourceCount('A')",
                                          f.jsx("br", {}),
                                          "if (a ",
                                          ">=",
                                          " 2) ",
                                          "{",
                                          f.jsx("br", {}),
                                          "  convertAToB()",
                                          f.jsx("br", {}),
                                          "}",
                                        ],
                                      }),
                                    }),
                                  ],
                                }),
                              r.userFunctionsUnlocked &&
                                f.jsxs("div", {
                                  "data-section-id": "user-functions",
                                  style: {
                                    padding: "12px",
                                    backgroundColor: "#2d2d2d",
                                    border: "1px solid #3c3c3c",
                                    borderRadius: "4px",
                                    transition: "background-color 0.3s",
                                  },
                                  children: [
                                    f.jsxs("div", {
                                      style: {
                                        color: "#cccccc",
                                        fontSize: "13px",
                                        marginBottom: "8px",
                                      },
                                      children: [
                                        f.jsx("strong", {
                                          children: "User Functions:",
                                        }),
                                        " Define your own functions to organize and reuse code. Functions can take parameters and return values.",
                                      ],
                                    }),
                                    f.jsx("div", {
                                      style: { marginTop: "8px" },
                                      children: f.jsxs("code", {
                                        style: {
                                          color: "#9d4edd",
                                          fontFamily: "monospace",
                                          fontSize: "12px",
                                          backgroundColor: "#1e1e1e",
                                          padding: "4px 8px",
                                          borderRadius: "3px",
                                          display: "block",
                                        },
                                        children: [
                                          "// Define a function to produce multiple A",
                                          f.jsx("br", {}),
                                          "function produceMultiple(count) ",
                                          "{",
                                          f.jsx("br", {}),
                                          "  let i = 0",
                                          f.jsx("br", {}),
                                          "  while (i < count) ",
                                          "{",
                                          f.jsx("br", {}),
                                          "    produceResourceA()",
                                          f.jsx("br", {}),
                                          "    i++",
                                          f.jsx("br", {}),
                                          "  ",
                                          "}",
                                          f.jsx("br", {}),
                                          "}",
                                          f.jsx("br", {}),
                                          f.jsx("br", {}),
                                          "// Call the function",
                                          f.jsx("br", {}),
                                          "produceMultiple(5)",
                                        ],
                                      }),
                                    }),
                                  ],
                                }),
                            ],
                          }),
                        ],
                      }),
                      f.jsxs("section", {
                        children: [
                          f.jsx("h3", {
                            style: {
                              color: "#4a9eff",
                              fontSize: "18px",
                              marginBottom: "12px",
                            },
                            children: "Available Functions",
                          }),
                          f.jsx("div", {
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px",
                            },
                            children: o.map((s) => {
                              let u = "",
                                a = "",
                                m = "",
                                c = "";
                              switch (s) {
                                case "produceResourceA":
                                  ((u =
                                    "Produces 1 unit of resource A. Takes 2 seconds to complete."),
                                    (a = "produceResourceA()"),
                                    (m = "Returns: 1 (the amount produced)"));
                                  break;
                                case "convertAToB":
                                  ((u =
                                    "Converts 2 units of A into 1 unit of B. Takes 3 seconds to complete. Only works if you have at least 2 A."),
                                    (a = "convertAToB()"),
                                    (m =
                                      "Returns: 1 if successful, 0 if you don't have enough A"));
                                  break;
                                case "getResourceCount":
                                  ((u =
                                    "Gets the current amount of a resource. Takes 1 second to complete."),
                                    (a = "getResourceCount('A')"),
                                    (m =
                                      "Returns: the number of that resource you have"));
                                  break;
                                case "log":
                                  ((u =
                                    "Prints a message to the log. Takes 0.5 seconds to complete."),
                                    (a = "log('Hello!')"),
                                    (m = "Returns: nothing"));
                                  break;
                                case "makeResourceC":
                                  ((u =
                                    "Converts 3 A and 1 B into 1 C. Takes 3 seconds to complete."),
                                    (a = "makeResourceC()"),
                                    (m = "Returns: 1 (the amount produced)"),
                                    (c = "resource-conversion-2"));
                                  break;
                              }
                              return f.jsxs(
                                "div",
                                {
                                  "data-section-id": c,
                                  style: {
                                    padding: "12px",
                                    backgroundColor: "#2d2d2d",
                                    border: "1px solid #3c3c3c",
                                    borderRadius: "4px",
                                  },
                                  children: [
                                    f.jsxs("div", {
                                      style: {
                                        color: "#4a9eff",
                                        fontFamily: "monospace",
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                        marginBottom: "4px",
                                      },
                                      children: [s, "()"],
                                    }),
                                    f.jsx("div", {
                                      style: {
                                        color: "#cccccc",
                                        fontSize: "13px",
                                        marginBottom: "8px",
                                      },
                                      children: u,
                                    }),
                                    f.jsxs("div", {
                                      style: { marginBottom: "4px" },
                                      children: [
                                        f.jsxs("span", {
                                          style: {
                                            color: "#888",
                                            fontSize: "12px",
                                          },
                                          children: ["Example:", " "],
                                        }),
                                        f.jsx("code", {
                                          style: {
                                            color: "#9d4edd",
                                            fontFamily: "monospace",
                                            fontSize: "12px",
                                            backgroundColor: "#1e1e1e",
                                            padding: "2px 6px",
                                            borderRadius: "3px",
                                          },
                                          children: a,
                                        }),
                                      ],
                                    }),
                                    f.jsx("div", {
                                      style: {
                                        color: "#888",
                                        fontSize: "12px",
                                      },
                                      children: m,
                                    }),
                                  ],
                                },
                                s,
                              );
                            }),
                          }),
                        ],
                      }),
                      f.jsxs("section", {
                        children: [
                          f.jsx("h3", {
                            style: {
                              color: "#4a9eff",
                              fontSize: "18px",
                              marginBottom: "12px",
                            },
                            children: "Tips",
                          }),
                          f.jsx("div", {
                            style: {
                              padding: "12px",
                              backgroundColor: "#2d2d2d",
                              border: "1px solid #3c3c3c",
                              borderRadius: "4px",
                            },
                            children: f.jsxs("ul", {
                              style: {
                                color: "#cccccc",
                                fontSize: "13px",
                                margin: 0,
                                paddingLeft: "20px",
                              },
                              children: [
                                f.jsx("li", {
                                  style: { marginBottom: "8px" },
                                  children:
                                    "Each function call takes time to complete. You'll see a progress bar while it runs.",
                                }),
                                f.jsx("li", {
                                  style: { marginBottom: "8px" },
                                  children:
                                    "Functions that return values can be used in calculations or stored in variables.",
                                }),
                                f.jsx("li", {
                                  style: { marginBottom: "8px" },
                                  children:
                                    "Use loops to automate repetitive tasks and generate resources faster.",
                                }),
                                f.jsx("li", {
                                  style: { marginBottom: "8px" },
                                  children:
                                    "Check the Tech Tree to see what features you can unlock next.",
                                }),
                                f.jsx("li", {
                                  children:
                                    "If you get an error, check the Log window for details about what went wrong.",
                                }),
                              ],
                            }),
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
              ],
            }),
          }),
        })
      : null
  );
}
function ng({ hint: e, onDismiss: t, onHintClick: n }) {
  return f.jsx(f.Fragment, {
    children: f.jsx("div", {
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 1e4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      onClick: t,
      children: f.jsxs("div", {
        style: {
          backgroundColor: "rgba(30, 30, 30, 0.98)",
          border: "2px solid #4a9eff",
          borderRadius: "8px",
          padding: "24px",
          width: "90%",
          maxWidth: "500px",
          boxShadow:
            "0 8px 24px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(74, 158, 255, 0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        },
        onClick: (r) => r.stopPropagation(),
        children: [
          f.jsxs("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
            },
            children: [
              f.jsxs("div", {
                style: { flex: 1 },
                children: [
                  f.jsx("div", {
                    style: {
                      color: "#4a9eff",
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    },
                    children: "💡 Tutorial",
                  }),
                  f.jsx("div", {
                    style: {
                      color: "#e0e0e0",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap",
                    },
                    children: e.message,
                  }),
                  e.codeExample &&
                    f.jsx("div", {
                      style: {
                        marginTop: "16px",
                        padding: "12px",
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                        borderRadius: "4px",
                        border: "1px solid rgba(74, 158, 255, 0.2)",
                        fontFamily: "monospace",
                        fontSize: "13px",
                        color: "#4a9eff",
                        overflowX: "auto",
                        whiteSpace: "pre",
                      },
                      children: e.codeExample,
                    }),
                  e.lineNumber &&
                    f.jsxs("div", {
                      style: {
                        color: "#888",
                        fontSize: "12px",
                        marginTop: "12px",
                        cursor: n ? "pointer" : "default",
                        textDecoration: n ? "underline" : "none",
                      },
                      onClick: () => {
                        (n == null || n(e), t());
                      },
                      children: ["Click to jump to line ", e.lineNumber],
                    }),
                ],
              }),
              f.jsx("button", {
                onClick: t,
                style: {
                  padding: "4px 8px",
                  fontSize: "20px",
                  backgroundColor: "transparent",
                  color: "#888",
                  border: "none",
                  cursor: "pointer",
                  lineHeight: "1",
                  flexShrink: 0,
                },
                title: "Dismiss",
                children: "×",
              }),
            ],
          }),
          f.jsx("div", {
            style: {
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              marginTop: "8px",
            },
            children: f.jsx("button", {
              onClick: t,
              style: {
                padding: "8px 16px",
                fontSize: "13px",
                backgroundColor: "#4a9eff",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              },
              children: "Got it",
            }),
          }),
        ],
      }),
    }),
  });
}
function rg({ activeHints: e, dismissedHints: t, onReopenHint: n }) {
  const [r, o] = E.useState(!1),
    i = [...e, ...t].length > 0;
  return r && i
    ? f.jsx("div", {
        style: {
          position: "fixed",
          right: "16px",
          bottom: "16px",
          zIndex: 9999,
        },
        children: f.jsx("button", {
          onClick: () => o(!1),
          style: {
            padding: "8px 12px",
            backgroundColor: "#2d2d2d",
            color: "#cccccc",
            border: "1px solid #3c3c3c",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          },
          children: "Hints",
        }),
      })
    : f.jsxs("div", {
        style: {
          position: "fixed",
          right: "16px",
          bottom: "16px",
          width: "280px",
          maxHeight: "300px",
          backgroundColor: "rgba(30, 30, 30, 0.95)",
          border: "1px solid #3c3c3c",
          borderRadius: "4px",
          zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
        },
        children: [
          f.jsxs("div", {
            style: {
              padding: "12px",
              borderBottom: "1px solid #3c3c3c",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            },
            children: [
              f.jsx("h3", {
                style: {
                  margin: 0,
                  color: "#cccccc",
                  fontSize: "14px",
                  fontWeight: 600,
                },
                children: "Hints",
              }),
              f.jsx("button", {
                onClick: () => o(!0),
                style: {
                  padding: "4px 8px",
                  fontSize: "11px",
                  backgroundColor: "transparent",
                  color: "#888",
                  border: "none",
                  cursor: "pointer",
                },
                children: "−",
              }),
            ],
          }),
          f.jsx("div", {
            style: { overflowY: "auto", maxHeight: "250px" },
            children: i
              ? f.jsxs("div", {
                  style: { display: "flex", flexDirection: "column" },
                  children: [
                    e.map((s) =>
                      f.jsxs(
                        "div",
                        {
                          style: {
                            padding: "12px",
                            borderBottom: "1px solid #3c3c3c",
                            backgroundColor: "rgba(74, 158, 255, 0.1)",
                          },
                          children: [
                            f.jsx("div", {
                              style: {
                                color: "#4a9eff",
                                fontSize: "12px",
                                fontWeight: 600,
                              },
                              children: s.title || "New Tutorial",
                            }),
                            f.jsx("div", {
                              style: {
                                color: "#888",
                                fontSize: "11px",
                                marginTop: "4px",
                              },
                              children: "Click to view",
                            }),
                          ],
                        },
                        s.id,
                      ),
                    ),
                    t.map((s) =>
                      f.jsxs(
                        "div",
                        {
                          onClick: () => (n == null ? void 0 : n(s)),
                          style: {
                            padding: "12px",
                            borderBottom: "1px solid #3c3c3c",
                            cursor: n ? "pointer" : "default",
                            transition: "background-color 0.2s",
                          },
                          onMouseEnter: (u) => {
                            n &&
                              (u.currentTarget.style.backgroundColor =
                                "#2d2d2d");
                          },
                          onMouseLeave: (u) => {
                            u.currentTarget.style.backgroundColor =
                              "transparent";
                          },
                          children: [
                            f.jsx("div", {
                              style: {
                                color: "#4a9eff",
                                fontSize: "12px",
                                lineHeight: "1.5",
                                textDecoration: "underline",
                              },
                              children:
                                s.title || s.message.substring(0, 50) + "...",
                            }),
                            s.lineNumber &&
                              f.jsxs("div", {
                                style: {
                                  color: "#888",
                                  fontSize: "11px",
                                  marginTop: "4px",
                                },
                                children: ["Line ", s.lineNumber],
                              }),
                          ],
                        },
                        s.id,
                      ),
                    ),
                  ],
                })
              : f.jsx("div", {
                  style: {
                    padding: "16px",
                    color: "#888",
                    fontSize: "12px",
                    textAlign: "center",
                  },
                  children: "No hints available",
                }),
          }),
        ],
      });
}
function og({ logs: e }) {
  const t = E.useRef(null);
  return (
    E.useEffect(() => {
      var n;
      (n = t.current) == null || n.scrollIntoView({ behavior: "smooth" });
    }, [e]),
    f.jsx("div", {
      style: {
        padding: "1rem",
        fontFamily: "monospace",
        fontSize: "0.9em",
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
      },
      children: f.jsxs("div", {
        style: { display: "flex", flexDirection: "column", gap: "0.25rem" },
        children: [
          e.length === 0
            ? f.jsx("div", {
                style: { color: "#999", fontStyle: "italic" },
                children: "No logs yet...",
              })
            : e.map((n, r) =>
                f.jsxs(
                  "div",
                  {
                    style: {
                      color:
                        n.type === "error"
                          ? "#dc3545"
                          : n.type === "warning"
                            ? "#ffc107"
                            : n.type === "unlock"
                              ? "#28a745"
                              : "#d4d4d4",
                    },
                    children: [
                      "[",
                      new Date(n.timestamp).toLocaleTimeString(),
                      "] ",
                      n.message,
                    ],
                  },
                  r,
                ),
              ),
          f.jsx("div", { ref: t }),
        ],
      }),
    })
  );
}
const Ad = { A: "#4a9eff", B: "#9d4edd", C: "#ff6b35" };
function lg({ resource: e, amount: t, available: n }) {
  const r = n >= t;
  return f.jsx("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "24px",
      height: "24px",
      backgroundColor: Ad[e],
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: "bold",
      color: "#fff",
      marginRight: "4px",
      opacity: r ? 1 : 0.5,
      border: r ? "2px solid #fff" : "2px solid transparent",
    },
    title: `${t} ${e} (${n} available)`,
    children: t,
  });
}
function ig({
  tech: e,
  isUnlocked: t,
  isAvailable: n,
  isSelected: r,
  resources: o,
  onClick: l,
}) {
  const i = e.cost.every((s) => o[s.resource] >= s.amount);
  return f.jsxs("div", {
    onClick: l,
    onMouseEnter: (s) => {
      r ||
        ((s.currentTarget.style.transform = "scale(1.1)"),
        (s.currentTarget.style.zIndex = "10"));
    },
    onMouseLeave: (s) => {
      r ||
        ((s.currentTarget.style.transform = "scale(1)"),
        (s.currentTarget.style.zIndex = "1"));
    },
    style: {
      position: "relative",
      width: "80px",
      height: "80px",
      background: t
        ? "linear-gradient(135deg, #2d4a5c 0%, #1a3a4a 100%)"
        : n && i
          ? "linear-gradient(135deg, #3d2d1e 0%, #2a1f15 100%)"
          : "linear-gradient(135deg, #1f1f1f 0%, #151515 100%)",
      border: r
        ? "3px solid #4a9eff"
        : t
          ? "2px solid #4a9eff"
          : n && i
            ? "2px solid #ff6b35"
            : "2px solid #4a4a4a",
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      opacity: 1,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: r
        ? "0 0 20px rgba(74, 158, 255, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5)"
        : t
          ? "0 0 12px rgba(74, 158, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)"
          : n && i
            ? "0 0 8px rgba(255, 107, 53, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2)"
            : "0 2px 4px rgba(0, 0, 0, 0.2)",
    },
    title: e.name,
    children: [
      f.jsx("div", {
        style: {
          fontSize: "36px",
          lineHeight: "1",
          marginBottom: "2px",
          filter: t ? "none" : n ? "brightness(0.9)" : "brightness(0.5)",
        },
        children: e.icon,
      }),
      f.jsx("div", {
        style: {
          position: "absolute",
          bottom: "4px",
          left: "50%",
          transform: "translateX(-50%)",
          gap: "2px",
          display: t ? "none" : "flex",
        },
        children: e.cost
          .slice(0, 2)
          .map((s, u) =>
            f.jsx(
              "div",
              {
                style: {
                  width: "14px",
                  height: "14px",
                  backgroundColor: Ad[s.resource],
                  borderRadius: "3px",
                  fontSize: "8px",
                  fontWeight: "bold",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: o[s.resource] >= s.amount ? 1 : 0.5,
                },
                title: `${s.amount} ${s.resource}`,
                children: s.amount,
              },
              u,
            ),
          ),
      }),
      t &&
        f.jsx("div", {
          style: {
            position: "absolute",
            top: "6px",
            right: "6px",
            width: "16px",
            height: "16px",
            background: "linear-gradient(135deg, #4a9eff 0%, #2d5a8f 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "#fff",
            boxShadow: "0 2px 4px rgba(74, 158, 255, 0.5)",
          },
          children: "✓",
        }),
      !t &&
        n &&
        i &&
        f.jsx("div", {
          style: {
            position: "absolute",
            top: "6px",
            right: "6px",
            width: "16px",
            height: "16px",
            background: "linear-gradient(135deg, #ff6b35 0%, #cc5529 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "#fff",
            boxShadow: "0 2px 4px rgba(255, 107, 53, 0.5)",
            animation: "pulse 2s infinite",
          },
          children: "!",
        }),
    ],
  });
}
function sg({
  isOpen: e,
  onClose: t,
  onFocus: n,
  onUnlock: r,
  onOpenDocs: o,
  initialSelectedTechId: l,
}) {
  const i = q((x) => x.tech),
    s = q((x) => x.resources),
    [u, a] = E.useState(l);
  (E.useEffect(() => {
    if (e) {
      if (l) {
        a(l);
        return;
      }
      if (u) return;
      const x = Di(s, i);
      x.length > 0 ? a(x[0].id) : it.length > 0 && a(it[0].id);
    }
  }, [e, u, s, i, l]),
    E.useEffect(() => {
      u && n();
    }, [u, n]));
  const m = it.find((x) => x.id === u),
    c = Di(s, i),
    v = m && c.some((x) => x.id === u),
    w = () => {
      if (!m) return;
      const x = i[m.id],
        k = m.threshold(s);
      !x &&
        k &&
        q.getState().consumeResources(m.cost) &&
        (q.getState().unlockTech(m.id), r == null || r(m.id));
    },
    C = (x) => {
      const k = i[x.id],
        j = x.threshold(s),
        O = !x.dependencies || x.dependencies.every((R) => i[R]);
      return k ? "unlocked" : j && O ? "available" : "locked";
    },
    y = Math.max(
      ...it.map((x) => {
        var k;
        return ((k = x.position) == null ? void 0 : k.row) || 0;
      }),
    ),
    N = Math.max(
      ...it.map((x) => {
        var k;
        return ((k = x.position) == null ? void 0 : k.col) || 0;
      }),
    ),
    p = 140,
    d = 80,
    h = 40,
    g = (N + 1) * p,
    S = (y + 1) * p;
  return e
    ? f.jsx(f.Fragment, {
        children: f.jsx("div", {
          style: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 1e4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          onClick: t,
          children: f.jsxs("div", {
            style: {
              backgroundColor: "#1e1e1e",
              border: "2px solid #4a9eff",
              borderRadius: "8px",
              padding: "24px",
              width: "90%",
              maxWidth: "1200px",
              maxHeight: "90vh",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
              display: "grid",
              gridTemplateRows: "auto 1fr",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              overflow: "hidden",
            },
            onClick: (x) => x.stopPropagation(),
            children: [
              f.jsxs("div", {
                style: {
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
                children: [
                  f.jsx("h2", {
                    style: { margin: 0, color: "#cccccc", fontSize: "20px" },
                    children: "Tech Tree",
                  }),
                  f.jsx("button", {
                    onClick: t,
                    style: {
                      padding: "4px 12px",
                      fontSize: "18px",
                      backgroundColor: "transparent",
                      color: "#cccccc",
                      border: "none",
                      cursor: "pointer",
                      lineHeight: "1",
                    },
                    children: "×",
                  }),
                ],
              }),
              f.jsx("div", {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  minHeight: 0,
                  overflow: "hidden",
                },
                children: f.jsx("div", {
                  style: {
                    position: "relative",
                    width: "100%",
                    height: "600px",
                    overflow: "auto",
                    background:
                      "radial-gradient(ellipse at center, #1a1a1a 0%, #0f0f0f 100%)",
                    borderRadius: "8px",
                    border: "1px solid #2a2a2a",
                    padding: "40px",
                    boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.5)",
                  },
                  children: f.jsxs("div", {
                    style: {
                      position: "relative",
                      width: g,
                      height: S,
                      zIndex: 1,
                    },
                    children: [
                      it.map((x) =>
                        !x.dependencies ||
                        x.dependencies.length === 0 ||
                        !x.position
                          ? null
                          : x.dependencies.map((k) => {
                              const j = it.find((br) => br.id === k);
                              if (!(j != null && j.position) || !x.position)
                                return null;
                              const O = i[k],
                                R = j.position,
                                F = x.position,
                                te = R.col * p + d / 2 + h,
                                G = R.row * p + d / 2 + h,
                                Ce = F.col * p + d / 2 + h,
                                $ = F.row * p + d / 2 + h,
                                B = Ce - te,
                                ue = $ - G,
                                P = Math.sqrt(B * B + ue * ue),
                                D = Math.atan2(ue, B) * (180 / Math.PI),
                                I = d / 2 + 2,
                                Q = te + (B / P) * I,
                                K = G + (ue / P) * I,
                                de = Ce - (B / P) * I,
                                Ye = $ - (ue / P) * I,
                                Ue = Math.sqrt((de - Q) ** 2 + (Ye - K) ** 2),
                                ae = O ? "#4a9eff" : "#5a5a5a",
                                Hn = O ? 3 : 2.5,
                                cn = O ? 1 : 0.7;
                              return f.jsx(
                                "div",
                                {
                                  style: {
                                    position: "absolute",
                                    left: `${Q}px`,
                                    top: `${K}px`,
                                    width: `${Ue}px`,
                                    height: `${Hn}px`,
                                    backgroundColor: ae,
                                    transformOrigin: "0 50%",
                                    transform: `rotate(${D}deg)`,
                                    zIndex: 0,
                                    pointerEvents: "none",
                                    opacity: cn,
                                  },
                                },
                                `${k}-${x.id}`,
                              );
                            }),
                      ),
                      it
                        .map((x) => {
                          if (!x.position) return null;
                          const k = C(x),
                            j = k === "unlocked",
                            O = k === "available",
                            R = u === x.id;
                          return f.jsx(
                            "div",
                            {
                              style: {
                                position: "absolute",
                                left: x.position.col * p + 40,
                                top: x.position.row * p + 40,
                                zIndex: R ? 10 : j ? 5 : 3,
                              },
                              children: f.jsx(ig, {
                                tech: x,
                                isUnlocked: j,
                                isAvailable: O,
                                isSelected: R,
                                resources: s,
                                onClick: () => a(x.id),
                              }),
                            },
                            x.id,
                          );
                        })
                        .filter(Boolean),
                    ],
                  }),
                }),
              }),
              f.jsx("div", {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  borderLeft: "1px solid #2a2a2a",
                  paddingLeft: "24px",
                  overflowY: "auto",
                  minWidth: 0,
                  minHeight: 0,
                },
                children: m
                  ? f.jsxs(f.Fragment, {
                      children: [
                        f.jsxs("div", {
                          children: [
                            f.jsxs("div", {
                              style: {
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                marginBottom: "12px",
                                paddingBottom: "16px",
                                borderBottom: "1px solid #2a2a2a",
                              },
                              children: [
                                f.jsx("div", {
                                  style: {
                                    fontSize: "48px",
                                    lineHeight: "1",
                                    filter: i[m.id]
                                      ? "none"
                                      : "brightness(0.7)",
                                  },
                                  children: m.icon,
                                }),
                                f.jsxs("div", {
                                  children: [
                                    f.jsx("h3", {
                                      style: {
                                        margin: 0,
                                        color: "#cccccc",
                                        fontSize: "20px",
                                        fontWeight: "600",
                                        marginBottom: "4px",
                                      },
                                      children: m.name,
                                    }),
                                    i[m.id] &&
                                      f.jsx("div", {
                                        style: {
                                          display: "inline-block",
                                          padding: "2px 8px",
                                          backgroundColor:
                                            "rgba(74, 158, 255, 0.2)",
                                          color: "#4a9eff",
                                          fontSize: "11px",
                                          fontWeight: "bold",
                                          borderRadius: "4px",
                                          textTransform: "uppercase",
                                        },
                                        children: "Unlocked",
                                      }),
                                  ],
                                }),
                              ],
                            }),
                            f.jsx("p", {
                              style: {
                                margin: 0,
                                color: "#aaaaaa",
                                fontSize: "14px",
                                lineHeight: "1.6",
                              },
                              children: m.description,
                            }),
                          ],
                        }),
                        f.jsxs("div", {
                          hidden: i[m.id],
                          style: {
                            padding: "16px",
                            background:
                              "linear-gradient(135deg, #2d2d2d 0%, #1f1f1f 100%)",
                            borderRadius: "8px",
                            border: "1px solid #3c3c3c",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                          },
                          children: [
                            f.jsx("div", {
                              style: {
                                color: "#cccccc",
                                fontSize: "13px",
                                fontWeight: "600",
                                marginBottom: "12px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              },
                              children: "Unlock Cost",
                            }),
                            f.jsx("div", {
                              style: {
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                              },
                              children: m.cost.map((x, k) =>
                                f.jsx(
                                  lg,
                                  {
                                    resource: x.resource,
                                    amount: x.amount,
                                    available: s[x.resource],
                                  },
                                  k,
                                ),
                              ),
                            }),
                            m.cost.length > 0 &&
                              f.jsx("div", {
                                style: {
                                  marginTop: "12px",
                                  paddingTop: "12px",
                                  borderTop: "1px solid #2a2a2a",
                                  fontSize: "12px",
                                  color: "#888",
                                },
                                children: m.cost.map((x, k) =>
                                  f.jsxs(
                                    "div",
                                    {
                                      style: { marginBottom: "4px" },
                                      children: [
                                        "You have ",
                                        s[x.resource],
                                        " ",
                                        x.resource,
                                        s[x.resource] >= x.amount
                                          ? f.jsx("span", {
                                              style: {
                                                color: "#4a9eff",
                                                marginLeft: "8px",
                                              },
                                              children: "✓",
                                            })
                                          : f.jsxs("span", {
                                              style: {
                                                color: "#ff6b35",
                                                marginLeft: "8px",
                                              },
                                              children: [
                                                "(need ",
                                                x.amount - s[x.resource],
                                                " ",
                                                "more)",
                                              ],
                                            }),
                                      ],
                                    },
                                    k,
                                  ),
                                ),
                              }),
                          ],
                        }),
                        i[m.id]
                          ? f.jsxs("div", {
                              children: [
                                f.jsx("div", {
                                  style: {
                                    padding: "12px",
                                    backgroundColor: "rgba(74, 158, 255, 0.1)",
                                    borderRadius: "4px",
                                    border: "1px solid #4a9eff",
                                    color: "#4a9eff",
                                    fontSize: "13px",
                                    textAlign: "center",
                                  },
                                  children: "✓ UNLOCKED",
                                }),
                                o &&
                                  f.jsx("button", {
                                    onClick: () => {
                                      o(
                                        {
                                          whileUnlocked: "while-loops",
                                          convertAToBUnlocked:
                                            "resource-conversion",
                                          varsUnlocked: "variables",
                                          mathFunctionsUnlocked:
                                            "math-operators",
                                          resourceCUnlocked:
                                            "resource-conversion-2",
                                          ifStatementsUnlocked: "if-statements",
                                          userFunctionsUnlocked:
                                            "user-functions",
                                        }[m.id] || "",
                                      );
                                    },
                                    style: {
                                      marginTop: "12px",
                                      width: "100%",
                                      padding: "10px",
                                      backgroundColor: "#4a9eff",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "13px",
                                      fontWeight: "bold",
                                    },
                                    children: "View in Docs",
                                  }),
                              ],
                            })
                          : f.jsx("button", {
                              onClick: w,
                              disabled: !v,
                              style: {
                                width: "100%",
                                padding: "12px",
                                backgroundColor: v ? "#ff6b35" : "#555",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: v ? "pointer" : "not-allowed",
                                fontSize: "14px",
                                fontWeight: "bold",
                                opacity: v ? 1 : 0.5,
                              },
                              children: v ? "Unlock" : "Insufficient Resources",
                            }),
                      ],
                    })
                  : f.jsx("div", {
                      style: { color: "#888", fontSize: "14px" },
                      children: "Select a tech to view details",
                    }),
              }),
            ],
          }),
        }),
      })
    : null;
}
function ug() {
  const e = q((o) => o.resources),
    t = q((o) => o.tech),
    n = q((o) => o.virtualTime),
    r = (o) => {
      const l = Math.floor(o / 3600),
        i = Math.floor((o % 3600) / 60),
        s = (o % 60).toFixed(2);
      return `${l}:${i.toString().padStart(2, "0")}:${s.padStart(5, "0")}`;
    };
  return f.jsxs("div", {
    style: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: "40px",
      backgroundColor: "#1e1e1e",
      borderBottom: "1px solid #3c3c3c",
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      zIndex: 1e4,
      justifyContent: "space-between",
    },
    children: [
      f.jsx("div", {
        style: { display: "flex", alignItems: "center", gap: "24px" },
        children: f.jsxs("div", {
          style: { display: "flex", alignItems: "center", gap: "16px" },
          children: [
            f.jsxs("div", {
              style: { display: "flex", alignItems: "center", gap: "6px" },
              children: [
                f.jsx("div", {
                  style: {
                    width: "16px",
                    height: "16px",
                    backgroundColor: "#4a9eff",
                    borderRadius: "2px",
                  },
                }),
                f.jsxs("span", {
                  style: {
                    color: "#cccccc",
                    fontSize: "14px",
                    fontFamily: "monospace",
                  },
                  children: ["A: ", e.A],
                }),
              ],
            }),
            t.convertAToBUnlocked &&
              f.jsxs("div", {
                style: { display: "flex", alignItems: "center", gap: "6px" },
                children: [
                  f.jsx("div", {
                    style: {
                      width: "16px",
                      height: "16px",
                      backgroundColor: "#9d4edd",
                      borderRadius: "2px",
                    },
                  }),
                  f.jsxs("span", {
                    style: {
                      color: "#cccccc",
                      fontSize: "14px",
                      fontFamily: "monospace",
                    },
                    children: ["B: ", e.B],
                  }),
                ],
              }),
            t.resourceCUnlocked &&
              f.jsxs("div", {
                style: { display: "flex", alignItems: "center", gap: "6px" },
                children: [
                  f.jsx("div", {
                    style: {
                      width: "16px",
                      height: "16px",
                      backgroundColor: "#ff6b35",
                      borderRadius: "2px",
                    },
                  }),
                  f.jsxs("span", {
                    style: {
                      color: "#cccccc",
                      fontSize: "14px",
                      fontFamily: "monospace",
                    },
                    children: ["C: ", e.C],
                  }),
                ],
              }),
          ],
        }),
      }),
      f.jsxs("div", {
        style: { display: "flex", alignItems: "center", gap: "16px" },
        children: [
          f.jsx("span", {
            style: { color: "#888", fontSize: "12px" },
            children: "Virtual Time:",
          }),
          f.jsx("span", {
            style: {
              color: "#cccccc",
              fontSize: "14px",
              fontFamily: "monospace",
            },
            children: r(n),
          }),
        ],
      }),
    ],
  });
}
function la({
  title: e,
  initialX: t = 100,
  initialY: n = 100,
  initialWidth: r = 600,
  initialHeight: o = 400,
  children: l,
  onClose: i,
  onRun: s,
  onStop: u,
  isRunning: a = !1,
  canRun: m = !0,
  isActive: c = !1,
  onFocus: v,
}) {
  const [w, C] = E.useState({ x: t, y: n }),
    [y, N] = E.useState({ width: r, height: o }),
    [p, d] = E.useState(!1),
    [h, g] = E.useState(!1),
    [S, x] = E.useState({ x: 0, y: 0 }),
    k = E.useRef(null);
  E.useEffect(() => {
    c && v && v();
  }, [c, v]);
  const j = (R) => {
      (R.target === R.currentTarget ||
        R.target.classList.contains("window-title")) &&
        (d(!0), x({ x: R.clientX - w.x, y: R.clientY - w.y }), v && v());
    },
    O = (R) => {
      (R.stopPropagation(),
        g(!0),
        x({ x: R.clientX - y.width, y: R.clientY - y.height }));
    };
  return (
    E.useEffect(() => {
      const R = (te) => {
          p
            ? C({ x: te.clientX - S.x, y: te.clientY - S.y })
            : h &&
              N({
                width: Math.max(300, te.clientX - S.x),
                height: Math.max(200, te.clientY - S.y),
              });
        },
        F = () => {
          (d(!1), g(!1));
        };
      if (p || h)
        return (
          document.addEventListener("mousemove", R),
          document.addEventListener("mouseup", F),
          () => {
            (document.removeEventListener("mousemove", R),
              document.removeEventListener("mouseup", F));
          }
        );
    }, [p, h, S]),
    f.jsxs("div", {
      ref: k,
      className: "floating-window",
      style: {
        position: "absolute",
        left: `${w.x}px`,
        top: `${w.y}px`,
        width: `${y.width}px`,
        height: `${y.height}px`,
        backgroundColor: "#1e1e1e",
        border: c
          ? a
            ? "2px solid #28a745"
            : "2px solid #4a9eff"
          : "1px solid #3c3c3c",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        boxShadow: a
          ? "0 4px 12px rgba(40, 167, 69, 0.3)"
          : "0 4px 12px rgba(0, 0, 0, 0.5)",
        zIndex: c ? 1e3 : 100,
        overflow: "hidden",
      },
      onMouseDown: j,
      children: [
        f.jsxs("div", {
          className: "window-title",
          style: {
            backgroundColor: "#2d2d2d",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "move",
            userSelect: "none",
            borderBottom: "1px solid #3c3c3c",
          },
          children: [
            f.jsx("span", {
              style: { color: "#cccccc", fontSize: "13px", fontWeight: 500 },
              children: e,
            }),
            f.jsxs("div", {
              style: { display: "flex", gap: "8px", alignItems: "center" },
              children: [
                a &&
                  f.jsx("button", {
                    onClick: (R) => {
                      (R.stopPropagation(), u == null || u());
                    },
                    style: {
                      padding: "4px 12px",
                      fontSize: "12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    },
                    children: "Stop",
                  }),
                m &&
                  !a &&
                  f.jsx("button", {
                    onClick: (R) => {
                      (R.stopPropagation(), s == null || s());
                    },
                    style: {
                      padding: "4px 12px",
                      fontSize: "12px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    },
                    children: "Run",
                  }),
                i &&
                  f.jsx("button", {
                    onClick: (R) => {
                      (R.stopPropagation(), i());
                    },
                    style: {
                      padding: "2px 8px",
                      fontSize: "16px",
                      backgroundColor: "transparent",
                      color: "#cccccc",
                      border: "none",
                      cursor: "pointer",
                      lineHeight: "1",
                    },
                    children: "×",
                  }),
              ],
            }),
          ],
        }),
        f.jsx("div", {
          style: { flex: 1, overflow: "hidden", position: "relative" },
          children: l,
        }),
        f.jsx("div", {
          onMouseDown: O,
          style: {
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "20px",
            height: "20px",
            cursor: "nwse-resize",
            background:
              "linear-gradient(135deg, transparent 0%, transparent 40%, #555 40%, #555 60%, transparent 60%)",
          },
        }),
      ],
    })
  );
}
const ia = [
  "produceResourceA",
  "convertAToB",
  "getResourceCount",
  "log",
  "makeResourceC",
];
function ag(e, t = !0) {
  let n = e.split(/\r?\n/);
  const r = new Set();
  (t &&
    (n = n.map((s, u) => {
      const a = u + 1,
        m = s.trim();
      if (
        !m ||
        m.length === 0 ||
        m.startsWith("//") ||
        m.startsWith("*") ||
        m === "{" ||
        m === "}" ||
        m.startsWith("/*") ||
        m.endsWith("*/") ||
        m.includes("step(") ||
        /^(?:function|async\s+function)\s+/.test(m) ||
        (/^(?:const|let|var)\s+/.test(m) && /=>\s*\{?\s*$/.test(m))
      )
        return s;
      const c = /^(?:while|for)\s*\(/.test(m);
      if (
        /^(?:if|else|while|for|switch|case|default|try|catch|finally)\s*\(/.test(
          m,
        ) ||
        /^(?:if|else|while|for|switch|case|default|try|catch|finally)\s*\{/.test(
          m,
        )
      ) {
        const w = ia.some((C) => new RegExp(`\\b${C}\\s*\\(`).test(m));
        return c && !w && m.endsWith("{")
          ? s.replace(/\{\s*$/, `{ await step(${a});`)
          : m.endsWith(";") || m.endsWith("}")
            ? m.endsWith(";")
              ? s.replace(/;\s*$/, `; await step(${a});`)
              : s.replace(/\}\s*$/, `await step(${a}); }`)
            : s;
      }
      return (/[+\-*/%=<>!&|,]\s*$/.test(m) &&
        !m.endsWith("++") &&
        !m.endsWith("--") &&
        !m.match(/[+\-*/%=<>!&|,]{2,}\s*$/)) ||
        /=>\s*\{?\s*$/.test(m)
        ? s
        : m.endsWith(";")
          ? s.replace(/;\s*$/, `; await step(${a});`)
          : m.endsWith("}")
            ? s.replace(/\}\s*$/, `await step(${a}); }`)
            : s + `; await step(${a});`;
    })),
    (n = n.map((s) => {
      let u = s;
      for (const a of ia) {
        const m = new RegExp(`(^|[^\\w])(await\\s+)?(${a}\\s*\\()`, "g");
        u = u.replace(m, (c, v, w, C) => {
          if (w) return c;
          const y = v.trim();
          return y.endsWith("function") ||
            y.endsWith("const") ||
            y.endsWith("let") ||
            y.endsWith("var") ||
            y.endsWith("=")
            ? c
            : v + "await " + C;
        });
      }
      return u;
    })));
  let o = !0,
    l = 0;
  const i = 10;
  for (; o && l < i; ) {
    ((o = !1), l++);
    const s = [];
    let u = 0;
    for (let a = 0; a < n.length; a++) {
      const m = n[a],
        c = (m.match(/\{/g) || []).length,
        v = (m.match(/\}/g) || []).length;
      u += c - v;
      const w = m.match(
          /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?(\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/,
        ),
        C = m.match(
          /\b(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
        );
      if (
        (w && s.length === 0
          ? s.push({
              name: w[1],
              startLine: a,
              isAsync: m.includes("async"),
              hasAwait: !1,
              type: "arrow",
              entryBraceDepth: u + c,
            })
          : C &&
            s.length === 0 &&
            s.push({
              name: C[1],
              startLine: a,
              isAsync: m.includes("async"),
              hasAwait: !1,
              type: "regular",
              entryBraceDepth: u + c,
            }),
        w && s.length > 0
          ? s.push({
              name: w[1],
              startLine: a,
              isAsync: m.includes("async"),
              hasAwait: !1,
              type: "arrow",
              entryBraceDepth: u + c,
            })
          : C &&
            s.length > 0 &&
            s.push({
              name: C[1],
              startLine: a,
              isAsync: m.includes("async"),
              hasAwait: !1,
              type: "regular",
              entryBraceDepth: u + c,
            }),
        s.length > 0 && /\bawait\b/.test(m))
      )
        for (const y of s) y.hasAwait = !0;
      if (v > 0 && s.length > 0) {
        const y = s[s.length - 1];
        if (u < y.entryBraceDepth) {
          if (y.hasAwait && !y.isAsync) {
            const N = n[y.startLine];
            (y.type === "regular"
              ? N.includes("async") ||
                (n[y.startLine] = N.replace(
                  /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
                  "async function $1(",
                ))
              : N.includes("async") ||
                (n[y.startLine] = N.replace(
                  /=\s*(\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/,
                  "= async $1 =>",
                )),
              (y.isAsync = !0),
              r.add(y.name),
              (o = !0));
          }
          s.pop();
        }
      }
    }
    for (let a = 0; a < n.length; a++) {
      const m = n[a];
      for (const c of r) {
        if (
          new RegExp(
            `(?:async\\s+)?function\\s+${c}\\s*\\(|(?:const|let|var)\\s+${c}\\s*=\\s*(?:async\\s+)?[^=]*=>`,
          ).test(m)
        )
          continue;
        const w = new RegExp(`(^|[^\\w])(await\\s+)?(${c}\\s*\\()`, "g"),
          C = m.replace(w, (y, N, p, d) => (p ? y : N + "await " + d));
        C !== m && ((n[a] = C), (o = !0));
      }
    }
  }
  return n.join(`
`);
}
const cg = [
  "produceResourceA",
  "convertAToB",
  "getResourceCount",
  "log",
  "makeResourceC",
];
function dg(e) {
  const t = new Map();
  return (
    e
      .split(
        `
`,
      )
      .forEach((r, o) => {
        const l = o + 1,
          i = [];
        (cg.forEach((s) => {
          const u = new RegExp(`\\b${s}\\s*\\(`, "g");
          let a;
          for (; (a = u.exec(r)) !== null; )
            i.push({
              lineNumber: l,
              functionName: s,
              startCol: a.index + 1,
              endCol: a.index + s.length + 1,
            });
        }),
          i.length > 0 && t.set(l, i));
      }),
    t
  );
}
class fg extends Error {
  constructor() {
    (super("Execution cancelled"), (this.name = "CancellationError"));
  }
}
class pg {
  constructor(t) {
    Vt(this, "isRunning", !1);
    Vt(this, "isCancelled", !1);
    Vt(this, "currentLine", null);
    Vt(this, "lineMap", new Map());
    Vt(this, "callbacks");
    Vt(this, "cancellationError", null);
    this.callbacks = t;
  }
  async execute(t) {
    if (this.isRunning) throw new Error("Execution already in progress");
    console.log("Executor: Starting execution");
    const n = this.checkSyntaxErrors(t);
    if (n.length > 0) {
      const u = n.map((m) => `Line ${m.lineNumber}: ${m.message}`),
        a = new Error(`Syntax error:
${u.join(`
`)}`);
      throw (
        this.callbacks.onEvent({
          type: "error",
          error: a,
          lineNumber: n[0].lineNumber,
        }),
        a
      );
    }
    const r = Ar(t);
    if (r.length > 0) {
      const u = r.map((m) => `Line ${m.lineNumber}: ${m.message}`),
        a = new Error(`Code validation failed:
${u.join(`
`)}`);
      throw (
        this.callbacks.onEvent({
          type: "error",
          error: a,
          lineNumber: r[0].lineNumber,
        }),
        a
      );
    }
    ((this.isRunning = !0),
      (this.isCancelled = !1),
      (this.currentLine = null),
      (this.cancellationError = new fg()));
    const o = ag(t);
    this.lineMap = dg(o);
    const l = [];
    Array.from(this.lineMap.keys())
      .sort((u, a) => u - a)
      .forEach((u) => {
        const a = this.lineMap.get(u);
        a &&
          a.forEach((m) => {
            l.push({ lineNumber: u, functionName: m.functionName });
          });
      });
    let s = 0;
    try {
      const u = {
          functionName: "",
          lineNumber: void 0,
          isCancelled: () => this.isCancelled,
          throwIfCancelled: () => {
            if (this.isCancelled && this.cancellationError)
              throw this.cancellationError;
          },
          onLog: (y) => {
            this.callbacks.onEvent({ type: "log", message: y });
          },
          onStart: (y, N, p) => {
            this.isCancelled ||
              ((this.currentLine = y),
              this.callbacks.onEvent({ type: "lineChange", lineNumber: y }),
              this.callbacks.onEvent({
                type: "functionStart",
                lineNumber: y,
                functionName: N,
                duration: p,
              }));
          },
          onProgress: (y, N) => {
            this.isCancelled ||
              this.callbacks.onEvent({
                type: "functionProgress",
                lineNumber: y,
                progress: N,
              });
          },
          onComplete: (y, N, p) => {
            this.isCancelled ||
              this.callbacks.onEvent({
                type: "functionComplete",
                lineNumber: y,
                functionName: N,
                duration: p,
              });
          },
        },
        a = Jh(u),
        m = this,
        c = new Proxy(a, {
          get(y, N) {
            const p = y[N];
            return typeof p == "function"
              ? function (...d) {
                  if (l.length > 0) {
                    const h = s % l.length,
                      g = l[h];
                    if (g && g.functionName === N)
                      ((u.lineNumber = g.lineNumber), (u.functionName = N));
                    else {
                      let S = null,
                        x = h,
                        k = 0;
                      for (; k < l.length && !S; ) {
                        const j = l[x];
                        if (j && j.functionName === N) {
                          S = j;
                          break;
                        }
                        ((x = (x + 1) % l.length), k++);
                      }
                      S
                        ? ((u.lineNumber = S.lineNumber), (u.functionName = N))
                        : g
                          ? ((u.lineNumber = g.lineNumber),
                            (u.functionName = N))
                          : ((u.lineNumber = m.currentLine || void 0),
                            (u.functionName = N));
                    }
                    s++;
                  } else
                    ((u.lineNumber = m.currentLine || void 0),
                      (u.functionName = N));
                  return p.apply(this, d);
                }
              : p;
          },
        }),
        v = async (y) => {
          if (this.isCancelled) throw this.cancellationError;
          const p = t.split(/\r?\n/)[y - 1];
          if (!p || p.trim().length === 0) return;
          ((this.currentLine = y),
            this.callbacks.onEvent({ type: "lineChange", lineNumber: y }));
          const d = 250;
          if ((await new Promise((h) => setTimeout(h, d)), this.isCancelled))
            throw this.cancellationError;
        },
        w = `
        return (async function(api, step) {
          const { produceResourceA, convertAToB, getResourceCount, log, makeResourceC } = api;
          ${o}
        })(api, step);
      `;
      let C;
      try {
        C = new Function("api", "step", w);
      } catch (y) {
        const N = y instanceof Error ? y : new Error(String(y)),
          p = N.message;
        let d;
        const h = p.match(/(?:line|at line)\s+(\d+)/i);
        if ((h && (d = parseInt(h[1], 10)), !d)) {
          const g = o.split(`
`);
          for (let S = 0; S < g.length; S++) {
            const x = g[S];
            if (
              /\bawait\s+/.test(x) &&
              !/async\s+(function|\(|=>)/.test(o.substring(0, o.indexOf(x)))
            ) {
              d = S + 1;
              break;
            }
          }
        }
        throw (
          this.callbacks.onEvent({
            type: "error",
            error:
              new Error(`${p}${d ? ` (likely at line ${d} in your code)` : ""}

This usually means a function needs to be async but wasn't transformed correctly.
Check for functions that call API functions but aren't marked as async.`),
            lineNumber: d || void 0,
          }),
          N
        );
      }
      console.log("Executor: Calling script function");
      try {
        if ((await C(c, v), this.isCancelled)) {
          console.log("Executor: Execution cancelled");
          return;
        }
        (console.log("Executor: Script function completed"),
          this.isCancelled ||
            (console.log("Executor: Emitting complete event"),
            this.callbacks.onEvent({ type: "complete" })));
      } catch (y) {
        if (y instanceof Error && y.name === "CancellationError") {
          console.log("Executor: Execution cancelled via error");
          return;
        }
        if (this.isCancelled) {
          console.log("Executor: Error during cancelled execution (ignored)");
          return;
        }
        this.isCancelled = !0;
        let N = this.currentLine || void 0;
        if (y instanceof Error) {
          const p = y.message.match(/(?:line|at line)\s+(\d+)/i);
          if (p) {
            const d = parseInt(p[1], 10);
            N = Math.max(1, d - 2);
          } else if (y.stack) {
            const d = y.stack.split(`
`);
            for (const h of d) {
              const g = h.match(/:(\d+):(\d+)/);
              if (g) {
                const S = parseInt(g[1], 10);
                if (S > 2) {
                  N = S - 2;
                  break;
                }
              }
            }
          }
          if (y.message.includes("await is only valid in async")) {
            const d = new Error(`${y.message}${N ? ` (line ${N})` : ""}

This usually means a function that calls API functions needs to be async.
The transformer should handle this automatically - this may be a bug.
Try making the function explicitly async, or check for nested function calls.`);
            throw (
              (d.stack = y.stack),
              this.callbacks.onEvent({
                type: "error",
                error: d,
                lineNumber: N,
              }),
              d
            );
          }
        }
        throw (
          this.callbacks.onEvent({
            type: "error",
            error: y instanceof Error ? y : new Error(String(y)),
            lineNumber: N,
          }),
          y
        );
      }
    } catch (u) {
      ((this.isCancelled = !0),
        (this.isRunning = !1),
        this.callbacks.onEvent({
          type: "error",
          error: u instanceof Error ? u : new Error(String(u)),
          lineNumber: this.currentLine || void 0,
        }));
    } finally {
      ((this.isRunning = !1), (this.currentLine = null));
    }
  }
  stop() {
    (console.log("Executor: Stop requested"),
      (this.isCancelled = !0),
      (this.isRunning = !1),
      (this.currentLine = null),
      this.callbacks.onEvent({ type: "complete" }));
  }
  getRunning() {
    return this.isRunning;
  }
  checkSyntaxErrors(t) {
    const n = [];
    return (
      t.split(/\r?\n/).forEach((o, l) => {
        var a;
        const i = l + 1,
          s = o.trim();
        if (!s || s.startsWith("//")) return;
        if (
          /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*(?:\{|=>)/.test(
            o,
          ) &&
          !/(?:const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*\(/.test(o)
        ) {
          const c =
            ((a = o.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/)) ==
            null
              ? void 0
              : a[1]) || "function";
          n.push({
            lineNumber: i,
            message: `Missing '=' in arrow function declaration. Did you mean: const ${c} = (params) => { ... }?`,
          });
        }
      }),
      n
    );
  }
}
const As = "hint-seen-";
function ct(e) {
  try {
    const t = localStorage.getItem(`${As}${e}`);
    return t ? JSON.parse(t).hasSeen : !1;
  } catch {
    return !1;
  }
}
function Wl(e) {
  try {
    const t = { hasSeen: !0, lastShown: Date.now() };
    localStorage.setItem(`${As}${e}`, JSON.stringify(t));
  } catch (t) {
    console.warn("Failed to save hint state", t);
  }
}
function mg() {
  try {
    (Object.keys(localStorage).forEach((e) => {
      e.startsWith(As) && localStorage.removeItem(e);
    }),
      localStorage.removeItem(Un),
      localStorage.removeItem(hg));
  } catch (e) {
    console.warn("Failed to reset all hints", e);
  }
}
const Un = "error-run-attempts",
  hg = "error-run-hint-seen";
function gg(e) {
  var t;
  try {
    const n = localStorage.getItem(Un);
    return (n && ((t = JSON.parse(n)[e]) == null ? void 0 : t.count)) || 0;
  } catch {
    return 0;
  }
}
function vg(e) {
  var t;
  try {
    const n = localStorage.getItem(Un),
      r = n ? JSON.parse(n) : {};
    ((r[e] = {
      count: (((t = r[e]) == null ? void 0 : t.count) || 0) + 1,
      lastAttempt: Date.now(),
    }),
      localStorage.setItem(Un, JSON.stringify(r)));
  } catch (n) {
    console.warn("Failed to save error run attempts", n);
  }
}
function sa(e) {
  try {
    const t = localStorage.getItem(Un);
    if (!t) return;
    const n = JSON.parse(t);
    (delete n[e], localStorage.setItem(Un, JSON.stringify(n)));
  } catch (t) {
    console.warn("Failed to clear error run attempts", t);
  }
}
function yg(e) {
  let t = 0;
  for (let n = 0; n < e.length; n++) {
    const r = e.charCodeAt(n);
    ((t = (t << 5) - t + r), (t = t & t));
  }
  return t.toString(36);
}
const ua = "incremental-coding-game-code";
function xg() {
  const [e, t] = E.useState([
      {
        id: "main",
        filename: "main.js",
        code: localStorage.getItem(ua) || "produceResourceA()",
        x: 100,
        y: 60,
        width: 700,
        height: 500,
      },
    ]),
    [n, r] = E.useState("main"),
    [o, l] = E.useState(!1),
    [i, s] = E.useState(null),
    [u, a] = E.useState([]),
    [m, c] = E.useState([]),
    [v, w] = E.useState(null),
    [C, y] = E.useState({ totalTime: 0, functionTimes: {}, isRunning: !1 }),
    [N, p] = E.useState(!1),
    [d, h] = E.useState(void 0),
    [g, S] = E.useState(!1),
    [x, k] = E.useState(!1),
    [j, O] = E.useState(void 0),
    [R, F] = E.useState([]),
    [te, G] = E.useState([]),
    [Ce, $] = E.useState(!1),
    [B, ue] = E.useState(0),
    [P, D] = E.useState(!1),
    U = E.useRef(0),
    A = E.useRef(0),
    [I, Q] = E.useState(!1),
    [K, de] = E.useState(!1),
    [Ye, Ue] = E.useState(null),
    ae = E.useRef(["main"]),
    Hn = E.useRef(new Map()),
    cn = E.useRef(""),
    br = q((T) => T.resources),
    dn = q((T) => T.tech),
    Is = E.useRef(dn);
  (E.useEffect(() => {
    q.getState().syncFromLocalStorage();
    const T = [];
    (ct("first-tutorial") &&
      T.push({
        id: "first-tutorial",
        title: "Welcome Tutorial",
        message:
          "Welcome! Write code in the editor above and press Run to execute it. Start by calling `produceResourceA()` to gather resources.",
        isTutorial: !0,
      }),
      ct("loop-unlock") &&
        T.push({
          id: "loop-unlock",
          title: "Loops Unlocked",
          message:
            "Loops unlocked! Try automating your code with a while loop:",
          codeExample: `while (true) {
  produceResourceA()
}`,
          isTutorial: !0,
        }),
      ct("error-run") &&
        T.push({
          id: "error-run",
          title: "Code Has Errors",
          message:
            "Your code has errors. Check the red markers in the editor and fix them before running.",
          isTutorial: !0,
        }),
      ct("upgrades-available") &&
        T.push({
          id: "upgrades-available",
          title: "Upgrades Available",
          message:
            "You have upgrades available! Open the Tech Tree (Ctrl+U) to unlock new features.",
          isTutorial: !0,
        }),
      T.length > 0 && G(T));
  }, []),
    E.useEffect(() => {
      const T = e.find((z) => z.id === "main");
      T && localStorage.setItem(ua, T.code);
    }, [e]),
    E.useEffect(() => {
      const z = Di(br, dn).length;
      (ue(z), z > U.current && z > 0 && D(!1), (U.current = z));
    }, [br, dn]),
    E.useEffect(() => {
      N && (D(!0), (A.current = 0));
    }, [N]));
  const nt = E.useCallback((T, z) => {
      (Wl(T),
        F((L) => L.filter((V) => V.id !== T)),
        G((L) =>
          L.find((V) => V.id === T) ? L : [...L, { ...z, onDismiss: void 0 }],
        ));
    }, []),
    Id = E.useCallback(
      (T) => {
        if (
          (G((z) => z.filter((L) => L.id !== T.id)),
          T.id === "error-run-specific")
        ) {
          const z = e.find((L) => L.id === "main");
          if (z) {
            const L = Ar(z.code);
            if (L.length > 0) {
              const V = L.map((ne) => `Line ${ne.lineNumber}: ${ne.message}`)
                  .join(`
`),
                Y = {
                  ...T,
                  message: `You've tried running this code multiple times. Here are the errors:

${V}`,
                  onDismiss: () => nt(T.id, Y),
                };
              F((ne) => (ne.find((Vn) => Vn.id === T.id) ? ne : [...ne, Y]));
              return;
            }
          }
        }
        F((z) =>
          z.find((L) => L.id === T.id)
            ? z
            : [...z, { ...T, onDismiss: () => nt(T.id, T) }],
        );
      },
      [nt, e],
    );
  (E.useEffect(() => {
    if (!e.find((L) => L.id === "main")) return;
    const z = {
      id: "first-tutorial",
      title: "Welcome Tutorial",
      message:
        "Welcome! Write code in the editor above and press Run to execute it. Start by calling `produceResourceA()` to gather resources.",
      isTutorial: !0,
      onDismiss: () => nt("first-tutorial", z),
    };
    ct("first-tutorial")
      ? G((L) =>
          L.find((V) => V.id === "first-tutorial")
            ? L
            : [{ ...z, onDismiss: void 0 }],
        )
      : F((L) => (L.find((V) => V.id === "first-tutorial") ? L : [z]));
  }, [e, nt]),
    E.useEffect(() => {
      const T = Is.current.whileUnlocked;
      if (dn.whileUnlocked) {
        const L = {
          id: "loop-unlock",
          title: "Loops Unlocked",
          message:
            "Loops unlocked! Try automating your code with a while loop:",
          codeExample: `while (true) {
  produceResourceA()
}`,
          isTutorial: !0,
          onDismiss: () => nt("loop-unlock", L),
        };
        !T && !ct("loop-unlock")
          ? F((V) => {
              const Y = V.filter((ne) => ne.id !== "first-tutorial");
              return Y.find((ne) => ne.id === "loop-unlock") ? Y : [...Y, L];
            })
          : ct("loop-unlock") &&
            G((V) =>
              V.find((Y) => Y.id === "loop-unlock")
                ? V
                : [...V, { ...L, onDismiss: void 0 }],
            );
      }
      Is.current = dn;
    }, [dn.whileUnlocked, nt]),
    E.useEffect(() => {
      const T = new pg({
        onEvent: (z) => {
          if ((a((L) => [...L, z]), z.type === "lineChange")) Ue(z.lineNumber);
          else if (z.type === "log") {
            const L = z.message.startsWith("⚠️ Warning:"),
              V = L ? "warning" : "log";
            (c((Y) => [
              ...Y,
              { type: V, message: z.message, timestamp: Date.now() },
            ]),
              L && !g && Q(!0));
          } else
            z.type === "error"
              ? (l(!1),
                s(null),
                y((L) => ({ ...L, isRunning: !1 })),
                $(!0),
                S(!0),
                de(!1),
                (ae.current = [
                  "log",
                  ...ae.current.filter((L) => L !== "log"),
                ]),
                r("log"),
                c((L) => [
                  ...L,
                  {
                    type: "error",
                    message: `❌ Error: ${z.error.message}${z.lineNumber ? ` (line ${z.lineNumber})` : ""}`,
                    timestamp: Date.now(),
                  },
                ]))
              : z.type === "functionStart"
                ? y((L) => ({ ...L, isRunning: !0 }))
                : z.type === "functionComplete"
                  ? y((L) => ({
                      ...L,
                      functionTimes: {
                        ...L.functionTimes,
                        [z.functionName]:
                          (L.functionTimes[z.functionName] || 0) + z.duration,
                      },
                      totalTime: L.totalTime + z.duration,
                    }))
                  : z.type === "complete" &&
                    (l(!1),
                    s(null),
                    y((L) => ({ ...L, isRunning: !1 })),
                    Ue(null));
        },
      });
      w(T);
    }, []));
  const Ds = E.useCallback(
      async (T) => {
        if (!v || o) return;
        const z = e.find((Y) => Y.id === T);
        if (!z) return;
        const L = Ar(z.code),
          V = yg(z.code);
        if (L.length > 0) {
          (V !== cn.current && (sa(cn.current), (cn.current = V)), vg(V));
          const Y = gg(V),
            ne = ct("error-run"),
            Vn = Y === 1 && !ne,
            Ud = Y >= 3 && ne;
          if (Vn) {
            const cl = {
              id: "error-run",
              title: "Code Has Errors",
              message:
                "Your code has errors. Check the red markers in the editor and fix them before running.",
              isTutorial: !0,
              onDismiss: () => {
                (Wl("error-run"), nt("error-run", cl));
              },
            };
            F((fn) =>
              fn.find((kt) => kt.id === "error-run") ? fn : [...fn, cl],
            );
          } else if (Ud) {
            G((kt) => kt.filter((Qn) => Qn.id !== "error-run-specific"));
            const fn = {
              id: "error-run-specific",
              title: "Fix These Errors",
              message: `You've tried running this code multiple times. Here are the errors:

${L.map((kt) => `Line ${kt.lineNumber}: ${kt.message}`).join(`
`)}`,
              isTutorial: !0,
              onDismiss: () => {
                nt("error-run-specific", fn);
              },
            };
            F((kt) => {
              const Qn = kt.filter((dl) => dl.id !== "error-run");
              return Qn.find((dl) => dl.id === "error-run-specific")
                ? Qn
                : [...Qn, fn];
            });
          }
          return;
        }
        (sa(V),
          (cn.current = V),
          F((Y) => Y.filter((ne) => ne.id !== "error-run-specific")),
          l(!0),
          s(T),
          a([]),
          y({ totalTime: 0, functionTimes: {}, isRunning: !0 }),
          $(!1),
          Ue(null),
          c((Y) => [
            ...Y,
            {
              type: "log",
              message: `--- Execution started: ${z.filename} ---`,
              timestamp: Date.now(),
            },
          ]));
        try {
          if (
            (console.log("Executing user code:", z.filename),
            await v.execute(z.code),
            console.log("Execution completed"),
            B > 0)
          ) {
            if (
              ((A.current += 1), A.current >= 3 && !ct("upgrades-available"))
            ) {
              const Y = {
                id: "upgrades-available",
                title: "Upgrades Available",
                message: `You have ${B} upgrade${B > 1 ? "s" : ""} available! Open the Tech Tree (Ctrl+U) to unlock new features and improve your code.`,
                isTutorial: !0,
                onDismiss: () => {
                  (Wl("upgrades-available"), nt("upgrades-available", Y));
                },
              };
              F((ne) =>
                ne.find((Vn) => Vn.id === "upgrades-available")
                  ? ne
                  : [...ne, Y],
              );
            }
          } else A.current = 0;
        } catch (Y) {
          (console.error("Execution error:", Y),
            c((ne) => [
              ...ne,
              {
                type: "error",
                message: `Execution failed: ${Y instanceof Error ? Y.message : String(Y)}`,
                timestamp: Date.now(),
              },
            ]),
            g || de(!0),
            l(!1),
            s(null),
            y((ne) => ({ ...ne, isRunning: !1 })),
            Ue(null));
        }
      },
      [v, o, e, g],
    ),
    al = E.useCallback(() => {
      v &&
        o &&
        (console.log("App: Stopping execution"),
        v.stop(),
        l(!1),
        s(null),
        y((T) => ({ ...T, isRunning: !1 })),
        a([]),
        Ue(null),
        c((T) => [
          ...T,
          {
            type: "log",
            message: "--- Execution stopped ---",
            timestamp: Date.now(),
          },
        ]));
    }, [v, o]),
    Dd = E.useCallback((T, z) => {
      (t((L) => L.map((V) => (V.id === T ? { ...V, code: z } : V))), r(T));
    }, []),
    $d = E.useCallback(
      (T) => {
        if (e.length > 1 && (t((z) => z.filter((L) => L.id !== T)), n === T)) {
          const z = e.filter((L) => L.id !== T);
          z.length > 0 && r(z[0].id);
        }
      },
      [e, n],
    ),
    $s = E.useCallback(
      (T) => {
        if (T.lineNumber) {
          const z = e.find((L) => L.id === n);
          if (z) {
            const L = Hn.current.get(z.id);
            L && L.scrollToLine(T.lineNumber);
          }
        }
      },
      [n, e],
    ),
    Fd = E.useCallback(() => {
      window.confirm(
        "Are you sure you want to reset all progress? This cannot be undone.",
      ) &&
        (q.getState().resetGameState(),
        mg(),
        F([]),
        G([]),
        window.location.reload());
    }, []),
    rt = E.useCallback((T) => {
      (r(T), (ae.current = [T, ...ae.current.filter((z) => z !== T)]));
    }, []),
    Fs = E.useCallback(() => {
      const T = n;
      T === "main" ||
        e.find((z) => z.id === T) ||
        (T === "tech-tree"
          ? p(!1)
          : T === "log"
            ? (S(!1), $(!1), Q(!1), de(!1))
            : T === "docs" && (k(!1), O(void 0)),
        (ae.current = ae.current.filter((z) => z !== T)),
        ae.current.length > 0 ? r(ae.current[0]) : r("main"));
    }, [n, e]);
  return (
    Qt(
      "ctrl+u, cmd+u",
      (T) => {
        (T.preventDefault(),
          p((z) => {
            const L = !z;
            return (L && (h(void 0), rt("tech-tree")), L);
          }));
      },
      { enableOnFormTags: !0 },
    ),
    Qt(
      "ctrl+l, cmd+l",
      (T) => {
        (T.preventDefault(),
          S((z) => {
            const L = !z;
            return (L && (rt("log"), Q(!1), de(!1)), L);
          }));
      },
      { enableOnFormTags: !0 },
    ),
    Qt(
      "ctrl+d, cmd+d",
      (T) => {
        (T.preventDefault(),
          k((z) => {
            const L = !z;
            return (L && rt("docs"), L);
          }));
      },
      { enableOnFormTags: !0 },
    ),
    Qt(
      "ctrl+s, cmd+s",
      (T) => {
        T.preventDefault();
      },
      { enableOnFormTags: !0 },
    ),
    Qt(
      "escape",
      (T) => {
        (T.preventDefault(), Fs());
      },
      { enableOnFormTags: !0 },
      [Fs],
    ),
    Qt(
      "f5",
      (T) => {
        (T.preventDefault(), o ? al() : Ds(n));
      },
      { enableOnFormTags: !0 },
      [o, n],
    ),
    Qt(
      "escape",
      (T) => {
        o && (T.preventDefault(), al());
      },
      { enableOnFormTags: !0 },
      [o],
    ),
    f.jsxs("div", {
      style: {
        width: "100vw",
        height: "100vh",
        backgroundColor: "#1e1e1e",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      },
      children: [
        f.jsx(ug, {}),
        f.jsx(eg, { stats: C }),
        e.map((T) =>
          f.jsx(
            la,
            {
              id: T.id,
              title: T.filename,
              initialX: T.x,
              initialY: T.y,
              initialWidth: T.width,
              initialHeight: T.height,
              isRunning: o && i === T.id,
              canRun: !o,
              isActive: n === T.id,
              onFocus: () => rt(T.id),
              onRun: () => Ds(T.id),
              onStop: al,
              onClose: e.length > 1 ? () => $d(T.id) : void 0,
              children: f.jsx(qh, {
                ref: (z) => {
                  z ? Hn.current.set(T.id, z) : Hn.current.delete(T.id);
                },
                code: T.code,
                onCodeChange: (z) => Dd(T.id, z),
                executionEvents: i === T.id ? u : [],
                scrollToLineNumber: i === T.id ? Ye : null,
                onOpenTechTree: (z) => {
                  (p(!0), h(z), rt("tech-tree"));
                },
              }),
            },
            T.id,
          ),
        ),
        g &&
          f.jsx(la, {
            id: "log",
            title: Ce ? "⚠️ Log (Error Detected)" : "Log",
            initialX: 100,
            initialY: 580,
            initialWidth: 700,
            initialHeight: 200,
            canRun: !1,
            isActive: n === "log",
            onFocus: () => rt("log"),
            onClose: () => {
              (S(!1),
                $(!1),
                Q(!1),
                de(!1),
                (ae.current = ae.current.filter((T) => T !== "log")),
                ae.current.length > 0 && r(ae.current[0]));
            },
            children: f.jsx(og, { logs: m }),
          }),
        R.length > 0 &&
          f.jsx(ng, {
            hint: R[0],
            onDismiss: () => {
              var T;
              (T = R[0]) != null && T.onDismiss && R[0].onDismiss();
            },
            onHintClick: $s,
          }),
        f.jsx(rg, {
          activeHints: R,
          dismissedHints: te,
          onHintClick: $s,
          onReopenHint: Id,
        }),
        f.jsxs("div", {
          style: {
            position: "fixed",
            bottom: "16px",
            left: "16px",
            display: "flex",
            gap: "8px",
            zIndex: 9999,
          },
          children: [
            f.jsxs("button", {
              onClick: () => {
                (p(!0), h(void 0), rt("tech-tree"));
              },
              style: {
                padding: "8px 16px",
                backgroundColor: "#2d2d2d",
                color: "#cccccc",
                border: "1px solid #ff6b35",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                position: "relative",
                animation:
                  B > 0 && !P
                    ? "pulse-border 1.5s ease-in-out infinite"
                    : "none",
                boxShadow:
                  B > 0 && !P ? "0 0 10px rgba(255, 107, 53, 0.6)" : "none",
              },
              children: [
                "TECH TREE",
                B > 0 &&
                  f.jsx("span", {
                    style: {
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      backgroundColor: "#ff6b35",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "bold",
                      border: "2px solid #1e1e1e",
                    },
                    children: B,
                  }),
                f.jsx("style", {
                  children: `
            @keyframes pulse-border {
              0%, 100% {
                border-color: #ff6b35;
                box-shadow: 0 0 10px rgba(255, 107, 53, 0.6);
              }
              50% {
                border-color: #ff8c5a;
                box-shadow: 0 0 20px rgba(255, 107, 53, 0.9);
              }
            }
          `,
                }),
              ],
            }),
            f.jsxs("button", {
              onClick: () => {
                const T = !g;
                (S(T), T && (Q(!1), de(!1), rt("log")));
              },
              style: {
                padding: "8px 16px",
                backgroundColor:
                  !g && K ? "#2d1e1e" : !g && I ? "#2d2d1e" : "#2d2d2d",
                color: !g && K ? "#ff6b6b" : !g && I ? "#ffc107" : "#cccccc",
                border:
                  !g && K
                    ? "1px solid #dc3545"
                    : !g && I
                      ? "1px solid #ffc107"
                      : "1px solid #3c3c3c",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                boxShadow:
                  !g && (K || I)
                    ? K
                      ? "0 0 10px rgba(220, 53, 69, 0.6)"
                      : "0 0 10px rgba(255, 193, 7, 0.6)"
                    : "none",
                animation:
                  !g && (K || I)
                    ? "pulse-log-button 1.5s ease-in-out infinite"
                    : "none",
              },
              children: [
                g ? "Hide Log" : "Show Log",
                (K || I) &&
                  !g &&
                  f.jsx("span", {
                    style: { marginLeft: "6px", fontSize: "11px" },
                    children: "⚠️",
                  }),
                !g &&
                  (K || I) &&
                  f.jsx("style", {
                    children: `
              @keyframes pulse-log-button {
                0%, 100% {
                  box-shadow: 0 0 10px ${K ? "rgba(220, 53, 69, 0.6)" : "rgba(255, 193, 7, 0.6)"};
                }
                50% {
                  box-shadow: 0 0 20px ${K ? "rgba(220, 53, 69, 0.9)" : "rgba(255, 193, 7, 0.9)"};
                }
              }
            `,
                  }),
              ],
            }),
            f.jsx("button", {
              onClick: () => {
                (k(!0), rt("docs"));
              },
              style: {
                padding: "8px 16px",
                backgroundColor: "#2d2d2d",
                color: "#cccccc",
                border: "1px solid #4a9eff",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
              },
              children: "📖 Docs",
            }),
            f.jsx("button", {
              onClick: Fd,
              style: {
                padding: "8px 16px",
                backgroundColor: "#2d2d2d",
                color: "#dc3545",
                border: "1px solid #dc3545",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
              },
              title: "Reset all progress (for testing)",
              children: "🔄 Reset",
            }),
          ],
        }),
        f.jsx(sg, {
          isOpen: N,
          initialSelectedTechId: d,
          onFocus: () => h(void 0),
          onClose: () => p(!1),
          onOpenDocs: (T) => {
            (p(!1),
              h(void 0),
              (ae.current = ae.current.filter((z) => z !== "tech-tree")),
              k(!0),
              O(T),
              rt("docs"));
          },
        }),
        f.jsx(tg, {
          isOpen: x,
          onClose: () => {
            (k(!1),
              O(void 0),
              (ae.current = ae.current.filter((T) => T !== "docs")),
              ae.current.length > 0 && r(ae.current[0]));
          },
          scrollToSection: j,
        }),
      ],
    })
  );
}
Hl.createRoot(document.getElementById("root")).render(
  f.jsx(We.StrictMode, { children: f.jsx(xg, {}) }),
);
