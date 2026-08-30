import type { Metadata } from "next";
import { PresentationDeck } from "./presentation-deck";
import "./presentation.css";

export const metadata: Metadata = {
  title: "Apresentação executiva",
  description: "Visão executiva do projeto Portal Univelt Machine Safety.",
};

export default function PresentationPage() {
  return <PresentationDeck />;
}
