import s from "./auth.module.css";

/**
 * Brand Health, Products, Studio and AI Chat.
 *
 * Real markup, not screenshots — the chart is inline SVG and the Studio cards
 * use the app's own gradient tokens, so they stay sharp at any zoom and get
 * updated when the product does. Only the product thumbnails are placeholders.
 *
 * The 87% is marketing furniture and stays hard-coded. A login page must never
 * show anyone's real figures: nobody has authenticated yet.
 *
 * aria-hidden — this is decoration beside the form, and a screen reader
 * reading out a fake product table before the password field would be noise.
 */

const PICTURE_GLYPH = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5zm5.6 1.4a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8m9.9 9.8-4.3-5.1a.9.9 0 0 0-1.36-.02l-2.5 2.85-1.1-1.05a.9.9 0 0 0-1.3.06L5.4 17.7z" />
  </svg>
);

export default function Showcase() {
  return (
    <div className={s.shots} aria-hidden="true">
      {/* brand health */}
      <div className={`${s.shot} ${s.sHealth}`}>
        <div className={s.sh}>
          <h4>Brand Health</h4>
          <a href="#">View report →</a>
        </div>
        <div className={s.hrow}>
          <span className={s.big}>87%</span>
          <span className={s.pill}>Strong</span>
        </div>
        <div className={s.delta}>↑ 12% vs last month</div>
        <div className={s.chartwrap}>
          <div className={s.yax}>
            <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
          </div>
          <svg viewBox="0 0 300 88" preserveAspectRatio="none" style={{ width: "100%", height: 62 }}>
            <defs>
              <linearGradient id="bhFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f0562a" stopOpacity=".22" />
                <stop offset="1" stopColor="#f0562a" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line className={s.grid} x1="0" y1="22" x2="300" y2="22" strokeWidth="1" />
            <line className={s.grid} x1="0" y1="44" x2="300" y2="44" strokeWidth="1" />
            <line className={s.grid} x1="0" y1="66" x2="300" y2="66" strokeWidth="1" />
            <path d="M8 70 L60 62 L112 56 L164 44 L216 34 L268 12 L268 88 L8 88 Z" fill="url(#bhFill)" />
            <path
              d="M8 70 L60 62 L112 56 L164 44 L216 34 L268 12"
              fill="none" stroke="#f0562a" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"
            />
            {[[8, 70], [60, 62], [112, 56], [164, 44], [216, 34]].map(([cx, cy]) => (
              <circle key={cx} cx={cx} cy={cy} r="3.2" fill="#f0562a" />
            ))}
            <circle cx="268" cy="12" r="4.4" fill="#f0562a" />
          </svg>
          <div className={s.xax}>
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
          </div>
        </div>
      </div>

      {/* products */}
      <div className={`${s.shot} ${s.sProd}`}>
        <div className={s.sh}>
          <h4>Products</h4>
          <span className={s.cnt}>2</span>
        </div>
        <div className={s.shotSub}>Everything Branditect can write about, price, and photograph.</div>
        <div className={s.ptable}>
          <div className={s.pthead}>
            <span>Product</span>
            <span>Category</span>
            <span style={{ textAlign: "right" }}>Price</span>
            <span style={{ textAlign: "right" }}>Margin</span>
          </div>
          <div className={s.ptr}>
            <div className={s.pname}>
              <span className={s.thumb}>{PICTURE_GLYPH}</span>
              <b>DEKLAN PLASMA ION<br />FLO HAIR DRYER</b>
            </div>
            <span className={`${s.tagp} ${s.tagpA}`}>hair dryer</span>
            <span className={s.pprice}>€139.00</span>
            <span className={s.pmarg}><b>71%<sup>*</sup></b><span>€99.00</span></span>
          </div>
          <div className={s.ptr}>
            <div className={s.pname}>
              <span className={s.thumb}>{PICTURE_GLYPH}</span>
              <b>Deklan brush</b>
            </div>
            <span className={`${s.tagp} ${s.tagpB}`}>brushes</span>
            <span className={s.pprice}>€13.90</span>
            <span className={s.pmarg}><b>78%<sup>*</sup></b><span>€10.90</span></span>
          </div>
        </div>
      </div>

      {/* studio */}
      <div className={`${s.shot} ${s.sStudio}`}>
        <div className={s.sh}><h4>Studio <small>Create with your brand</small></h4></div>
        <div className={s.mini}>
          <div className={`${s.mcard} ${s.m1}`}>
            <b>Write</b><span>On brand, on strategy, on the facts.</span>
            <span className={s.mline} /><span className={s.mline} /><span className={s.arw}>→</span>
          </div>
          <div className={`${s.mcard} ${s.m2}`}>
            <b>Create images</b><span>New images based on your products and style.</span>
            <span className={s.mimg} /><span className={s.arw}>→</span>
          </div>
          <div className={`${s.mcard} ${s.m3}`}>
            <b>Do the numbers</b><span>Profitability, pricing structure and offers.</span>
            <span className={s.mart}>
              <i style={{ width: 12, height: 26, background: "#ef5a2f" }} />
              <i style={{ width: 12, height: 20, background: "#4a6ea8" }} />
              <i style={{ width: 12, height: 30, background: "#6b53ac" }} />
            </span>
            <span className={s.arw}>→</span>
          </div>
          <div className={`${s.mcard} ${s.m4}`}>
            <b>Brand Assets</b><span>Your logos, colors and brand guidelines.</span>
            <span className={s.mart}>
              <i style={{ width: 10, height: 18, background: "#1d2748" }} />
              <i style={{ width: 10, height: 24, background: "#f0562a" }} />
              <i style={{ width: 10, height: 20, background: "#5b8fd0" }} />
              <i style={{ width: 10, height: 26, background: "#7b5ea7" }} />
            </span>
            <span className={s.arw}>→</span>
          </div>
          <div className={`${s.mcard} ${s.m5}`}>
            <b>More</b><span>Explore all studio tools.</span>
            <span className={s.mline} style={{ background: "rgba(240,86,42,.22)" }} />
            <span className={s.arw}>→</span>
          </div>
        </div>
      </div>

      {/* chat */}
      <div className={`${s.shot} ${s.sChat}`}>
        <div className={s.sh}><h4>AI Chat<span className={s.spark}>✦</span></h4></div>
        <div className={s.sug}>
          <div>What should I post about this week?</div>
          <div>What&apos;s the deepest discount I can run?</div>
          <div>What&apos;s missing from my brand?</div>
        </div>
      </div>
    </div>
  );
}
