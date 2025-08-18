import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import DeviceManagement from "@/pages/DeviceManagement";
import DeviceDetail from "@/pages/DeviceDetail";
import DataImport from "@/pages/DataImport";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DeviceManagement />} />
        <Route path="/home" element={<Home />} />
        <Route path="/devices" element={<DeviceManagement />} />
        <Route path="/devices/new" element={<DeviceDetail />} />
        <Route path="/devices/:id/edit" element={<DeviceDetail />} />
        <Route path="/import" element={<DataImport />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
