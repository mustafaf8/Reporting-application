import ProductForm from "@/components/features/products/ProductForm";

interface EditProductProps {
  params: {
    id: string;
  };
}

export default function EditProduct({ params }: EditProductProps) {
  return <ProductForm productId={params.id} />;
}
