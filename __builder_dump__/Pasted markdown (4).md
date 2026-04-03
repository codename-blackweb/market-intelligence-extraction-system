ui/select.tsx:\
\
import \* as React from "react"\
import \* as SelectPrimitive from "@radix-ui/react-select"\
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Select({\
...props\
}: React.ComponentProps) {\
return \<SelectPrimitive.Root data-slot="select" {...props} />\
}

function SelectGroup({\
...props\
}: React.ComponentProps) {\
return \<SelectPrimitive.Group data-slot="select-group" {...props} />\
}

function SelectValue({\
...props\
}: React.ComponentProps) {\
return \<SelectPrimitive.Value data-slot="select-value" {...props} />\
}

function SelectTrigger({\
className,\
size = "default",\
children,\
...props\
}: React.ComponentProps & {\
size?: "sm" | "default"\
}) {\
return (\
\<SelectPrimitive.Trigger\
data-slot="select-trigger"\
data-size={size}\
className={cn(\
"border-input data-[placeholder] [&\_svg([class\*='text-'])] focus-visible focus-visible/50 aria-invalid/20 dark\:aria-invalid/40 aria-invalid dark/30 dark\:hover/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible\:ring-[3px] disabled disabled data-[size=default] data-[size=sm] \*:data-[slot=select-value] \*:data-[slot=select-value] \*:data-[slot=select-value] *:data-[slot=select-value]** [&\_svg]** [&\_svg]** [&\_svg**([class*='size-'])]",\
className\
)}\
{...props}\
\>\
{children}\
\<SelectPrimitive.Icon asChild>\
\
\</SelectPrimitive.Icon>\
\</SelectPrimitive.Trigger>\
)\
}

function SelectContent({\
className,\
children,\
position = "popper",\
align = "center",\
...props\
}: React.ComponentProps) {\
return (\
\<SelectPrimitive.Portal>\
\<SelectPrimitive.Content\
data-slot="select-content"\
className={cn(\
"bg-popover text-popover-foreground data-[state=open] data-[state=closed] data-[state=closed] data-[state=open] data-[state=closed] data-[state=open] data-[side=bottom] data-[side=left] data-[side=right] data-[side=top] relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",\
position === "popper" &&\
"data-[side=bottom] data-[side=left]:-translate-x-1 data-[side=right] data-[side=top]:-translate-y-1",\
className\
)}\
position={position}\
align={align}\
{...props}\
\>\
\
\<SelectPrimitive.Viewport\
className={cn(\
"p-1",\
position === "popper" &&\
"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"\
)}\
\>\
{children}\
\</SelectPrimitive.Viewport>\
\
\</SelectPrimitive.Content>\
\</SelectPrimitive.Portal>\
)\
}

function SelectLabel({\
className,\
...props\
}: React.ComponentProps) {\
return (\
\<SelectPrimitive.Label\
data-slot="select-label"\
className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}\
{...props}\
/>\
)\
}

function SelectItem({\
className,\
children,\
...props\
}: React.ComponentProps) {\
return (\
\<SelectPrimitive.Item\
data-slot="select-item"\
className={cn(\
"focus focus [&\_svg([class\*='text-'])] relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled] data-[disabled] [&\_svg] [&\_svg] [&\_svg([class\*='size-'])] \*:[span]\:last \*:[span]\:last \*:[span]\:last",\
className\
)}\
{...props}\
\>\
\
\<SelectPrimitive.ItemIndicator>\
\
\</SelectPrimitive.ItemIndicator>\
\
\<SelectPrimitive.ItemText>{children}\</SelectPrimitive.ItemText>\
\</SelectPrimitive.Item>\
)\
}

function SelectSeparator({\
className,\
...props\
}: React.ComponentProps) {\
return (\
\<SelectPrimitive.Separator\
data-slot="select-separator"\
className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}\
{...props}\
/>\
)\
}

function SelectScrollUpButton({\
className,\
...props\
}: React.ComponentProps) {\
return (\
\<SelectPrimitive.ScrollUpButton\
data-slot="select-scroll-up-button"\
className={cn(\
"flex cursor-default items-center justify-center py-1",\
className\
)}\
{...props}\
\>\
\
\</SelectPrimitive.ScrollUpButton>\
)\
}

function SelectScrollDownButton({\
className,\
...props\
}: React.ComponentProps) {\
return (\
\<SelectPrimitive.ScrollDownButton\
data-slot="select-scroll-down-button"\
className={cn(\
"flex cursor-default items-center justify-center py-1",\
className\
)}\
{...props}\
\>\
\
\</SelectPrimitive.ScrollDownButton>\
)\
}

export {\
Select,\
SelectContent,\
SelectGroup,\
SelectItem,\
SelectLabel,\
SelectScrollDownButton,\
SelectScrollUpButton,\
SelectSeparator,\
SelectTrigger,\
SelectValue,\
}
