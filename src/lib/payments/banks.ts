import catalog from "@/data/vietqr-banks.json";

type Bank = { bin: string; name: string; shortName: string; logo: string };

const banks = catalog.banks as Bank[];

export function bankByBin(bin: string) {
  return banks.find((bank) => bank.bin === bin.trim()) || null;
}
