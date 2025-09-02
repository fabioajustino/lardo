import { useState } from "react";
import { CustomerForm } from "@/components/CustomerForm";
import { AdminPanel } from "@/components/AdminPanel";
import { Button } from "@/components/ui/button";
import { BarChart3, Users } from "lucide-react";

const Index = () => {
  const [activeView, setActiveView] = useState<"form" | "admin">("form");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="bg-card shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="https://servidores-estaticos-flax.vercel.app/logoLardo.png" alt="Logo" style={{
        width: '100px',
        height: '100px', marginTop: '5px'}}></img>
            </div>
            <div className="flex space-x-4">
              <Button
                variant={activeView === "form" ? "default" : "outline"}
                onClick={() => setActiveView("form")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Avaliação
              </Button>
              <Button
                variant={activeView === "admin" ? "default" : "outline"}
                onClick={() => setActiveView("admin")}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Painel Admin
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        {activeView === "form" ? (
          <CustomerForm />
        ) : (
          <AdminPanel />
        )}
      </main>
    </div>
  );
};

export default Index;
