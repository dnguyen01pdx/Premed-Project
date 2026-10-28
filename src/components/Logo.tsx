import { MED_MAPPED, SITE_NAME } from "@/lib/config";

/**
 * MD Atlas compass mark.
 *
 * Deliberately low-detail: one ring, four cardinal ticks, one needle. Anything
 * more (inner rings, hairline ticks) turns to mush at the 20px the nav bar
 * actually renders it at. Checked at 16, 20, 28, 40 and 80px on both white and
 * navy before being adopted.
 *
 * Only the north half of the needle is filled, so the mark reads as pointing
 * somewhere rather than as a symmetric X. Everything uses `currentColor`, so a
 * single component serves both the navy header and light surfaces.
 */
export function CompassMark({
  className = "h-7 w-7",
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
    >
      <circle
        cx="16"
        cy="16"
        r="13.5"
        stroke="currentColor"
        strokeWidth="2.25"
        opacity="0.4"
      />
      <g
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      >
        <path d="M16 0.9v3" />
        <path d="M16 28.1v3" />
        <path d="M0.9 16h3" />
        <path d="M28.1 16h3" />
      </g>
      {/* South half: outline only. */}
      <path
        d="M16 27 L20.6 14.4 L16 17.2 L11.4 14.4 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.5"
      />
      {/* North half: solid, in Med Mapped coral, which reads on both ink
          and white. */}
      <path
        d="M16 5 L20.6 17.6 L16 14.8 L11.4 17.6 Z"
        fill="#ff6f59"
        stroke="#ff6f59"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Mark plus wordmark, for the header and footer. The small "by Med Mapped"
 * line ties the app to the blog it belongs to.
 */
export function Logo({
  className = "",
  markClassName = "h-7 w-7",
  byline = true,
}: {
  className?: string;
  markClassName?: string;
  byline?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <CompassMark className={markClassName} />
      <span className="flex flex-col">
        <span className="font-display text-[1.65rem] leading-[0.85]">
          {SITE_NAME}
        </span>
        {byline && (
          <span className="mt-0.5 font-[family-name:var(--font-label)] text-[10px] uppercase leading-none tracking-[0.12em] opacity-70">
            by {MED_MAPPED.name}
          </span>
        )}
      </span>
    </span>
  );
}
