import ProductsView from "@/components/ProductsView";

export default async function Products({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <ProductsView sp={await searchParams} />;
}
