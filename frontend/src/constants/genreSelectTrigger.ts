/**
 * Shared look for the genre {@link SelectTrigger}: soft neutral panel, label left /
 * chevron right (inherit flex from `SelectTrigger`), flat / borderless.
 */
export const GENRE_SELECT_TRIGGER_CLASS =
  "genre-select-trigger relative inline-flex w-auto min-w-[212px] max-w-full items-center text-left " +
  "[&>span]:inline-flex [&>span]:min-w-0 [&>span]:w-auto [&>span]:flex-[0_1_auto] [&>span]:items-center " +
  "[&_[data-slot=select-value]]:inline-flex [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:max-w-[calc(100%-32px)] [&_[data-slot=select-value]]:flex-[0_1_auto] " +
  "[&>svg]:absolute [&>svg]:right-4 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2 [&>svg]:!m-0 " +
  "h-auto min-h-[2.75rem] rounded-xl border-0 bg-slate-50 py-3 pr-12 pl-4 font-medium text-slate-800 shadow-none " +
  "hover:bg-slate-100/90 " +
  "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-slate-300/60 focus-visible:ring-offset-0 " +
  "data-[placeholder]:text-slate-500 " +
  "[&_svg]:shrink-0 [&_svg]:text-slate-600 [&_svg]:opacity-100";
