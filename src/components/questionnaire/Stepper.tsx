import clsx from "clsx";
import { Check } from "lucide-react";

interface Props {
  steps: string[];
  current: number;
  onStepClick?: (i: number) => void;
}

export function Stepper({ steps, current, onStepClick }: Props) {
  return (
    <div className="card p-3 overflow-x-auto scrollbar-thin">
      <ol className="flex items-center min-w-max">
        {steps.map((s, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <li key={s} className="flex items-center">
              <button
                onClick={() => onStepClick?.(i)}
                className={clsx(
                  "flex items-center gap-2 text-sm px-2 py-1 rounded-md",
                  active && "text-brand-700 font-semibold",
                  !active && !done && "text-slate-500",
                  done && "text-emerald-700"
                )}
              >
                <span
                  className={clsx(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                    active && "bg-brand-700 text-white",
                    done && "bg-emerald-600 text-white",
                    !active && !done && "bg-slate-200 text-slate-600"
                  )}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span>{s}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={clsx("w-8 h-px mx-2", i < current ? "bg-emerald-400" : "bg-slate-200")} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
