import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Alvarado Associates - Access Your Investment Dashboard",
  description: "Sign in to your Alvarado Associates account to manage your real estate investments, track returns, and explore new property opportunities.",
  alternates: { canonical: "https://alvaradoassociatepartners.com/signin" },
  robots: { index: false, follow: false },
};

export default function SigninLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
