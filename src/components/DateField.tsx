import { useState } from "react";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatFecha, formatFechaFromDate, parseFechaToDate } from "@/lib/fechas";

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
};

export const DateField = ({
  label,
  value,
  onChange,
  required = false,
  className = "",
  placeholder = "dd/mm/aaaa",
}: DateFieldProps) => {
  const [open, setOpen] = useState(false);
  const selected = parseFechaToDate(value);

  const handleBlur = () => {
    const normalized = formatFecha(value);
    if (normalized && normalized !== value) onChange(normalized);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          required={required}
          placeholder={placeholder}
          className="h-11 rounded-xl pr-11"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Seleccionar fecha"
              className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(date) => {
                if (!date) return;
                onChange(formatFechaFromDate(date));
                setOpen(false);
              }}
              locale={es}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
