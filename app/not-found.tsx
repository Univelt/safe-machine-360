import Link from "next/link";
import { ErrorNotice } from "./components/error-notice";
export default function NotFound() {
  return <main className="friendly-error-page"><div className="panel friendly-error-panel"><span className="eyebrow">Machine Safety 360</span><h1>Não encontramos esta página</h1><ErrorNotice error={{ code: "PAGINA_NAO_ENCONTRADA", title: "O link ou registro não está disponível", message: "O endereço pode ter mudado, o registro pode ter sido removido ou você pode não ter acesso a ele.", nextStep: "Volte ao portal e procure o registro na lista correspondente." }} /><div className="friendly-error-actions"><Link className="button primary" href="/">Voltar ao portal</Link></div></div></main>;
}
