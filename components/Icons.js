// Header icons: the same drawings as the icons on logoofficial.com (copied path for path).
// Drawn on a 64 x 64 grid with a thin 2-unit line, shown at 28 x 28 px.
function Icon({ children, className = "h-7 w-7" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export const SearchIcon = (props) => (
  <Icon {...props}>
    <path d="M47.16 28.58A18.58 18.58 0 1 1 28.58 10a18.58 18.58 0 0 1 18.58 18.58ZM54 54 41.94 42" />
  </Icon>
);

export const UserIcon = (props) => (
  <Icon {...props}>
    <path d="M35 39.84v-2.53c3.3-1.91 6-6.66 6-11.41 0-7.63 0-13.82-9-13.82s-9 6.19-9 13.82c0 4.75 2.7 9.51 6 11.41v2.53c-10.18.85-18 6-18 12.16h42c0-6.19-7.82-11.31-18-12.16Z" />
  </Icon>
);

export const BagIcon = (props) => (
  <Icon {...props}>
    <path d="M11.375 17.863h41.25v36.75h-41.25z" />
    <path d="M22.25 18c0-7.105 4.35-9 9.75-9s9.75 1.895 9.75 9" />
  </Icon>
);

// Menu button on phones: three lines, turning into a cross
export const MenuIcon = ({ open, ...props }) => (
  <Icon {...props}>{open ? <path d="M14 14l36 36M50 14 14 50" /> : <path d="M10 20h44M10 32h44M10 44h44" />}</Icon>
);

// Small arrow next to menu items that have a drop-down
export const ChevronIcon = ({ className = "h-3 w-3" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
    <path d="m5 9 7 7 7-7" />
  </svg>
);

export const CloseIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
    <path d="M5 5l14 14M19 5 5 19" />
  </svg>
);
