import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { CalendarDay } from "../domain/slots";

export function DayStrip({
  days,
  activeDateKey,
  onSelect,
}: {
  days: CalendarDay[];
  activeDateKey: string;
  onSelect: (dateKey: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    function measure() {
      const node = scrollerRef.current;
      if (!node) return;
      const canScroll = node.scrollWidth > node.clientWidth + 2;
      setOverflow(canScroll);
      setAtStart(node.scrollLeft <= 2);
      setAtEnd(node.scrollLeft + node.clientWidth >= node.scrollWidth - 2);
    }

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    scroller.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", measure);
    };
  }, [days]);

  function scrollByDays(direction: -1 | 1) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const distance = Math.max(scroller.clientWidth * 0.8, 160);
    scroller.scrollBy({ left: direction * distance, behavior: "smooth" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const enabled = days.filter((day) => !day.closed);
    const index = enabled.findIndex((day) => day.dateKey === activeDateKey);
    const nextIndex = event.key === "ArrowRight" ? index + 1 : index - 1;
    const next = enabled[nextIndex];
    if (!next) return;
    event.preventDefault();
    onSelect(next.dateKey);
    const button = document.getElementById(`day-${next.dateKey}`);
    button?.focus({ preventScroll: true });
    button?.scrollIntoView?.({ inline: "nearest", block: "nearest" });
  }

  return (
    <div className="day-strip-wrap">
      {overflow ? (
        <button
          type="button"
          className="day-nav"
          aria-label="Earlier days"
          disabled={atStart}
          onClick={() => scrollByDays(-1)}
        >
          <span aria-hidden="true">‹</span>
        </button>
      ) : null}
      <div
        ref={scrollerRef}
        className={overflow ? "day-strip can-scroll" : "day-strip"}
        role="tablist"
        aria-label="Days in the next two weeks"
        onKeyDown={onKeyDown}
      >
        {days.map((day) => {
          const openCount = day.slots.filter((slot) => slot.available).length;
          return (
            <button
              key={day.dateKey}
              type="button"
              role="tab"
              id={`day-${day.dateKey}`}
              aria-selected={day.dateKey === activeDateKey}
              aria-controls="slot-panel"
              disabled={day.closed}
              tabIndex={day.closed ? -1 : 0}
              aria-label={day.closed ? `${day.longLabel}, closed` : day.longLabel}
              onClick={() => onSelect(day.dateKey)}
            >
              <span className="day-wd">{day.weekdayShort}</span>
              <span className="day-num">{day.dayNum}</span>
              <span className="day-sub">{day.closed ? "Closed" : `${openCount} open`}</span>
            </button>
          );
        })}
      </div>
      {overflow ? (
        <button
          type="button"
          className="day-nav"
          aria-label="Later days"
          disabled={atEnd}
          onClick={() => scrollByDays(1)}
        >
          <span aria-hidden="true">›</span>
        </button>
      ) : null}
    </div>
  );
}
