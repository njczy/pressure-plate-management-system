import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import Home from "@/pages/Home";
import DeviceManagement from "@/pages/DeviceManagement";
import DeviceDetail from "@/pages/DeviceDetail";
import DataImport from "@/pages/DataImport";
import MainLayout from "@/layouts/MainLayout";
import UpdateLogs from "@/pages/UpdateLogs";
import PlateManage from "@/pages/PlateManage";

dayjs.locale('zh-cn');

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/config" replace />} />
          <Route path="/config" element={<MainLayout><DeviceManagement /></MainLayout>} />
          <Route path="/manage" element={<MainLayout><PlateManage /></MainLayout>} />
          <Route path="/home" element={<MainLayout><Home /></MainLayout>} />
          <Route path="/devices" element={<MainLayout><DeviceManagement /></MainLayout>} />
          <Route path="/devices/new" element={<MainLayout><DeviceDetail /></MainLayout>} />
          <Route path="/devices/:id/edit" element={<MainLayout><DeviceDetail /></MainLayout>} />
          <Route path="/import" element={<MainLayout><DataImport /></MainLayout>} />
          <Route path="/other" element={<MainLayout><div className="text-center text-xl">Other Page - Coming Soon</div></MainLayout>} />
          <Route path="/logs" element={<MainLayout><UpdateLogs /></MainLayout>} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}
