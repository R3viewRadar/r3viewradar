export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-brand">R3viewRadar</p>
        <p className="footer-tagline">Universal review aggregator — all platforms, one search.</p>
        <p className="footer-copy">&copy; {new Date().getFullYear()} r3viewradar.com. All rights reserved.</p>
      </div>
    </footer>
  );
}
