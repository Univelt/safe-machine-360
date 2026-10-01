"use client";
import { ErrorPanel } from "@/app/components/error-panel";
export default function ErrorPage(props: { error: Error & { digest?: string }; reset: () => void }) { return <ErrorPanel {...props} title="Não foi possível carregar o dashboard" />; }
