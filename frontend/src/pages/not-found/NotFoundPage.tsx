import { Link } from "react-router-dom";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
export function NotFoundPage() { return <div className="container flex min-h-screen items-center justify-center"><EmptyState title="Esta página no existe" description="Volvamos a un lugar seguro." action={<Button asChild><Link to="/">Ir al inicio</Link></Button>} /></div>; }
