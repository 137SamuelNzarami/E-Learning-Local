import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
