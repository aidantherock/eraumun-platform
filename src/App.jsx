import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
      <Route path="/portal" element={<div>Portal</div>} />
      <Route path="/admin" element={<div>Admin</div>} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  )
}

export default App