import fs from "node:fs";
import path from "node:path";

type Item = {
  entity: { name: string; slug: string };
  profile: {
    price: number | null;
    combineCost: number | null;
  };
  recipe: {
    recipeType: string;
    componentCost: number | null;
    components: Array<{
      componentSlug: string;
      quantity: number;
    }>;
  };
};

const file = path.resolve("item-gameplay-final.json");
const items = JSON.parse(fs.readFileSync(file, "utf8")) as Item[];

const bySlug = new Map(items.map((item) => [item.entity.slug, item]));

const results = items.map((item) => {
  const { price, combineCost } = item.profile;
  const { recipeType, componentCost, components } = item.recipe;

  const missingComponents = components.filter(
    (component) => !bySlug.has(component.componentSlug),
  );

  const calculatedComponentCost = components.reduce((total, component) => {
    const source = bySlug.get(component.componentSlug);
    const componentPrice = source?.profile.price;

    if (componentPrice === null || componentPrice === undefined) {
      return total;
    }

    return total + componentPrice * component.quantity;
  }, 0);

  const componentPricesComplete =
    components.length > 0 &&
    missingComponents.length === 0 &&
    components.every((component) => {
      const value = bySlug.get(component.componentSlug)?.profile.price;
      return value !== null && value !== undefined;
    });

  const componentCostMatches =
    componentPricesComplete &&
    componentCost !== null &&
    calculatedComponentCost === componentCost;

  const totalMatches =
    price !== null &&
    combineCost !== null &&
    componentCost !== null &&
    componentCost + combineCost === price;

  let status: string;

  if (recipeType === "COMPOSITE_ITEM") {
    if (missingComponents.length > 0 || !componentPricesComplete) {
      status = "UNKNOWN_COMPONENT_PRICE";
    } else if (componentCost === null || combineCost === null || price === null) {
      status = "MISSING_COST_DATA";
    } else if (!componentCostMatches || !totalMatches) {
      status = "MISMATCH";
    } else {
      status = "PASS";
    }
  } else {
    status = "NOT_APPLICABLE";
  }

  return {
    name: item.entity.name,
    recipeType,
    price,
    componentCost,
    combineCost,
    calculatedComponentCost: componentPricesComplete
      ? calculatedComponentCost
      : null,
    componentCostMatches,
    totalMatches,
    status,
  };
});

const count = (status: string) =>
  results.filter((item) => item.status === status).length;

console.log("\n========== ITEM COST AUDIT ==========");
console.log("Total item:", results.length);
console.log("PASS:", count("PASS"));
console.log("MISMATCH:", count("MISMATCH"));
console.log("MISSING_COST_DATA:", count("MISSING_COST_DATA"));
console.log("UNKNOWN_COMPONENT_PRICE:", count("UNKNOWN_COMPONENT_PRICE"));
console.log("NOT_APPLICABLE:", count("NOT_APPLICABLE"));

console.log("\n========== COMPOSITE ITEM DETAILS ==========");

for (const item of results.filter(
  (result) => result.recipeType === "COMPOSITE_ITEM",
)) {
  console.log(
    `${item.status.padEnd(24)} | ${item.name} | Harga: ${item.price} | Komponen: ${item.componentCost} | Hitung komponen: ${item.calculatedComponentCost} | Gabung: ${item.combineCost}`,
  );
}

const output = path.resolve("item-cost-audit.json");
fs.writeFileSync(output, JSON.stringify(results, null, 2), "utf8");

console.log("\nLaporan tersimpan:", output);