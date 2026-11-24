import type { Db } from "./db/client.js";
import { DrizzleCatalog } from "./modules/catalog/drizzle.js";
import type { CatalogQueries } from "./modules/catalog/schemas.js";
import { DrizzleReportQueries } from "./modules/reports/drizzle.js";
import type { ReportQueries } from "./modules/reports/schemas.js";
import { RegisterService } from "./modules/services/application/register-service.js";
import {
  DrizzleServiceQueries,
  DrizzleServiceRepository,
  DrizzleVehicleRepository,
} from "./modules/services/infrastructure/drizzle.js";
import type { ServiceQueries } from "./modules/services/infrastructure/schemas.js";
import { RegisterPurchase } from "./modules/supplies/application/register-purchase.js";
import {
  DrizzlePurchaseRepository,
  DrizzleSupplierRepository,
  DrizzleSupplyQueries,
  DrizzleSupplyRepository,
} from "./modules/supplies/infrastructure/drizzle.js";
import type { SupplyQueries } from "./modules/supplies/infrastructure/schemas.js";

// Everything the routes need. Tests build this same object with in-memory fakes.
export interface AppDependencies {
  catalog: CatalogQueries;
  registerService: RegisterService;
  serviceQueries: ServiceQueries;
  registerPurchase: RegisterPurchase;
  supplyQueries: SupplyQueries;
  reports: ReportQueries;
}

// Composition root: the one place that decides which adapter goes into each port.
// Like the register() method of a Laravel ServiceProvider.
export function createContainer(db: Db): AppDependencies {
  const catalog = new DrizzleCatalog(db);

  return {
    catalog,
    registerService: new RegisterService({
      catalog,
      vehicles: new DrizzleVehicleRepository(db),
      services: new DrizzleServiceRepository(db),
    }),
    serviceQueries: new DrizzleServiceQueries(db),
    registerPurchase: new RegisterPurchase({
      suppliers: new DrizzleSupplierRepository(db),
      supplies: new DrizzleSupplyRepository(db),
      purchases: new DrizzlePurchaseRepository(db),
    }),
    supplyQueries: new DrizzleSupplyQueries(db),
    reports: new DrizzleReportQueries(db),
  };
}
