export const AUTO_INTERVALS=[15,30,60,120] as const;
export const AUTO_LIMITS=[10,20,30,0,50,100,150,200] as const;
export const runFinished=(generated:number,target:number)=>target>0&&generated>=target;
