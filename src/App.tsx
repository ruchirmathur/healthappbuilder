
import { Route, Routes } from "react-router-dom";
import { AdminDashboard } from "./pages/admin";

export const App = () => {

  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
       <Route
        path="/admin"
        element={<AdminDashboard />}
      />
    </Routes>
  );
};
