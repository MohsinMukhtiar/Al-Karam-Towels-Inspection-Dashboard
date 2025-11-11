import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import InspectionForm from "../components/InspectionForm";

export default function AddInspection() {
  return (
    <div className="app-layout">
      <Navbar />

      <div className="page-content">
        <InspectionForm />
      </div>

      <Footer />
    </div>
  );
}
