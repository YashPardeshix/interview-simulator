import React from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";

const GlassCard = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-10 w-full max-w-md"
  >
    {children}
  </motion.div>
);

export default function AuthScreen() {
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="z-10 text-center mb-8 space-y-2">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          Xiphos
        </h1>
        <p className="text-zinc-400 font-light italic">
          Sign in to your professional vault.
        </p>
      </div>

      <GlassCard>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#2563eb", // Blue-600
                  brandAccent: "#3b82f6", // Blue-500
                  inputText: "white",
                  inputBackground: "rgba(255, 255, 255, 0.05)",
                  inputBorder: "rgba(255, 255, 255, 0.1)",
                },
                space: {
                  inputPadding: "12px 16px",
                  buttonPadding: "12px 16px",
                },
                radii: {
                  borderRadiusButton: "12px",
                  buttonBorderRadius: "12px",
                  inputBorderRadius: "12px",
                },
              },
            },
          }}
          theme="dark"
          providers={["github", "google"]}
        />
      </GlassCard>
    </div>
  );
}
