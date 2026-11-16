// A template starts again on every page change, so each new page fades in and rises a little.
export default function Template({ children }) {
  return <div className="page-in">{children}</div>;
}
