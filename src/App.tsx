import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import InputKK from "@/pages/InputKK"
import InputKTP from "@/pages/InputKTP"
import InputAkta from "@/pages/InputAkta"
import Layout from "@/components/Layout"

import { Toaster } from "@/components/ui/sonner"

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
        </Route>
      </Routes>
      <Toaster position="top-center" />
    </Router>
  )
}

export default App
