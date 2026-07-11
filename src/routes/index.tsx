import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("spruceland.session.v1");
      throw redirect({ to: s ? "/dashboard" : "/login" });
    }
    throw redirect({ to: "/login" });
  },
});
