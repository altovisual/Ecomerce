'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { CartProduct, Product, ProductOption, ProductVariant, SelectedOptions } from '@/lib/shopify/types';
import { startTransition, useMemo } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { useParams, useSearchParams } from 'next/navigation';
import { ColorSwatch } from '@/components/ui/color-picker';
import { Button } from '@/components/ui/button';
import { getColorHex } from '@/lib/utils';

type Combination = {
  id: string;
  availableForSale: boolean;
  [key: string]: string | boolean;
};

const variantOptionSelectorVariants = cva('flex items-start gap-4', {
  variants: {
    variant: {
      card: 'rounded-lg bg-popover py-2.5 px-3 justify-between',
      condensed: 'justify-start',
    },
  },
  defaultVariants: {
    variant: 'card',
  },
});

interface VariantOptionSelectorProps extends VariantProps<typeof variantOptionSelectorVariants> {
  option: ProductOption;
  product: Product;
}

export function VariantOptionSelector({ option, variant, product }: VariantOptionSelectorProps) {
  const { variants, options } = product;
  const searchParams = useSearchParams();
  const pathname = useParams<{ handle?: string }>();
  const optionNameLowerCase = option.name.toLowerCase();

  const [selectedValue, setSelectedValue] = useQueryState(optionNameLowerCase, parseAsString.withDefault(''));
  const [activeProductId, setActiveProductId] = useQueryState('pid', parseAsString.withDefault(''));

  // Get all current selected options from URL
  const getCurrentSelectedOptions = () => {
    const state: Record<string, string> = {};

    options.forEach(opt => {
      const key = opt.name.toLowerCase();
      const value = searchParams.get(key);
      if (value) {
        state[key] = value;
      }
    });

    return state;
  };

  const combinations: Combination[] = Array.isArray(variants)
    ? variants.map(variant => ({
        id: variant.id,
        availableForSale: variant.availableForSale,
        ...variant.selectedOptions.reduce(
          (accumulator, option) => ({
            ...accumulator,
            [option.name.toLowerCase()]: option.value,
          }),
          {}
        ),
      }))
    : [];

  // Check if this is a color option
  const isColorOption = optionNameLowerCase === 'color';
  const isProductPage = pathname.handle === product.id;
  const isTargetingProduct = isProductPage || activeProductId === product.id;

  return (
    <dl className={variantOptionSelectorVariants({ variant })}>
      <dt className="text-base font-semibold leading-7">{option.name}</dt>
      <dd className="flex flex-wrap gap-2">
        {option.values.map(value => {
          // Get current state for availability check
          const currentState = getCurrentSelectedOptions();
          const optionParams = {
            ...currentState,
            [optionNameLowerCase]: value.id,
          };

          // Filter out invalid options and check if the option combination is available for sale.
          const filtered = Object.entries(optionParams).filter(([key, value]) =>
            options.find(option => option.name.toLowerCase() === key && option.values.some(val => val.name === value))
          );
          const isAvailableForSale = combinations.find(combination =>
            filtered.every(([key, value]) => combination[key] === value && combination.availableForSale)
          );

          // The option is active if it's the selected value
          const isActive = isTargetingProduct && selectedValue === value.name;

          // If this is a color option, use ColorSwatch
          if (isColorOption) {
            const color = getColorHex(value.name);
            const name = value.name.split('/');

            return (
              <ColorSwatch
                key={value.id}
                color={
                  Array.isArray(color)
                    ? [
                        {
                          name: name[0],
                          value: color[0],
                        },
                        {
                          name: name[1],
                          value: color[1],
                        },
                      ]
                    : {
                        name: name[0],
                        value: color,
                      }
                }
                isSelected={isActive}
                onColorChange={() => {
                  startTransition(() => {
                    setSelectedValue(value.name);

                    if (!isProductPage) {
                      setActiveProductId(product.id);
                    }
                  });
                }}
                size={variant === 'condensed' ? 'sm' : 'md'}
                atLeastOneColorSelected={!!selectedValue}
              />
            );
          }

          // Default button for non-color options
          return (
            <Button
              onClick={() => {
                startTransition(() => {
                  setSelectedValue(value.name);

                  if (!isProductPage) {
                    setActiveProductId(product.id);
                  }
                });
              }}
              key={value.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              disabled={!isAvailableForSale}
              title={`${option.name} ${value.name}${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
              className="min-w-[40px]"
            >
              {value.name}
            </Button>
          );
        })}
      </dd>
    </dl>
  );
}

export const useSelectedVariant = (product: Product) => {
  const { variants, options } = product;
  const searchParams = useSearchParams();

  // Get all current selected options from URL
  const getCurrentSelectedOptions = () => {
    const state: Record<string, string> = {};

    options.forEach(option => {
      const key = option.name.toLowerCase();
      const value = searchParams.get(key);
      if (value) {
        state[key] = value;
      }
    });

    return state;
  };

  const selectedOptions = getCurrentSelectedOptions();

  // Find the variant that matches all selected options
  const selectedVariant = Array.isArray(variants)
    ? variants.find((variant: ProductVariant) =>
        variant.selectedOptions.every(option => option.value === selectedOptions[option.name.toLowerCase()])
      )
    : undefined;

  return selectedVariant;
};






