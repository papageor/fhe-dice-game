import { FHECounterDemo } from "../_components/FHECounterDemo";
import { HeaderFHECounter } from "~~/components/HeaderFHECounter";

export default function CounterPage() {
  return (
    <>
      <HeaderFHECounter />
      <div className="flex flex-col gap-8 items-center sm:items-start w-full px-3 md:px-0">
        <FHECounterDemo />
      </div>
    </>
  );
}
