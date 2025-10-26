import { HTMLAttributes } from "react";

export default function DexflowIconStatic({
  fill = "var(--heat-100)",
  className = "",
  ...attrs
}: HTMLAttributes<HTMLOrSVGElement> & { fill?: string }) {
  return (
    <img 
      src="/dexflow_icon_trans.svg" 
      alt="Dexflow" 
      className={className}
      style={{ width: '20px', height: '20px' }}
      {...attrs}
    />
  );
}
