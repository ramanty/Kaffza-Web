import clsx from 'clsx';
export function Input({className,...props}:any){return <input className={clsx('w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-kaffza-primary',className)} {...props}/>;}
