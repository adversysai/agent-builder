const Logo = ({ ...props }) => (
  <img 
    src="/dexflow_icon_trans.svg" 
    alt="Dexflow" 
    width="32" 
    height="32"
    style={{ width: '32px', height: '32px' }}
    {...props}
  />
);
export default Logo;
