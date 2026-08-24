import Image from "next/image";
import s from "./auth.module.css";

/**
 * The four floating panels beside the login form.
 *
 * These were hand-built markup so they would stay sharp and track the product.
 * They are now the real screenshots, which is the stronger claim to make on a
 * login screen: this is the actual thing, not an illustration of it.
 *
 * Each panel carries its own aspect ratio rather than a shared one. A UI
 * screenshot cropped to a common shape loses the very thing it is showing, and
 * these range from 1.87:1 to 3.95:1.
 *
 * Width and height are the files' intrinsic pixel sizes, passed explicitly so
 * the browser reserves the box before the image arrives and nothing shifts.
 *
 * aria-hidden with empty alt throughout — this is decoration standing beside a
 * password field, and narrating four product screenshots ahead of the form
 * would bury it.
 *
 * The class names are positional, kept from the hand-built version so the
 * offsets stay put; they no longer describe what each panel contains.
 */

const PANELS = [
  { className: s.sHealth, src: "/login/dashboard.webp", width: 1034, height: 552, priority: true },
  { className: s.sProd, src: "/login/products.webp", width: 1400, height: 615 },
  { className: s.sStudio, src: "/login/create-tools.webp", width: 878, height: 222 },
  { className: s.sChat, src: "/login/calculators.webp", width: 1184, height: 357 },
];

export default function Showcase() {
  return (
    <div className={s.shots} aria-hidden="true">
      {PANELS.map(({ className, src, width, height, priority }) => (
        <div key={src} className={`${s.shot} ${className}`}>
          <Image
            src={src}
            alt=""
            width={width}
            height={height}
            priority={priority}
            // Only the topmost panel is above the fold; the rest can wait.
            loading={priority ? undefined : "lazy"}
          />
        </div>
      ))}
    </div>
  );
}
