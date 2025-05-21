import React from "react";
import { Route, Routes } from "react-router-dom";
import { AdminDashboard } from "./pages/admin";
import { AutoLogin } from "./pages/login";
import { AuthenticationGuard } from "./pages/authentication-guard";

export const App = () => {

  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
       <Route
        path="/admin"
        element={<AuthenticationGuard component={<AdminDashboard />}}
      />
    </Routes>
  );
};
