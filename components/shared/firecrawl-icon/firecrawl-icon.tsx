import { HTMLAttributes } from "react";

export default function DexflowIcon({
  fill = "var(--heat-100)",
  innerFillColor = "var(--background-base)",
  ...attrs
}: HTMLAttributes<HTMLOrSVGElement> & {
  innerFillColor?: string;
  fill?: string;
}) {
  return (
    <img 
      src="/dexflow_icon_trans.svg" 
      alt="Dexflow" 
      {...attrs}
      style={{ width: '100%', height: '100%' }}
    />
  );
}