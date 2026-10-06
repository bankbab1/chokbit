import {useEffect,useState} from 'react';
export function Countdown({deadline,duration}:{deadline:number;duration:number}){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),100);return()=>clearInterval(timer)},[deadline]);
 const remaining=Math.max(0,deadline-now);const progress=Math.min(100,Math.max(0,(1-remaining/(duration*1000))*100));
 return <div className="auto-countdown"><div><span>Next key</span><strong>{Math.ceil(remaining/1000)}s</strong></div><div className="countdown-track" role="progressbar" aria-label="Time until next key" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-valuetext={`${Math.ceil(remaining/1000)} seconds remaining`}><span style={{width:`${progress}%`}}/></div></div>
}
