import ProductView from "@/components/ProductView";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ProductView slug={(await params).slug} />;
}
