import clsx from 'clsx';
export function Card({className,...props}:any){return <div className={clsx('rounded-xl bg-white border border-slate-100 shadow-sm',className)} {...props}/>;}
