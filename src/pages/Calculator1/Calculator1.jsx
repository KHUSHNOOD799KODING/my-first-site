import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Calculator.css";
import Universe from "../Universe/Universe";
// Keeps numbers readable in the display without losing too much precision
function formatNum(n) {
  if (n === "Error") return n;
  const num = Number(n);
  if (!isFinite(num)) return "Error";
  if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-9 && num !== 0)) {
    return num.toExponential(6);
  }
  const str = String(num);
  return str.length > 14 ? num.toPrecision(10).replace(/\.?0+$/, "") : str;
}

const factorial = (n) => {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};

// base-unit factors: value * factor = value in the base unit
const UNIT_GROUPS = {
  Length: {
    base: "m",
    units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, mi: 1609.34 },
  },
  Mass: {
    base: "kg",
    units: { mg: 1e-6, g: 0.001, kg: 1, lb: 0.453592, oz: 0.0283495, ton: 1000 },
  },
};

function Converter() {
  const [category, setCategory] = useState("Length");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("km");
  const [amount, setAmount] = useState("1");

  const [currencies, setCurrencies] = useState(null); // { USD: 1, INR: 83.1, ... }
  const [curFrom, setCurFrom] = useState("USD");
  const [curTo, setCurTo] = useState("INR");
  const [curAmount, setCurAmount] = useState("1");
  const [curStatus, setCurStatus] = useState("idle"); // idle | loading | error | ready

  const isCurrency = category === "Currency";

  useEffect(() => {
    if (!isCurrency || currencies) return;
    setCurStatus("loading");
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((data) => {
        if (data.result !== "success") throw new Error();
        setCurrencies(data.rates);
        setCurStatus("ready");
      })
      .catch(() => setCurStatus("error"));
  }, [isCurrency, currencies]);

  const groups = Object.keys(UNIT_GROUPS);
  const units = Object.keys(UNIT_GROUPS[category]?.units || {});

  const unitResult = useMemo(() => {
    if (isCurrency) return null;
    const factors = UNIT_GROUPS[category].units;
    const n = Number(amount);
    if (!isFinite(n)) return "";
    const inBase = n * factors[from];
    return formatNum(inBase / factors[to]);
  }, [category, from, to, amount, isCurrency]);

  const currencyResult = useMemo(() => {
    if (!isCurrency || !currencies) return "";
    const n = Number(curAmount);
    if (!isFinite(n)) return "";
    const inUsd = n / currencies[curFrom];
    return formatNum(inUsd * currencies[curTo]);
  }, [isCurrency, currencies, curFrom, curTo, curAmount]);

  return (
    <div className="conv">
      <div className="conv-tabs">
        {[...groups, "Currency"].map((g) => (
          <button
            key={g}
            className={`pill${category === g ? " pill--on" : ""}`}
            onClick={() => setCategory(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {!isCurrency ? (
        <div className="conv-row">
          <div className="conv-field">
            <input
              className="conv-input"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select value={from} onChange={(e) => setFrom(e.target.value)} className="conv-select">
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="conv-field">
            <span className="conv-result">{unitResult}</span>
            <select value={to} onChange={(e) => setTo(e.target.value)} className="conv-select">
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="conv-row">
          {curStatus === "loading" && <p className="conv-note">Loading live rates…</p>}
          {curStatus === "error" && (
            <p className="conv-note">Couldn't load rates — check your connection.</p>
          )}
          {curStatus === "ready" && currencies && (
            <>
              <div className="conv-field">
                <input
                  className="conv-input"
                  type="number"
                  value={curAmount}
                  onChange={(e) => setCurAmount(e.target.value)}
                />
                <select
                  value={curFrom}
                  onChange={(e) => setCurFrom(e.target.value)}
                  className="conv-select"
                >
                  {Object.keys(currencies).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="conv-field">
                <span className="conv-result">{currencyResult}</span>
                <select
                  value={curTo}
                  onChange={(e) => setCurTo(e.target.value)}
                  className="conv-select"
                >
                  {Object.keys(currencies).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Calculator() {
  const [universeOn, setUniverseOn] = useState(false);
  const [expr, setExpr] = useState(""); // what the user has typed, e.g. "12+8×"
  const [display, setDisplay] = useState("0"); // the big live-evaluated number
  const [history, setHistory] = useState([]); // [{ expr, result }]
  const [memory, setMemory] = useState(0);
  const [lastAnswer, setLastAnswer] = useState(0);
  const [isRad, setIsRad] = useState(true); // angle mode for trig
  const [isSci, setIsSci] = useState(false); // scientific row toggle
  const [isConv, setIsConv] = useState(false); // unit/currency converter panel
  // const [glowOn, setGlowOn] = useState(true); 
  // RGB border on/off
  const [glowOn, setGlowOn] = useState(false);
  const [flash, setFlash] = useState(""); // which button glows from a keypress

  // Turns the user-facing expression into something JS can evaluate safely
  const toJsExpr = useCallback(
    (raw) => {
      let s = raw
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/π/g, "(Math.PI)")
        .replace(/e(?![0-9])/g, "(Math.E)")
        .replace(/√\(/g, "Math.sqrt(")
        .replace(/sin\(/g, isRad ? "Math.sin(" : "Math.sin(Math.PI/180*")
        .replace(/cos\(/g, isRad ? "Math.cos(" : "Math.cos(Math.PI/180*")
        .replace(/tan\(/g, isRad ? "Math.tan(" : "Math.tan(Math.PI/180*")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/(\d+(?:\.\d+)?)!/g, "__fact($1)")
        .replace(/mod/g, "%")
        .replace(/ANS/g, `(${lastAnswer})`)
        .replace(/\^/g, "**");

      // Insert the multiplication JS needs but humans skip, e.g. "2π",
      // "3sin(30)", "2(3+4)", "(2+3)(4+5)" — without this, those throw
      // a syntax error instead of evaluating.
      s = s
        .replace(/(\d)(Math\.)/g, "$1*$2")
        .replace(/(\d)\(/g, "$1*(")
        .replace(/\)(\d)/g, ")*$1")
        .replace(/\)(Math\.)/g, ")*$1")
        .replace(/\)\(/g, ")*(");

      return s;
    },
    [isRad, lastAnswer]
  );

  const evaluate = useCallback(
    (raw) => {
      if (!raw) return "0";
      try {
        const jsExpr = toJsExpr(raw);
        // eslint-disable-next-line no-new-func
        const fn = new Function("__fact", `return (${jsExpr})`);
        const result = fn(factorial);
        if (typeof result !== "number" || !isFinite(result)) return "Error";
        return formatNum(result);
      } catch {
        return display; // keep showing the last good value while mid-expression
      }
    },
    [toJsExpr, display]
  );

  // live preview as the user types
  useEffect(() => {
    setDisplay(evaluate(expr));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expr]);

  const pulse = (key) => {
    setFlash(key);
    setTimeout(() => setFlash(""), 160);
  };

  const append = (val) => setExpr((e) => e + val);

  const handleEquals = () => {
    if (!expr) return;
    const result = evaluate(expr);
    if (result !== "Error") {
      setHistory((h) => [{ expr, result }, ...h].slice(0, 8));
      setLastAnswer(Number(result));
    }
    setExpr(result === "Error" ? "" : String(result));
    setDisplay(result);
  };

  const handleClear = () => {
    setExpr("");
    setDisplay("0");
  };

  const handleBackspace = () => setExpr((e) => e.slice(0, -1));

  const handlePercent = () => {
    const result = evaluate(expr);
    if (result === "Error") return;
    const val = String(Number(result) / 100);
    setExpr(val);
  };

  const applyUnary = (fn) => {
    const result = evaluate(expr);
    if (result === "Error") return;
    setExpr(String(fn(Number(result))));
  };

  const handleKey = useCallback(
    (key) => {
      switch (key) {
        case "AC":
          return handleClear();
        case "DEL":
          return handleBackspace();
        case "=":
          return handleEquals();
        case "%":
          return handlePercent();
        case "x²":
          return applyUnary((n) => n * n);
        case "x³":
          return applyUnary((n) => n * n * n);
        case "1/x":
          return applyUnary((n) => 1 / n);
        case "ANS":
          return append("ANS");
        default:
          return append(key);
      }
    },
    [expr, display]
  );

  // physical keyboard support
  useEffect(() => {
    const map = {
      Enter: "=",
      Backspace: "DEL",
      Escape: "AC",
      "*": "×",
      "/": "÷",
      "-": "−",
      "+": "+",
      "%": "%",
      ".": ".",
      "(": "(",
      ")": ")",
    };
    const onKey = (e) => {
      const k = e.key;
      if (/^[0-9]$/.test(k)) {
        pulse(k);
        append(k);
        return;
      }
      if (map[k]) {
        e.preventDefault();
        pulse(map[k]);
        handleKey(map[k]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleKey]);

  const pad = useMemo(
    () => [
      { label: "AC", type: "fn" },
      { label: "DEL", type: "fn" },
      { label: "%", type: "fn" },
      { label: "÷", type: "op" },

      { label: "7", type: "num" },
      { label: "8", type: "num" },
      { label: "9", type: "num" },
      { label: "×", type: "op" },

      { label: "4", type: "num" },
      { label: "5", type: "num" },
      { label: "6", type: "num" },
      { label: "−", type: "op" },

      { label: "1", type: "num" },
      { label: "2", type: "num" },
      { label: "3", type: "num" },
      { label: "+", type: "op" },

      { label: "00", type: "num" },
      { label: "0", type: "num" },
      { label: ".", type: "num" },
      { label: "=", type: "eq" },
    ],
    []
  );

  const sciPad = [
    "sin(", "cos(", "tan(",
    "√(", "(", ")",
    "^", "π", "!",
    "log(", "ln(", "e",
    "x²", "x³", "1/x",
    "mod", "ANS", "DEL",
  ];

  const press = (label) => {
    pulse(label);
    handleKey(label);
  };

  return (
    <div className="calc-page">
      {universeOn && <Universe />}
      <div className="calc-ambient" aria-hidden="true" />

      <div className="calc-shell">
        <div className="calc-topbar">
          <Link to="/" className="calc-back">
            ← Home
          </Link>
          <h1 className="calc-title">Calculator</h1>
          <span className="calc-topbar-spacer" />
        </div>

        <div className="calc-layout">
          <div className={`calc-body${glowOn ? " calc-body--glow" : ""}`}>
            <div className="calc-screen">
              <div className="calc-history">
                {history[0] ? `${history[0].expr} =` : "\u00A0"}
              </div>
              <div className="calc-expr">{expr || "0"}</div>
              <div className="calc-result">{display}</div>
            </div>

            <div className="calc-toolbar">
              <button
                className={`pill${isSci ? " pill--on" : ""}`}
                onClick={() => setIsSci((v) => !v)}
              >
                Scientific
              </button>
              <button
                className={`pill${isConv ? " pill--on" : ""}`}
                onClick={() => setIsConv((v) => !v)}
              >
                Convert
              </button>
              <button
                className={`pill${isRad ? " pill--on" : ""}`}
                onClick={() => setIsRad((v) => !v)}
              >
                {isRad ? "RAD" : "DEG"}
              </button>
              <button
                className="pill"
                onClick={() => setMemory((m) => m + (Number(display) || 0))}
              >
                M+
              </button>
              <button className="pill" onClick={() => setExpr(String(memory))}>
                MR
              </button>
              <button className="pill" onClick={() => setMemory(0)}>
                MC
              </button>
              <button
                className={`pill${glowOn ? " pill--on" : ""}`}
                onClick={() => setGlowOn((v) => !v)}
              >
                RGB Border
              </button>
              <button
                type="button"
                className={`chip chip--universe${universeOn ? " chip--on" : ""}`}
                onClick={() => setUniverseOn((v) => !v)}
              >
                ✨ Universe
              </button>
            </div>

            {isConv && <Converter />}

            {isSci && (
              <div className="calc-grid calc-grid--sci">
                {sciPad.map((key) => (
                  <button
                    key={key}
                    className={`key key--sci${flash === key ? " key--flash" : ""}`}
                    onClick={() => press(key)}
                  >
                    {key.replace("(", "")}
                  </button>
                ))}
              </div>
            )}

            <div className="calc-grid">
              {pad.map((btn) => (
                <button
                  key={btn.label}
                  className={`key key--${btn.type}${flash === btn.label ? " key--flash" : ""
                    }`}
                  onClick={() => press(btn.label)}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="calc-log">
            <p className="calc-log-title">History</p>
            {history.length === 0 ? (
              <p className="calc-log-empty">Your calculations will appear here.</p>
            ) : (
              <ul>
                {history.map((h, i) => (
                  <li key={i}>
                    <span className="calc-log-expr">{h.expr}</span>
                    <span className="calc-log-result">= {h.result}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}