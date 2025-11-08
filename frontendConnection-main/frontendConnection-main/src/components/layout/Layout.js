import { Outlet } from "react-router-dom";
import "./Layout.css";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
