import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import InspectionTable from "../components/InspectionTable";

export default function ViewInspections() {
  return (
    <div className="app-layout">
      <Navbar />

      <div className="page-content">
        <InspectionTable />
      </div>

      <Footer />
    </div>
  );
}
