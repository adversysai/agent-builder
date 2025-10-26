"use client";

export default function DexflowLogo({ className }: { className?: string }) {
  return (
    <img 
      src="/dexflow_icon_trans.svg" 
      alt="Dexflow" 
      className={className}
      style={{ width: '50px', height: '50px' }}
    />
  );
}
