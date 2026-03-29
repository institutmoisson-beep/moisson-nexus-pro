import logo from "@/assets/logo-moisson.png";

const Footer = () => {
  return (
    <footer className="bg-foreground py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Institut Moisson" className="w-8 h-8" width={32} height={32} />
            <span className="font-heading text-lg font-bold text-primary-foreground">Institut Moisson</span>
          </div>
          <p className="text-primary-foreground/50 text-sm font-body">
            Unis pour prospérer & protéger — © {new Date().getFullYear()} Institut Moisson
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
