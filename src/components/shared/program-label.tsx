import { programColor } from "@/config/program-colors";
import type { Program } from "@/core/model";
import { cn } from "@/lib/utils";

export function ProgramDot({ id, className }: { id: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2.5 shrink-0 rounded-full ring-2 ring-white/5", className)}
      style={{ backgroundColor: programColor(id) }}
    />
  );
}

export function ProgramLabel({ program, className }: { program: Program; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <ProgramDot id={program.id} />
      <span className="truncate">{program.name}</span>
    </span>
  );
}
