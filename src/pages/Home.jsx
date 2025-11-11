import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Dashboard from "../components/Dashboard";

export default function Home() {
  return (
    <div className="app-layout">
      <Navbar />

      <div className="page-content">
        <h1 className="text-2xl font-bold mb-4">
          Al-Karam Towels Inspection Dashboard
        </h1>
        <Dashboard />
      </div>

      <Footer />
    </div>
  );
}
