export type RecipeCostItem = {
  slug: string;
  price: number | null;
  combineCost: number | null;
  recipeType: string;
  components: Array<{
    componentSlug: string;
    quantity: number;
  }>;
};

export type RecipeCostNode = {
  slug: string;
  quantity: number;
  unitPrice: number | null;
  materialCost: number | null;
  combineCost: number | null;
  totalCost: number | null;
  children: RecipeCostNode[];
};

export type RecipeCostResult = {
  itemSlug: string;
  declaredPrice: number | null;
  directComponentCost: number | null;
  baseMaterialsCost: number | null;
  accumulatedCombineCost: number | null;
  totalCraftCost: number | null;
  priceDifference: number | null;
  missingItems: string[];
  cycleDetected: boolean;
  breakdown: RecipeCostNode[];
};

export function calculateRecipeCost(
  itemSlug: string,
  catalog: RecipeCostItem[],
): RecipeCostResult {
  const items = new Map(catalog.map((item) => [item.slug, item]));
  const missingItems = new Set<string>();
  let cycleDetected = false;

  function resolve(
    slug: string,
    quantity: number,
    ancestors: Set<string>,
  ): RecipeCostNode {
    const item = items.get(slug);

    if (!item) {
      missingItems.add(slug);
      return {
        slug,
        quantity,
        unitPrice: null,
        materialCost: null,
        combineCost: null,
        totalCost: null,
        children: [],
      };
    }

    if (ancestors.has(slug)) {
      cycleDetected = true;
      return {
        slug,
        quantity,
        unitPrice: item.price,
        materialCost: null,
        combineCost: null,
        totalCost: null,
        children: [],
      };
    }

    const isComposite =
      item.recipeType === "COMPOSITE_ITEM" &&
      item.components.length > 0;

    if (!isComposite) {
      const materialCost =
        item.price === null ? null : item.price * quantity;

      return {
        slug,
        quantity,
        unitPrice: item.price,
        materialCost,
        combineCost: 0,
        totalCost: materialCost,
        children: [],
      };
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(slug);

    const children = item.components.map((component) =>
      resolve(
        component.componentSlug,
        quantity * component.quantity,
        nextAncestors,
      ),
    );

    const materialsComplete = children.every(
      (child) => child.materialCost !== null,
    );

    const combineComplete =
      item.combineCost !== null &&
      children.every((child) => child.combineCost !== null);

    const materialCost = materialsComplete
      ? children.reduce(
          (sum, child) => sum + (child.materialCost ?? 0),
          0,
        )
      : null;

    const combineCost = combineComplete
      ? children.reduce(
          (sum, child) => sum + (child.combineCost ?? 0),
          0,
        ) + item.combineCost! * quantity
      : null;

    const totalCost =
      materialCost !== null && combineCost !== null
        ? materialCost + combineCost
        : null;

    return {
      slug,
      quantity,
      unitPrice: item.price,
      materialCost,
      combineCost,
      totalCost,
      children,
    };
  }

  const root = items.get(itemSlug);

  if (!root) {
    return {
      itemSlug,
      declaredPrice: null,
      directComponentCost: null,
      baseMaterialsCost: null,
      accumulatedCombineCost: null,
      totalCraftCost: null,
      priceDifference: null,
      missingItems: [itemSlug],
      cycleDetected: false,
      breakdown: [],
    };
  }

  const breakdown = root.components.map((component) =>
    resolve(component.componentSlug, component.quantity, new Set([itemSlug])),
  );

  const directPricesComplete = root.components.every((component) => {
    const price = items.get(component.componentSlug)?.price;
    return price !== null && price !== undefined;
  });

  const directComponentCost = directPricesComplete
    ? root.components.reduce((sum, component) => {
        const price = items.get(component.componentSlug)!.price!;
        return sum + price * component.quantity;
      }, 0)
    : null;

  const baseMaterialsComplete = breakdown.every(
    (node) => node.materialCost !== null,
  );

  const combineCostsComplete =
    root.combineCost !== null &&
    breakdown.every((node) => node.combineCost !== null);

  const baseMaterialsCost = baseMaterialsComplete
    ? breakdown.reduce(
        (sum, node) => sum + (node.materialCost ?? 0),
        0,
      )
    : null;

  const accumulatedCombineCost = combineCostsComplete
    ? breakdown.reduce(
        (sum, node) => sum + (node.combineCost ?? 0),
        0,
      ) + root.combineCost!
    : null;

  const totalCraftCost =
    baseMaterialsCost !== null &&
    accumulatedCombineCost !== null
      ? baseMaterialsCost + accumulatedCombineCost
      : null;

  return {
    itemSlug,
    declaredPrice: root.price,
    directComponentCost,
    baseMaterialsCost,
    accumulatedCombineCost,
    totalCraftCost,
    priceDifference:
      root.price !== null && totalCraftCost !== null
        ? root.price - totalCraftCost
        : null,
    missingItems: [...missingItems],
    cycleDetected,
    breakdown,
  };
}