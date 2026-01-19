import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import InputKK from "@/pages/InputKK"
import InputKTP from "@/pages/InputKTP"
import InputAkta from "@/pages/InputAkta"
import InputAktaPerkawinan from "@/pages/InputAktaPerkawinan"
import InputAktaPerceraian from "@/pages/InputAktaPerceraian"
import InputAktaKematian from "@/pages/InputAktaKematian"
import Layout from "@/components/Layout"
import ActivityLog from "@/pages/ActivityLog"

import { Toaster } from "@/components/ui/sonner"

import Settings from "@/pages/Settings"

const LayoutWrapper = () => (
  <Layout>
    <Outlet />
  </Layout>
)

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<LayoutWrapper />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/input-data/kartu-keluarga" element={<InputKK />} />
          <Route path="/input-data/ktp" element={<InputKTP />} />
          <Route path="/input-data/akta-kelahiran" element={<InputAkta />} />
          <Route path="/input-data/akta-perkawinan" element={<InputAktaPerkawinan />} />
          <Route path="/input-data/akta-perceraian" element={<InputAktaPerceraian />} />
          <Route path="/input-data/akta-kematian" element={<InputAktaKematian />} />
          <Route path="/activity-log" element={<ActivityLog />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster position="top-center" />
    </Router>
  )
}

export default App
