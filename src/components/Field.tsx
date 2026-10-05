import type {SelectHTMLAttributes} from 'react';
import {ChevronDown} from 'lucide-react';
export function Select({children,onChange,...props}:SelectHTMLAttributes<HTMLSelectElement>){return <span className="select-field"><select {...props} onChange={event=>{onChange?.(event);event.currentTarget.blur()}}>{children}</select><ChevronDown size={14} aria-hidden="true"/></span>}
