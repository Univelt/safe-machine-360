"use client";
import "./globals.css";
import { ErrorPanel } from "./components/error-panel";
export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) { return <html lang="pt-BR"><body><ErrorPanel {...props} /></body></html>; }
