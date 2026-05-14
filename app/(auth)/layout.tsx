import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "bg-[#1a2332] border-[#3a4757] text-white",
            title: "text-white",
            description: "text-[#9ba5b3]",
            error: "bg-red-500/10 border-red-500/30 text-red-300",
          },
        }}
      />
    </>
  );
}
