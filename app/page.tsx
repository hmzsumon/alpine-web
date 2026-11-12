import { WaiterProvider } from "@/context/WaiterContext";
import WaiterApp from "@/components/layout/WaiterApp";
export default function Home() {
  return (
    <WaiterProvider>
      <WaiterApp />
    </WaiterProvider>
  );
}
