'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { Product, ProductVariant } from '@/lib/shopify/types';
import { AddToCartButton } from './add-to-cart'; // Import AddToCartButton from the same file
import { useSelectedVariant } from '@/components/products/variant-selector';
import { ReactNode, useMemo } from 'react';
import { ButtonProps } from '../ui/button';
import { PlusCircleIcon } from 'lucide-react';

interface AddToCartClientLogicProps extends ButtonProps {
  product: Product;
  iconOnly?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function AddToCartClientLogic({
  product,
  className,
  iconOnly = false,
  icon = <PlusCircleIcon />,
  ...buttonProps
}: AddToCartClientLogicProps) {
  const { variants } = product;
  const selectedVariant = useSelectedVariant(product);
  const pathname = useParams<{ handle?: string }>();
  const searchParams = useSearchParams();

  const hasNoVariants = variants.length === 0;
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = selectedVariant?.id || defaultVariantId;
  const isTargetingProduct = pathname.handle === product.id || searchParams.get('pid') === product.id;

  const resolvedVariant = useMemo(() => {
    if (hasNoVariants) return {
      id: product.id,
      title: product.title,
      availableForSale: product.availableForSale,
      selectedOptions: [],
      price: product.priceRange.minVariantPrice,
    };
    if (!isTargetingProduct && !defaultVariantId) return undefined;
    return variants.find(variant => variant.id === selectedVariantId);
  }, [hasNoVariants, product, isTargetingProduct, defaultVariantId, variants, selectedVariantId]);

  return (
    <AddToCartButton
      product={product}
      selectedVariant={resolvedVariant}
      className={className}
      iconOnly={iconOnly}
      icon={icon}
      {...buttonProps}
    />
  );
}
