# Glossary

The UI is in Spanish and the code is in English. This table maps one to the other.

| UI (Spanish)     | Code (English)   | Meaning                                                                       |
| ---------------- | ---------------- | ----------------------------------------------------------------------------- |
| Servicio         | `Service`        | One car wash order: a vehicle, a package, optional extras and a total.        |
| Apartado         | `Booking`        | A service reserved online by a customer, without an account.                  |
| Registro tardío  | `backdated`      | A service registered after it happened, with a past date. Audited.            |
| Paquete          | `WashPackage`    | Express, Basic or Plus. Price depends on the vehicle type.                    |
| Extra            | `ExtraService`   | Carpet or upholstery cleaning. Price depends on the vehicle type.             |
| Tipo de vehículo | `VehicleType`    | Sedán, SUV or Pick up.                                                        |
| Placa            | `Plate`          | License plate, normalized: uppercase, no spaces or dashes.                    |
| Segmento         | `segment`        | Private, rideshare platform or taxi. Used to suggest promotions.              |
| Promoción        | `Promotion`      | A discount. The rideshare/taxi promo is a fixed price for Express on a Sedán. |
| Lugar de lavado  | `bay`            | A spot where a car is washed. The car wash has 2.                             |
| Sin cita         | `walk-in`        | A car that arrives without a booking.                                         |
| Corte de caja    | `CashClosure`    | End-of-day cash count compared against registered services.                   |
| Operador         | `operator`       | Panel user who registers services and changes their status.                   |
| Administrador    | `admin`          | Panel user who also manages catalogs and sees reports.                        |
| Material         | `Supply`         | A cleaning product the car wash buys: shampoo, air freshener, cloths.         |
| Proveedor        | `Supplier`       | Where supplies are bought. Only the name is required.                         |
| Compra           | `SupplyPurchase` | One purchase of supplies, with free quantity, unit and price per item.        |

## Service statuses

| UI (Spanish) | Code        | Meaning                                   |
| ------------ | ----------- | ----------------------------------------- |
| En espera    | `waiting`   | The car arrived and is waiting for a bay. |
| Lavando      | `washing`   | Being washed.                             |
| Listo        | `ready`     | Ready to be picked up.                    |
| Entregado    | `delivered` | Picked up and paid.                       |
| Cancelado    | `cancelled` | Cancelled before starting.                |

`scheduled` and `no_show` will be added with online booking.

---
