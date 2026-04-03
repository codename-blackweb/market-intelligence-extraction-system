ui/calendar.tsx:\
\
"use client"

import \* as React from "react"\
import {\
ChevronDownIcon,\
ChevronLeftIcon,\
ChevronRightIcon,\
} from "lucide-react"\
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"\
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({\
className,\
classNames,\
showOutsideDays = true,\
captionLayout = "label",\
buttonVariant = "ghost",\
formatters,\
components,\
...props\
}: React.ComponentProps & {\
buttonVariant?: React.ComponentProps["variant"]\
}) {\
const defaultClassNames = getDefaultClassNames()

return (\
\<DayPicker\
showOutsideDays={showOutsideDays}\
className={cn(\
"bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]*&]** [[data-slot=popover-content]*&]",\
String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,\
String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,\
className\
)}\
captionLayout={captionLayout}\
formatters={{\
formatMonthDropdown: (date) =>\
date.toLocaleString("default", { month: "short" }),\
...formatters,\
}}\
classNames={{\
root: cn("w-fit", defaultClassNames.root),\
months: cn(\
"flex gap-4 flex-col md relative",\
defaultClassNames.months\
),\
month: cn("flex flex-col w-full gap-4", defaultClassNames.month),\
nav: cn(\
"flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",\
defaultClassNames.nav\
),\
button\_previous: cn(\
buttonVariants({ variant: buttonVariant }),\
"size-(--cell-size) aria-disabled p-0 select-none",\
defaultClassNames.button\_previous\
),\
button\_next: cn(\
buttonVariants({ variant: buttonVariant }),\
"size-(--cell-size) aria-disabled p-0 select-none",\
defaultClassNames.button\_next\
),\
month\_caption: cn(\
"flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",\
defaultClassNames.month\_caption\
),\
dropdowns: cn(\
"w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",\
defaultClassNames.dropdowns\
),\
dropdown\_root: cn(\
"relative has-focus border border-input shadow-xs has-focus/50 has-focus\:ring-[3px] rounded-md",\
defaultClassNames.dropdown\_root\
),\
dropdown: cn(\
"absolute bg-popover inset-0 opacity-0",\
defaultClassNames.dropdown\
),\
caption\_label: cn(\
"select-none font-medium",\
captionLayout === "label"\
? "text-sm"\
: "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg] [&>svg].5",\
defaultClassNames.caption\_label\
),\
table: "w-full border-collapse",\
weekdays: cn("flex", defaultClassNames.weekdays),\
weekday: cn(\
"text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",\
defaultClassNames.weekday\
),\
week: cn("flex w-full mt-2", defaultClassNames.week),\
week\_number\_header: cn(\
"select-none w-(--cell-size)",\
defaultClassNames.week\_number\_header\
),\
week\_number: cn(\
"text-[0.8rem] select-none text-muted-foreground",\
defaultClassNames.week\_number\
),\
day: cn(\
"relative w-full h-full p-0 text-center [&\_button] [&\_button] group/day aspect-square select-none",\
defaultClassNames.day\
),\
range\_start: cn(\
"rounded-l-md bg-accent",\
defaultClassNames.range\_start\
),\
range\_middle: cn("rounded-none", defaultClassNames.range\_middle),\
range\_end: cn("rounded-r-md bg-accent", defaultClassNames.range\_end),\
today: cn(\
"bg-accent text-accent-foreground rounded-md data-[selected=true]",\
defaultClassNames.today\
),\
outside: cn(\
"text-muted-foreground aria-selected",\
defaultClassNames.outside\
),\
disabled: cn(\
"text-muted-foreground opacity-50",\
defaultClassNames.disabled\
),\
hidden: cn("invisible", defaultClassNames.hidden),\
...classNames,\
}}\
components={{\
Root: ({ className, rootRef, ...props }) => {\
return (\
\<div\
data-slot="calendar"\
ref={rootRef}\
className={cn(className)}\
{...props}\
/>\
)\
},\
Chevron: ({ className, orientation, ...props }) => {\
if (orientation === "left") {\
return (\
\<ChevronLeftIcon className={cn("size-4", className)} {...props} />\
)\
}

```
      if (orientation === "right") {
        return (
          <ChevronRightIcon
            className={cn("size-4", className)}
            {...props}
          />
        )
      }

      return (
        <ChevronDownIcon className={cn("size-4", className)} {...props} />
      )
    },
    DayButton: CalendarDayButton,
    WeekNumber: ({ children, ...props }) => {
      return (
        <td {...props}>
          <div className="flex size-(--cell-size) items-center justify-center text-center">
            {children}
          </div>
        </td>
      )
    },
    ...components,
  }}
  {...props}
/>
```

)\
}

function CalendarDayButton({\
className,\
day,\
modifiers,\
...props\
}: React.ComponentProps) {\
const defaultClassNames = getDefaultClassNames()

const ref = React.useRef(null)\
React.useEffect(() => {\
if (modifiers.focused) ref.current?.focus()\
}, [modifiers.focused])

return (\
\<Button\
ref={ref}\
variant="ghost"\
size="icon"\
data-day={day.date.toLocaleDateString()}\
data-selected-single={\
modifiers.selected &&\
!modifiers.range\_start &&\
!modifiers.range\_end &&\
!modifiers.range\_middle\
}\
data-range-start={modifiers.range\_start}\
data-range-end={modifiers.range\_end}\
data-range-middle={modifiers.range\_middle}\
className={cn(\
"data-[selected-single=true] data-[selected-single=true] data-[range-middle=true] data-[range-middle=true] data-[range-start=true] data-[range-start=true] data-[range-end=true] data-[range-end=true] group-data-[focused=true]/day group-data-[focused=true]/day/50 dark\:hover flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day group-data-[focused=true]/day group-data-[focused=true]/day\:ring-[3px] data-[range-end=true] data-[range-end=true] data-[range-middle=true] data-[range-start=true] data-[range-start=true] [&>span] [&>span]",\
defaultClassNames.day,\
className\
)}\
{...props}\
/>\
)\
}

export { Calendar, CalendarDayButton }
