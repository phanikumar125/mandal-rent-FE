import { NextRequest, NextResponse } from "next/server";
import locationData from "@/data/andhra-pradesh-locations.json";

type Village = { code: string; name: string };
type Mandal = { code: string; name: string; villages: Village[] };
type District = { code: string; name: string; mandals: Mandal[] };

const districts = locationData.districts as District[];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const level = params.get("level") ?? "districts";

  if (level === "districts") {
    return NextResponse.json({
      items: districts.map(({ code, name, mandals }) => ({ code, name, count: mandals.length })),
      totals: locationData.totals,
      updatedOn: locationData.catalogUpdatedOn,
    });
  }

  const district = districts.find((item) => item.code === params.get("district"));
  if (!district) return NextResponse.json({ items: [] });

  if (level === "mandals") {
    return NextResponse.json({
      items: district.mandals.map(({ code, name, villages }) => ({ code, name, count: villages.length })),
    });
  }

  const mandal = district.mandals.find((item) => item.code === params.get("mandal"));
  return NextResponse.json({ items: mandal?.villages ?? [] });
}
