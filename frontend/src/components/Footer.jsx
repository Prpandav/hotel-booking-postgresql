function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-container">
        <p>© {currentYear} StayEase. Hotel Booking System.</p>
      </div>
    </footer>
  );
}

export default Footer;
